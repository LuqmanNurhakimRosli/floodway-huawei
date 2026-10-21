import { ORIGINS } from '../data/klDemo';
import { haversineM, lineLengthM, pointAtDistance, type LatLon, type Zone } from './routing';

/**
 * Family circle: where the people you care about are, and how close each one is to flooding. Pure helpers only; the
 * live state (demo movement, your phone's location, check-ins) is in services/family/familyStore.ts.
 */

export type MemberStatus = 'ok' | 'checked-in' | 'sos';
/** Where a member's position comes from. Only 'gps' is a real reading (your own phone, with your permission). */
export type PositionSource = 'gps' | 'demo';

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  /** Avatar gradient, two hex colours. */
  colors: [string, string];
  avatar?: string;
  isYou?: boolean;
  lat: number;
  lon: number;
  source: PositionSource;
  battery: number;
  charging?: boolean;
  /** When the position was last updated (ms). */
  updatedAt: number;
  /** When the member arrived at the current spot (ms). Moving members have no arrival time. */
  since: number | null;
  /** Moving, with a speed in km/h. */
  speedKmh?: number;
  status: MemberStatus;
  statusAt?: number;
}

export type PlaceKind = 'home' | 'school' | 'work' | 'family';

export interface Place {
  id: string;
  name: string;
  kind: PlaceKind;
  lat: number;
  lon: number;
  radiusM: number;
  /** Notify the circle when someone arrives or leaves. */
  alerts: boolean;
}

export interface Circle {
  id: string;
  name: string;
  memberIds: string[];
}

export type EventKind = 'arrived' | 'left' | 'check-in' | 'sos' | 'safe' | 'flood' | 'route' | 'ask';

export interface CircleEvent {
  id: string;
  at: number;
  memberId: string;
  kind: EventKind;
  text: string;
}

export type Risk = 'flooded' | 'near' | 'clear';

/** Distance from the edge of a flood zone that still counts as "near" (a short walk or one street). */
export const NEAR_M = 300;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase();
}

export function riskAt(pos: LatLon, zones: Zone[]): { risk: Risk; zoneId: string | null; edgeM: number | null } {
  let best: { id: string; edge: number } | null = null;
  for (const z of zones) {
    const edge = haversineM(pos, [z.lat, z.lon]) - z.radiusM;
    if (!best || edge < best.edge) best = { id: z.id, edge };
  }
  if (!best) return { risk: 'clear', zoneId: null, edgeM: null };
  if (best.edge <= 0) return { risk: 'flooded', zoneId: best.id, edgeM: 0 };
  if (best.edge <= NEAR_M) return { risk: 'near', zoneId: best.id, edgeM: Math.round(best.edge) };
  return { risk: 'clear', zoneId: null, edgeM: Math.round(best.edge) };
}

export function placeAt(pos: LatLon, places: Place[]): Place | null {
  let hit: { p: Place; d: number } | null = null;
  for (const p of places) {
    const d = haversineM(pos, [p.lat, p.lon]);
    if (d <= p.radiusM && (!hit || d < hit.d)) hit = { p, d };
  }
  return hit?.p ?? null;
}

/** The nearest relief centre that can still take people, by straight-line distance. */
export function nearestOpenCentre<T extends { lat: number; lon: number; status: string }>(pos: LatLon, centres: T[]): { centre: T; distanceM: number } | null {
  let best: { centre: T; distanceM: number } | null = null;
  for (const c of centres) {
    if (c.status === 'FULL' || c.status === 'CLOSED') continue;
    const d = haversineM(pos, [c.lat, c.lon]);
    if (!best || d < best.distanceM) best = { centre: c, distanceM: d };
  }
  return best;
}

/** The demo start point closest to a position, so a member's evacuation route can use the stored road routes. */
export function nearestOriginId(pos: LatLon): string {
  let best = ORIGINS[0];
  let bestD = Infinity;
  for (const o of ORIGINS) {
    const d = haversineM(pos, [o.lat, o.lon]);
    if (d < bestD) {
      best = o;
      bestD = d;
    }
  }
  return best.id;
}

