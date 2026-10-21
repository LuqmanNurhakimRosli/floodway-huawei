import { describe, expect, it } from 'vitest';
import { closedBarrierZones, evaluateBarrier, parseTrigger, SEED_BARRIERS } from '../lib/vision/barriers';
import { rankRoutes, type RoadRoute } from '../lib/routing';

const b01 = () => ({ ...SEED_BARRIERS[0] });

describe('barrier rule (offline mirror of the server)', () => {
  it('closes on DANGER from its own trigger only', () => {
    expect(evaluateBarrier(b01(), 'camera:other', 'DANGER', 1.0, 't').event).toBeNull();
    const out = evaluateBarrier(b01(), 'camera:sample-klang-jamek', 'DANGER', 1.02, 't1');
    expect(out.barrier.state).toBe('CLOSED');
    expect(out.event?.reason).toMatch(/DANGER \(102% of bank height\)/);
  });
  it('stays closed at WARNING and reopens at ADVISORY', () => {
    const closed = evaluateBarrier(b01(), 'camera:sample-klang-jamek', 'DANGER', 1.0, 't1').barrier;
    expect(evaluateBarrier(closed, 'camera:sample-klang-jamek', 'WARNING', 0.8, 't2').barrier.state).toBe('CLOSED');
    expect(evaluateBarrier(closed, 'camera:sample-klang-jamek', 'ADVISORY', 0.4, 't3').barrier.state).toBe('OPEN');
  });
  it('ignores readings in manual mode', () => {
    const manual = { ...b01(), mode: 'manual' as const };
    expect(evaluateBarrier(manual, 'camera:sample-klang-jamek', 'DANGER', 1.0, 't').barrier.state).toBe('OPEN');
  });
  it('parses triggers', () => {
    expect(parseTrigger('node:fw-node-03')).toEqual({ kind: 'node', id: 'fw-node-03' });
  });
});

describe('routing with closed barriers', () => {
  const route = (id: number, lat: number, durationS: number): RoadRoute => ({
    distanceM: 1000, durationS, steps: [], line: [[lat, 101.69], [lat, 101.70]],
  });
  it('lists a route through a closed barrier last, even when it is quickest', () => {
    const through = route(0, 3.1517, 100); // passes the barrier point
    const around = route(1, 3.16, 400);
    const closed = { ...b01(), state: 'CLOSED' as const };
    const ranked = rankRoutes([through, around], [], closedBarrierZones([closed]));
    expect(ranked[0].index).toBe(1);
    expect(ranked[1].blockedBy).toEqual(['barrier-B-01']);
  });
  it('an open barrier blocks nothing', () => {
    expect(closedBarrierZones(SEED_BARRIERS)).toEqual([]);
  });
});
