import type { TravelMode } from './mappers';

export type LatLon = [number, number];

export interface RouteStep {
  /** Metres from the start of the route to this manoeuvre. */
  at: number;
  text: string;
  lat: number;
  lon: number;
  /** Length of this step in metres. */
  len: number;
}

export interface RoadRoute {
  distanceM: number;
  /** Car travel time in seconds, from OSRM. */
  durationS: number;
  line: LatLon[];
  steps: RouteStep[];
}

export interface Zone {
  id: string;
  lat: number;
  lon: number;
  radiusM: number;
}

export interface ScoredRoute extends RoadRoute {
  index: number;
  /** Number of distinct flood zones this route passes through. */
  crossings: number;
  crossedIds: string[];
  /** Closed underpass barriers on this route. A blocked route cannot be driven at all. */
  blockedBy: string[];
}

type RawRoute = { d: number; t: number; line: LatLon[]; steps: [number, string, number, number, number][] };

export function toRoadRoute(raw: RawRoute): RoadRoute {
  return {
    distanceM: raw.d,
    durationS: raw.t,
    line: raw.line,
    steps: raw.steps.map(([at, text, lat, lon, len]) => ({ at, text, lat, lon, len })),
  };
}

export function haversineM(a: LatLon, b: LatLon): number {
  const R = 6371000, r = Math.PI / 180;
  const dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Shortest distance in metres from point p to the segment a-b (local flat approximation, fine at city scale). */
export function distToSegmentM(p: LatLon, a: LatLon, b: LatLon): number {
  const k = 111320, c = Math.cos((p[0] * Math.PI) / 180);
  const px = p[1] * k * c, py = p[0] * k;
  const ax = a[1] * k * c, ay = a[0] * k, bx = b[1] * k * c, by = b[0] * k;
  const dx = bx - ax, dy = by - ay, len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function zonesCrossed(line: LatLon[], zones: Zone[]): string[] {
  const hit: string[] = [];
  for (const z of zones) {
    const c: LatLon = [z.lat, z.lon];
    for (let i = 1; i < line.length; i++) {
      if (distToSegmentM(c, line[i - 1], line[i]) <= z.radiusM) {
        hit.push(z.id);
        break;
      }
    }
  }
  return hit;
}

/**
 * Open routes before routes through a closed barrier; then fewest flood zones; ties go to the quicker route.
 * Never hides a route: the caller shows the crossing count and any closed barrier.
 */
export function rankRoutes(routes: RoadRoute[], zones: Zone[], closures: Zone[] = []): ScoredRoute[] {
  return routes
    .map((r, index) => {
      const crossedIds = zonesCrossed(r.line, zones);
      return { ...r, index, crossings: crossedIds.length, crossedIds, blockedBy: zonesCrossed(r.line, closures) };
    })
    .sort((a, b) => Number(a.blockedBy.length > 0) - Number(b.blockedBy.length > 0) || a.crossings - b.crossings || a.durationS - b.durationS);
}

/** Position along the line after `distM` metres (clamped), plus the heading-ready index of the segment. */
export function pointAtDistance(line: LatLon[], distM: number): { pos: LatLon; segment: number } {
  if (line.length === 0) return { pos: [0, 0], segment: 0 };
  let left = Math.max(0, distM);
  for (let i = 1; i < line.length; i++) {
    const seg = haversineM(line[i - 1], line[i]);
    if (left <= seg || i === line.length - 1) {
      const t = seg === 0 ? 1 : Math.min(1, left / seg);
      return {
        pos: [line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t],
        segment: i - 1,
      };
    }
    left -= seg;
  }
  return { pos: line[line.length - 1], segment: line.length - 2 };
}

export function lineLengthM(line: LatLon[]): number {
  let total = 0;
  for (let i = 1; i < line.length; i++) total += haversineM(line[i - 1], line[i]);
  return total;
}

/** The step the driver is on, the next manoeuvre, and metres until it. */
export function stepAt(route: RoadRoute, travelledM: number) {
  const { steps } = route;
  let current = 0;
  for (let i = 0; i < steps.length; i++) if (steps[i].at <= travelledM) current = i;
  const next = steps[current + 1] ?? null;
  return { current: steps[current], next, toNextM: next ? Math.max(0, next.at - travelledM) : Math.max(0, route.distanceM - travelledM) };
}

/** Car time comes from OSRM; the other modes are rough fixed speeds, so they are labelled estimates in the UI. */
export function etaMin(route: Pick<RoadRoute, 'distanceM' | 'durationS'>, mode: TravelMode): number {
  if (mode === 'walk') return Math.max(1, Math.round(route.distanceM / 1000 / 5 * 60));
  if (mode === 'bike') return Math.max(1, Math.round(route.distanceM / 1000 / 15 * 60));
  return Math.max(1, Math.round(route.durationS / 60));
}
