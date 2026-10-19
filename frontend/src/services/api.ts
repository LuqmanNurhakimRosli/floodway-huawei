import { Shelter, CitizenReport, ForecastData } from '../types';
import { mapReport, mapShelter } from '../lib/mappers';
import { API_BASE } from './vision/config';
import klShelters from '../data/kl_shelters.json';

// One backend address for everything: VITE_API_BASE, or http://localhost:8080 in development. (This used to be a
// hard-coded localhost:8080, so a deployment that set VITE_API_BASE reached the wrong server for shelters and reports.)
const BACKEND_URL = `${API_BASE}/api/v1`;

export async function fetchTwinState(deviceId = 'fw-node-01') {
  try {
    const res = await fetch(`${BACKEND_URL}/twin/state?device_id=${deviceId}`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch (e) {
    // Graceful fallback to calibrated default
  }
  return {
    device_id: deviceId,
    station_name: 'Kampung Baru Station (Klang River)',
    water_level_m: 1.20,
    water_depth_cm: 120.0,
    rainfall_rate_mm_hr: 95.0,
    phase: 'DANGER',
    is_stale: false,
    forecast: {
      source: 'Rule-based hydrologic estimate (not a trained model)',
      horizons_min: [0, 15, 30, 45, 60, 90, 120],
      p10: [1.20, 1.25, 1.34, 1.45, 1.55, 1.68, 1.75],
      p50: [1.20, 1.31, 1.48, 1.58, 1.65, 1.82, 1.91],
      p90: [1.20, 1.38, 1.59, 1.72, 1.81, 2.05, 2.18],
      peak_level_m: 1.91,
      time_to_peak_min: 120,
      time_to_danger_min: 45,
      confidence_score: 0.88,
      method: 'Hand-written hydrologic formula on simulated input. Not a trained or validated model.'
    }
  };
}

export async function fetchShelters(): Promise<Shelter[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/shelters`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const raw = await res.json();
      if (Array.isArray(raw) && raw.length > 0) return raw.map((r) => mapShelter(r));
    }
  } catch (e) {}

  // Offline fallback: the same Kuala Lumpur demo list the backend serves (a test keeps the two identical).
  return (klShelters as Record<string, unknown>[]).map((r) => mapShelter(r));
}

export async function fetchReports(): Promise<CitizenReport[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/reports`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const raw = await res.json();
      if (Array.isArray(raw) && raw.length > 0) return raw.map((r) => mapReport(r));
    }
  } catch (e) {}

  // Used only when the backend is unreachable. Demo data: the reports are examples, nobody verified them, and the
  // photos do not show the places named.
  const now = Date.now();
  const minAgo = (s: string) => (s === 'Just now' ? 0 : Number.parseInt(s, 10) || 0);
  const demo = (r: Omit<CitizenReport, 'verifiedBy' | 'status'> & { status: CitizenReport['status'] }): CitizenReport => ({
    ...r,
    createdAt: now - minAgo(r.timestampStr) * 60000,
    verifiedBy: 'Demo data (not verified)',
  });
  return [
    demo({ id: 'rep-01', title: 'Jalan Raja Muda Musa Water Spillover', location: 'Kampung Baru, Kuala Lumpur', lat: 3.1642, lon: 101.7031, waterDepthCm: 35, status: 'VERIFIED', timestampStr: '12 min ago', author: 'Ahmad F.', upvotes: 28, imageUrl: '/banjir2.jpg', description: 'Example report: water spilling over a kerb into a lane, about 35 cm.' }),
    demo({ id: 'rep-02', title: 'Submerged Drain & Road Clogged at Seksyen 25', location: 'Taman Sri Muda, Seksyen 25', lat: 3.0315, lon: 101.5360, waterDepthCm: 50, status: 'UNDER_REVIEW', timestampStr: '4 min ago', author: 'Sarah T.', upvotes: 14, imageUrl: '/banjir3.jfif', description: 'Example report: a drain has overflowed onto the road, about 50 cm.' }),
    demo({ id: 'rep-03', title: 'Sungai Rasau Underpass Water Accumulation', location: 'Sungai Rasau, Klang', lat: 3.0510, lon: 101.4880, waterDepthCm: 42, status: 'UNDER_REVIEW', timestampStr: '6 min ago', author: 'Kamal R.', upvotes: 6, imageUrl: '/banjir_underpass.jpg', description: 'Example report: water ponding under a flyover, about 42 cm.' }),
    demo({ id: 'rep-04', title: 'Monsoon Drain Overflowing into Residential Road', location: 'Seksyen 13, Shah Alam', lat: 3.0845, lon: 101.5321, waterDepthCm: 38, status: 'UNDER_REVIEW', timestampStr: 'Just now', author: 'Farhan M.', upvotes: 9, imageUrl: '/banjir_drain.jpg', description: 'Example report: a drain is overflowing onto a street, about 38 cm.' }),
  ];
}

export interface ForecastResponse {
  station_name: string;
  water_level_m: number;
  forecast: {
    source: string;
    method?: string;
    horizons_min: number[];
    p10: number[];
    p50: number[];
    p90: number[];
    peak_level_m: number;
    time_to_peak_min: number;
    time_to_danger_min: number | null;
  };
}

/**
 * The backend's forecast, or null when it cannot be had. Unlike fetchTwinState there is deliberately no built-in
 * fallback: the Home screen shows an error state instead of numbers the server never produced.
 */
export async function fetchForecast(): Promise<ForecastResponse | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/twin/state`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const body = await res.json();
    return body?.forecast?.p50 ? (body as ForecastResponse) : null;
  } catch {
    return null;
  }
}
