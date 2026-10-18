import type { Barrier, BarrierEvent, Level } from '../../types/vision';
import type { Zone } from '../routing';
import { levelRank } from './levels';

/**
 * The two SIMULATED demo barriers, mirrored from backend/app/vision/seed.py so the page still shows the loop when the
 * server is unreachable (sample data). Sites are illustrative points on stored demo routes, not surveyed underpasses.
 */
export const SEED_BARRIERS: Barrier[] = [
  {
    id: 'B-01', name: 'Underpass B-01, west of Masjid Jamek (demo)', lat: 3.1517, lon: 101.6931, radius_m: 120,
    trigger: 'camera:sample-klang-jamek', trigger_name: 'Sg. Klang @ Masjid Jamek (sample camera)', mode: 'auto',
    state: 'OPEN', changed_at: null, reason: 'No closure since the page loaded.', last_level: null, is_simulated: true,
  },
  {
    id: 'B-02', name: 'Jalan Kuching underpass B-02 (demo)', lat: 3.1832, lon: 101.6809, radius_m: 120,
    trigger: 'node:fw-node-03', trigger_name: 'Underpass depth node fw-node-03', mode: 'auto',
    state: 'OPEN', changed_at: null, reason: 'Waiting for the depth node. It reports only when a bench node is connected.',
    last_level: null, is_simulated: true,
  },
];

/**
 * The same rule as the server (barriers.py): in auto mode DANGER closes, ADVISORY or below reopens.
 * Used only for the offline sample feed; with a server, its own decisions arrive over the socket.
 */
export function evaluateBarrier(b: Barrier, trigger: string, level: Level, ratio: number, ts: string): { barrier: Barrier; event: BarrierEvent | null } {
  if (b.trigger !== trigger) return { barrier: b, event: null };
  const next: Barrier = { ...b, last_level: level };
  if (b.mode !== 'auto') return { barrier: next, event: null };
  const pct = `${Math.round(ratio * 100)}% of bank height`;
  let state: Barrier['state'] | null = null;
  let reason = '';
  if (level === 'DANGER' && b.state === 'OPEN') {
    state = 'CLOSED';
    reason = `${b.trigger_name} reached DANGER (${pct}).`;
  } else if (b.state === 'CLOSED' && levelRank(level) <= levelRank('ADVISORY')) {
    state = 'OPEN';
    reason = `${b.trigger_name} fell back to ${level} (${pct}).`;
  }
  if (!state) return { barrier: next, event: null };
  const changed: Barrier = { ...next, state, reason, changed_at: ts };
  return {
    barrier: changed,
    event: {
      id: `local-${b.id}-${ts}`, barrier_id: b.id, barrier_name: b.name, state, cause: 'auto', reason, timestamp: ts,
      trigger, level, value: Number(ratio.toFixed(3)),
    },
  };
}

/** Closed barriers as zones that routing must treat as impassable. */
export const closedBarrierZones = (barriers: Barrier[]): Zone[] =>
  barriers.filter((b) => b.state === 'CLOSED').map((b) => ({ id: `barrier-${b.id}`, lat: b.lat, lon: b.lon, radiusM: b.radius_m }));

/** "camera:sample-klang-jamek" -> { kind: 'camera', id: 'sample-klang-jamek' } */
export function parseTrigger(trigger: string): { kind: 'camera' | 'node'; id: string } {
  const [kind, ...rest] = trigger.split(':');
  return { kind: kind === 'node' ? 'node' : 'camera', id: rest.join(':') };
}
