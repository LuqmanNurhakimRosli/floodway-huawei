import { describe, expect, it } from 'vitest';
import data from '../data/klRoutes.json';
import shelters from '../data/kl_shelters.json';
import { FLOOD_PRONE, ORIGINS } from '../data/klDemo';
import { etaMin, lineLengthM, pointAtDistance, rankRoutes, stepAt, toRoadRoute, zonesCrossed, type LatLon } from '../lib/routing';

const east = (m: number): LatLon => [3.15, 101.7 + m / (111320 * Math.cos((3.15 * Math.PI) / 180))];

describe('zonesCrossed', () => {
  const line: LatLon[] = [east(0), east(1000)];
  it('detects a zone sitting on the line and ignores a far one', () => {
    const near = { id: 'near', lat: 3.15, lon: east(500)[1], radiusM: 100 };
    const far = { id: 'far', lat: 3.16, lon: east(500)[1], radiusM: 100 };
    expect(zonesCrossed(line, [near, far])).toEqual(['near']);
  });
  it('counts a zone beside the road only when the circle reaches it', () => {
    const beside = { id: 'b', lat: 3.15 + 150 / 111320, lon: east(500)[1], radiusM: 100 };
    expect(zonesCrossed(line, [beside])).toEqual([]);
    expect(zonesCrossed(line, [{ ...beside, radiusM: 160 }])).toEqual(['b']);
  });
});

describe('rankRoutes', () => {
  const mk = (durationS: number, line: LatLon[]) => toRoadRoute({ d: 1000, t: durationS, line, steps: [] });
  it('prefers fewer flood crossings over speed, then the faster one', () => {
    const zone = { id: 'z', lat: 3.15, lon: east(500)[1], radiusM: 80 };
    const fastButWet = mk(300, [east(0), east(1000)]);
    const slowButDry: LatLon[] = [[3.152, east(0)[1]], [3.152, east(1000)[1]]];
    const ranked = rankRoutes([fastButWet, mk(500, slowButDry)], [zone]);
    expect(ranked[0].durationS).toBe(500);
    expect(ranked[0].crossings).toBe(0);
    expect(ranked[1].crossings).toBe(1);
  });
  it('breaks ties by time', () => {
    const ranked = rankRoutes([mk(600, [east(0), east(1000)]), mk(400, [east(0), east(900)])], []);
    expect(ranked.map((r) => r.durationS)).toEqual([400, 600]);
  });
});

describe('pointAtDistance and stepAt', () => {
  const line: LatLon[] = [east(0), east(1000), [east(1000)[0] + 500 / 111320, east(1000)[1]]];
  it('walks along the line by metres', () => {
    expect(lineLengthM(line)).toBeCloseTo(1500, -1);
    const mid = pointAtDistance(line, 500);
    expect(mid.segment).toBe(0);
    expect(mid.pos[1]).toBeCloseTo(east(500)[1], 4);
    expect(pointAtDistance(line, 99999).pos).toEqual(line[2]);
  });
  it('finds the current and next step', () => {
    const route = toRoadRoute({ d: 1500, t: 100, line, steps: [[0, 'Start', 0, 0, 1000], [1000, 'Turn left', 0, 0, 500]] });
    expect(stepAt(route, 400).current.text).toBe('Start');
    expect(stepAt(route, 400).toNextM).toBe(600);
    expect(stepAt(route, 1200).current.text).toBe('Turn left');
    expect(stepAt(route, 1200).next).toBeNull();
  });
});

describe('etaMin', () => {
  it('uses OSRM time for cars and rough speeds otherwise', () => {
    const r = { distanceM: 5000, durationS: 600 };
    expect(etaMin(r, 'car')).toBe(10);
    expect(etaMin(r, 'walk')).toBe(60);
    expect(etaMin(r, 'bike')).toBe(20);
  });
});

describe('precomputed Kuala Lumpur routes', () => {
  const routes = data.routes as Record<string, { d: number; line: number[][]; steps: unknown[][] }[]>;
  it('covers every origin and shelter with at least one road route', () => {
    for (const o of ORIGINS) for (const s of shelters) expect(routes[`${o.id}|${s.id}`]?.length, `${o.id}|${s.id}`).toBeGreaterThan(0);
  });
  it('follows roads: more than a two-point line, with turn steps', () => {
    for (const list of Object.values(routes)) for (const r of list) {
      expect(r.line.length).toBeGreaterThan(3);
      expect(r.steps.length).toBeGreaterThan(1);
    }
  });
  it('keeps every route inside Kuala Lumpur and near the straight-line distance', () => {
    for (const [key, list] of Object.entries(routes)) {
      for (const r of list) {
        for (const [lat, lon] of r.line) {
          expect(lat > 3.0 && lat < 3.3 && lon > 101.55 && lon < 101.8, key).toBe(true);
        }
        expect(r.d, key).toBeLessThan(40000);
      }
    }
  });
  it('has a meaningful set of flood-prone areas, all in Kuala Lumpur', () => {
    expect(FLOOD_PRONE.length).toBeGreaterThanOrEqual(15);
    for (const f of FLOOD_PRONE) expect(f.lat > 3.05 && f.lat < 3.25 && f.lon > 101.6 && f.lon < 101.78, f.name).toBe(true);
  });
  it('is usable for choosing: at least one pair changes its answer when flooding is on', () => {
    const zones = FLOOD_PRONE.map((f) => ({ id: f.id, lat: f.lat, lon: f.lon, radiusM: f.radiusM * 1.35 }));
    let different = 0, crossing = 0;
    for (const list of Object.values(routes)) {
      const ranked = rankRoutes(list.map((r) => toRoadRoute(r as never)), zones);
      if (ranked.some((r) => r.crossings > 0)) crossing++;
      if (ranked[0].index !== 0) different++;
    }
    expect(crossing).toBeGreaterThan(5);
    expect(different).toBeGreaterThan(0);
  });
});
