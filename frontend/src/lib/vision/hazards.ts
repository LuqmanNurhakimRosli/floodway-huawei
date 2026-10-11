import type { Camera, Level } from '../../types/vision';
import { isAlertLevel } from './levels';

/** A flood zone the evacuation map should route around. Derived from cameras at WARNING or DANGER. */
export interface VisionHazard {
  cameraId: string;
  name: string;
  lat: number;
  lon: number;
  level: Level;
  waterRatio: number;
  radiusM: number;
}

const RADIUS_BY_LEVEL: Partial<Record<Level, number>> = { WARNING: 120, DANGER: 250 };

/** Stable identity for a set of hazards: changes when a zone appears, disappears or changes level, not on every reading. */
export const hazardsKey = (hazards: VisionHazard[]): string => hazards.map((h) => `${h.cameraId}:${h.level}`).sort().join('|');

type LatLon = [number, number];
type XY = [number, number];

/**
 * Bend a route polyline around vision flood zones. Each segment that passes through a zone (circle + margin) gets two
 * waypoints that skirt the zone on the side the segment was already closest to. Segments that start or end inside a
 * zone are left alone: the user or the shelter is in it, and there is no way around. Pure and synchronous, so it is
 * cheap to rerun when a zone appears. This is geometric avoidance on a drawn route, not road-network routing.
 */
export function detourAroundHazards(route: LatLon[], hazards: VisionHazard[], marginM = 60): { route: LatLon[]; avoided: string[] } {
  if (route.length < 2 || hazards.length === 0) return { route, avoided: [] };
  // Local flat projection in metres around the start: accurate enough over a city.
  const kx = 111320 * Math.cos((route[0][0] * Math.PI) / 180);
  const ky = 110540;
  const toXY = ([lat, lon]: LatLon): XY => [lon * kx, lat * ky];
  const toLatLon = ([x, y]: XY): LatLon => [y / ky, x / kx];
  const dist = (a: XY, b: XY) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  let pts = route.map(toXY);
  const original = new Map<XY, LatLon>(pts.map((p, i) => [p, route[i]])); // keep input points exact
  const avoided = new Set<string>();
  for (let pass = 0; pass < 2; pass++) {
    for (const h of hazards) {
      const c = toXY([h.lat, h.lon]);
      const r = h.radiusM + marginM;
      const out: XY[] = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1];
        const b = pts[i];
        const len = dist(a, b);
        if (len === 0 || dist(a, c) < r || dist(b, c) < r) { out.push(b); continue; }
        const u: XY = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
        const t = (c[0] - a[0]) * u[0] + (c[1] - a[1]) * u[1];
        const p: XY = [a[0] + u[0] * t, a[1] + u[1] * t];
        if (t <= 0 || t >= len || dist(p, c) >= r) { out.push(b); continue; }
        let n: XY = [p[0] - c[0], p[1] - c[1]];
        const nl = Math.hypot(n[0], n[1]);
        n = nl < 1e-6 ? [-u[1], u[0]] : [n[0] / nl, n[1] / nl];
        const off = r * 1.15;
        out.push([c[0] + n[0] * off - u[0] * r, c[1] + n[1] * off - u[1] * r], [c[0] + n[0] * off + u[0] * r, c[1] + n[1] * off + u[1] * r], b);
        avoided.add(h.cameraId);
      }
      pts = out;
    }
  }
  return avoided.size ? { route: pts.map((p) => original.get(p) ?? toLatLon(p)), avoided: [...avoided] } : { route, avoided: [] };
}

export function deriveHazards(cameras: Camera[]): VisionHazard[] {
  const out: VisionHazard[] = [];
  for (const c of cameras) {
    const r = c.reading;
    if (!c.online || !r || !isAlertLevel(r.level)) continue;
    out.push({ cameraId: c.id, name: c.name, lat: c.lat, lon: c.lon, level: r.level, waterRatio: r.water_ratio, radiusM: RADIUS_BY_LEVEL[r.level] ?? 120 });
  }
  return out;
}
