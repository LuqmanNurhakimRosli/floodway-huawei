// Flood areas for the map and for "your risk", built with the web app's own rules (shared.ts): camera zones at
// WARNING or DANGER, areas from recent verified reports, and the hand-placed demo flood-prone areas (drawn faint and
// dashed, and never counted as flooding).
import {
  areaLabel,
  buildVerifiedAreas,
  deriveHazards,
  FLOOD_PRONE,
  LEVEL_PALETTE,
  riskAt,
  type Camera,
  type CitizenReport,
  type Risk,
  type Zone,
} from '../shared';
import type { MapPayload } from '../map/mapHtml';

export type MapZone = MapPayload['zones'][number];

export function floodZones(cameras: Camera[], reports: CitizenReport[], now = Date.now()): MapZone[] {
  const cams: MapZone[] = deriveHazards(cameras).map((h) => ({
    id: `cam-${h.cameraId}`,
    lat: h.lat,
    lon: h.lon,
    radiusM: h.radiusM,
    kind: 'camera',
    color: LEVEL_PALETTE[h.level].marker,
    label: `${h.name}: ${h.level === 'DANGER' ? 'Danger' : 'Warning'} (camera reading)`,
  }));
  const reps: MapZone[] = buildVerifiedAreas(reports, now).map((a) => ({
    id: `rep-${a.id}`,
    lat: a.lat,
    lon: a.lon,
    radiusM: a.radiusM,
    kind: 'report',
    color: a.tone === 'red' ? '#DC2626' : '#D97706',
    label: areaLabel(a),
  }));
  return [...cams, ...reps];
}

export function demoAreas(): MapZone[] {
  return FLOOD_PRONE.map((a) => ({ id: `demo-${a.id}`, lat: a.lat, lon: a.lon, radiusM: a.radiusM, kind: 'demo', color: '#0284C7', label: `${a.name} (demo flood-prone area, illustrative)` }));
}

/** Your flood risk from real zones only (cameras and verified reports, not the demo areas). */
export function myRisk(pos: { lat: number; lon: number } | null, zones: MapZone[]): { risk: Risk; edgeM: number | null } | null {
  if (!pos) return null;
  const real: Zone[] = zones.filter((z) => z.kind !== 'demo');
  const r = riskAt([pos.lat, pos.lon], real);
  return { risk: r.risk, edgeM: r.edgeM };
}
