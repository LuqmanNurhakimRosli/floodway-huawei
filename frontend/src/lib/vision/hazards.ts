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

export function deriveHazards(cameras: Camera[]): VisionHazard[] {
  const out: VisionHazard[] = [];
  for (const c of cameras) {
    const r = c.reading;
    if (!c.online || !r || !isAlertLevel(r.level)) continue;
    out.push({ cameraId: c.id, name: c.name, lat: c.lat, lon: c.lon, level: r.level, waterRatio: r.water_ratio, radiusM: RADIUS_BY_LEVEL[r.level] ?? 120 });
  }
  return out;
}
