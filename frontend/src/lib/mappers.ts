// The backend speaks snake_case and does not send distance or travel time; the UI types are camelCase.
// These mappers are the one place that difference is handled.
import type { CitizenReport, Shelter } from '../types';
import { haversineKm } from './vision/geo';
import { safeNumber } from './format';

/** Where "you" are in the demo (Kampung Baru), the same start point ShelterMapView draws its routes from. */
export const DEMO_ORIGIN = { lat: 3.161, lon: 101.7005 };

export type TravelMode = 'car' | 'bike' | 'walk';
const SPEED_KMH: Record<TravelMode, number> = { car: 35, bike: 45, walk: 4.5 };

/** Straight-line distance divided by an assumed speed. An ESTIMATE, not routing: label it "~" in the UI. */
export function estimateEtaMin(km: number | null, mode: TravelMode = 'car'): number | null {
  const d = safeNumber(km);
  return d === null ? null : Math.max(1, Math.round((d / SPEED_KMH[mode]) * 60));
}

type Raw = Record<string, unknown>;
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback = 0): number => safeNumber(v) ?? fallback;

const SHELTER_STATUS = ['OPEN', 'FULL', 'STANDBY', 'CLOSED'] as const;
const ROUTE_STATUS = ['CLEAR', 'ADVISORY', 'BLOCKED'] as const;
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

/** Accepts the backend's snake_case shape or an already-mapped camelCase shelter. */
export function mapShelter(raw: Raw, origin = DEMO_ORIGIN): Shelter {
  const lat = num(raw.lat);
  const lon = num(raw.lon);
  const distanceKm = safeNumber(raw.distanceKm) ?? Math.round(haversineKm(origin.lat, origin.lon, lat, lon) * 10) / 10;
  return {
    id: str(raw.id),
    name: str(raw.name, 'Unnamed shelter'),
    category: str(raw.category, 'Shelter'),
    lat,
    lon,
    address: str(raw.address),
    status: pick(raw.status, SHELTER_STATUS, 'STANDBY'),
    currentCapacity: num(raw.currentCapacity ?? raw.current_capacity),
    maxCapacity: num(raw.maxCapacity ?? raw.max_capacity),
    contact: str(raw.contact),
    facilities: Array.isArray(raw.facilities) ? raw.facilities.filter((f): f is string => typeof f === 'string') : [],
    elevationM: num(raw.elevationM ?? raw.elevation_m),
    routeStatus: pick(raw.routeStatus ?? raw.route_status, ROUTE_STATUS, 'ADVISORY'),
    distanceKm,
    travelTimeMin: safeNumber(raw.travelTimeMin) ?? estimateEtaMin(distanceKm, 'car') ?? 0,
  };
}

/** The backend serves `/assets/<file>`; the files live at the site root. */
export function normalizeImageUrl(url: unknown): string | undefined {
  if (typeof url !== 'string' || url.trim() === '') return undefined;
  return url.startsWith('/assets/') ? url.slice('/assets'.length) : url;
}

/** ms since epoch from a number (ms or s) or a date string; undefined when unreadable. */
function timeOf(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v < 1e12 ? v * 1000 : v;
  if (typeof v === 'string' && v.trim()) {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : undefined;
  }
  return undefined;
}

const REPORT_STATUS = ['OFFICIAL_VERIFIED', 'AI_VERIFIED', 'VERIFIED', 'UNDER_REVIEW', 'REJECTED'] as const;

export function mapReport(raw: Raw): CitizenReport {
  return {
    id: str(raw.id),
    title: str(raw.title, 'Untitled report'),
    location: str(raw.location),
    lat: num(raw.lat),
    lon: num(raw.lon),
    // Unknown depth stays NaN-free: 0 would claim "dry", so keep the raw value and let formatCm() show a dash.
    waterDepthCm: (safeNumber(raw.waterDepthCm ?? raw.water_depth_cm) ?? Number.NaN),
    status: pick(raw.status, REPORT_STATUS, 'UNDER_REVIEW'),
    verifiedBy: str(raw.verifiedBy ?? raw.verified_by),
    timestampStr: str(raw.timestampStr ?? raw.timestamp_str),
    createdAt: timeOf(raw.createdAt ?? raw.created_at),
    author: str(raw.author, 'Anonymous'),
    upvotes: num(raw.upvotes),
    imageUrl: normalizeImageUrl(raw.imageUrl ?? raw.image_url),
    description: typeof raw.description === 'string' ? raw.description : undefined,
    aiVerification: raw.aiVerification as CitizenReport['aiVerification'],
    humanVerification: raw.humanVerification as CitizenReport['humanVerification'],
  };
}