/** A short "where" line: the place they are at, else the nearest demo neighbourhood. No street lookup is made. */
export function whereText(m: Pick<FamilyMember, 'lat' | 'lon' | 'speedKmh'>, places: Place[]): string {
  const pos: LatLon = [m.lat, m.lon];
  const place = placeAt(pos, places);
  const o = ORIGINS.find((x) => x.id === nearestOriginId(pos))!;
  const far = haversineM(pos, [o.lat, o.lon]) > 5000;
  if ((m.speedKmh ?? 0) > 3) return far ? `Driving, ${m.speedKmh} km/h` : `Driving near ${o.label}, ${m.speedKmh} km/h`;
  if (place) return `At ${place.name}`;
  return far ? 'Outside the Kuala Lumpur demo area' : `Near ${o.label}`;
}

const clock = (t: number) => new Date(t).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', hour12: false });

function sameDay(a: number, b: number): boolean {
  const x = new Date(a);
  const y = new Date(b);
  return x.getFullYear() === y.getFullYear() && x.getMonth() === y.getMonth() && x.getDate() === y.getDate();
}

/** "Here for 4 min", "Since 19:26", "Since 19:26 yesterday" or "Since 12 Oct". */
export function sinceText(since: number, now = Date.now()): string {
  const min = Math.max(0, Math.floor((now - since) / 60000));
  if (min < 60) return `Here for ${Math.max(1, min)} min`;
  if (sameDay(since, now)) return `Since ${clock(since)}`;
  if (sameDay(since, now - 86400000)) return `Since ${clock(since)} yesterday`;
  return `Since ${new Date(since).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}`;
}

/** "Just now", "3 min ago", "2 h ago". */
export function agoText(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - at) / 1000));
  if (s < 45) return 'Just now';
  const min = Math.round(s / 60);
  if (min < 60) return `${min} min ago`;
  return `${Math.round(min / 60)} h ago`;
}

export function fmtDistance(m: number): string {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

export interface CircleSummary {
  total: number;
  sos: number;
  flooded: number;
  near: number;
  /** Members that are fine right now (no SOS, not in or near a flood zone). */
  safe: number;
}

export function summarise(members: FamilyMember[], zones: Zone[]): CircleSummary {
  let sos = 0;
  let flooded = 0;
  let near = 0;
  for (const m of members) {
    if (m.status === 'sos') sos++;
    const r = riskAt([m.lat, m.lon], zones).risk;
    if (r === 'flooded') flooded++;
    else if (r === 'near') near++;
  }
  const atRisk = members.filter((m) => m.status === 'sos' || riskAt([m.lat, m.lon], zones).risk !== 'clear').length;
  return { total: members.length, sos, flooded, near, safe: members.length - atRisk };
}

/** Members ordered for the list: SOS first, then flooded, near, and everyone else (you last, as in most family apps). */
export function sortMembers(members: FamilyMember[], zones: Zone[]): FamilyMember[] {
  const rank = (m: FamilyMember) => {
    if (m.status === 'sos') return 0;
    const r = riskAt([m.lat, m.lon], zones).risk;
    return r === 'flooded' ? 1 : r === 'near' ? 2 : m.isYou ? 4 : 3;
  };
  return [...members].sort((a, b) => rank(a) - rank(b));
}

/** Position on a back-and-forth trip along a line: `t` is seconds, `periodS` one full round trip. */
export function pingPong(line: LatLon[], t: number, periodS: number): { pos: LatLon; heading: 1 | -1 } {
  const len = lineLengthM(line);
  const phase = ((t % periodS) + periodS) % periodS / periodS; // 0..1
  const forward = phase < 0.5;
  const f = forward ? phase * 2 : 2 - phase * 2;
  return { pos: pointAtDistance(line, f * len).pos, heading: forward ? 1 : -1 };
}

/** Whether a member moved into or out of a place between two positions. */
export function placeChange(prev: LatLon, next: LatLon, places: Place[]): { left: Place | null; arrived: Place | null } {
  const a = placeAt(prev, places);
  const b = placeAt(next, places);
  if (a?.id === b?.id) return { left: null, arrived: null };
  return { left: a, arrived: b };
}
