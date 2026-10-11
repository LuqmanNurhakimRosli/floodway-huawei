import { describe, expect, it } from 'vitest';
import { DASH, formatCapacity, formatCm, formatKm, formatMin, formatPct, percentOf, safeNumber, textOr } from '../lib/format';
import { DEMO_ORIGIN, estimateEtaMin, mapReport, mapShelter, normalizeImageUrl } from '../lib/mappers';

// Exact shapes returned by GET /api/v1/shelters and /api/v1/reports on 2026-10-11.
const BACKEND_SHELTER = {
  id: 'shelter-03', name: 'Dewan Serbaguna Kampung Baru', category: 'Community Center', lat: 3.165, lon: 101.705,
  address: 'Jalan Raja Abdullah', status: 'OPEN', route_status: 'ADVISORY', current_capacity: 180, max_capacity: 220,
  contact: '+60 3-0000 0000', facilities: ['Water', 'Medical'], elevation_m: 22,
};
const BACKEND_REPORT = {
  id: 'rep-01', title: 'Jalan Raja Muda Musa Water Spillover', location: 'Kampung Baru, Kuala Lumpur', lat: 3.1642, lon: 101.7031,
  water_depth_cm: 35, status: 'VERIFIED', verified_by: 'Demo', timestamp_str: '12 minutes ago', author: 'Ahmad F.', upvotes: 28,
  image_url: '/assets/banjir2.jpg',
};

describe('safeNumber', () => {
  it.each([[5, 5], ['5', 5], ['  7.5 ', 7.5], [0, 0]])('accepts %s', (input, out) => expect(safeNumber(input)).toBe(out));
  it.each([[NaN], [Infinity], [-Infinity], [''], ['  '], ['abc'], [null], [undefined], [{}], [[]]])('rejects %s', (input) => expect(safeNumber(input)).toBeNull());
});

describe('formatters never render NaN, undefined or empty', () => {
  const bad: unknown[] = [NaN, undefined, null, '', 'x', Infinity, -3];
  it.each(bad)('km/min/cm for %s', (v) => {
    for (const out of [formatKm(v), formatMin(v), formatCm(v)]) {
      expect(out).toBe(DASH);
      expect(out).not.toMatch(/NaN|undefined|null/);
    }
  });
  it('percent and capacity guard a zero or missing maximum', () => {
    expect(percentOf(10, 0)).toBeNull();
    expect(percentOf(10, undefined)).toBeNull();
    expect(percentOf(NaN, 100)).toBeNull();
    expect(formatPct(10, 0)).toBe(DASH);
    expect(formatCapacity(10, 0)).toBe('Not reported');
    expect(formatCapacity(undefined, 100)).toBe('Not reported');
  });
  it('formats real values', () => {
    expect(formatKm(0.45)).toBe('450 m');
    expect(formatKm(1.24)).toBe('1.2 km');
    expect(formatMin(6.4)).toBe('6 min');
    expect(formatPct(146, 200)).toBe('73%');
    expect(percentOf(300, 200)).toBe(100); // clamped
    expect(formatCapacity(146, 200)).toBe('146 / 200');
    expect(formatCm(35.4)).toBe('35 cm');
  });
  it('textOr never returns an empty string', () => {
    expect(textOr('')).toBe(DASH);
    expect(textOr(undefined, 'n/a')).toBe('n/a');
    expect(textOr('ok')).toBe('ok');
  });
});

describe('mapShelter (backend snake_case)', () => {
  const s = mapShelter(BACKEND_SHELTER);
  it('maps the fields the UI reads', () => {
    expect(s.currentCapacity).toBe(180);
    expect(s.maxCapacity).toBe(220);
    expect(s.routeStatus).toBe('ADVISORY');
    expect(s.elevationM).toBe(22);
  });
  it('computes distance from the demo origin and an estimated travel time', () => {
    expect(s.distanceKm).toBeGreaterThan(0);
    expect(s.distanceKm).toBeLessThan(2); // Kampung Baru shelter, a few hundred metres away
    expect(s.travelTimeMin).toBe(estimateEtaMin(s.distanceKm, 'car'));
    expect(Number.isFinite(s.travelTimeMin)).toBe(true);
  });
  it('survives a hostile payload without producing NaN', () => {
    const h = mapShelter({ id: 1, lat: 'x', lon: null, current_capacity: 'NaN', max_capacity: undefined, status: 'weird', facilities: 'no' });
    expect(Object.values(h).some((v) => typeof v === 'number' && Number.isNaN(v))).toBe(false);
    expect(h.status).toBe('STANDBY');
    expect(h.facilities).toEqual([]);
    expect(formatCapacity(h.currentCapacity, h.maxCapacity)).toBe('Not reported');
  });
  it('passes an already-mapped camelCase shelter through', () => {
    const again = mapShelter({ ...s });
    expect(again.currentCapacity).toBe(180);
    expect(again.distanceKm).toBe(s.distanceKm);
  });
  it('uses DEMO_ORIGIN', () => expect(DEMO_ORIGIN.lat).toBeCloseTo(3.161));
});

describe('estimateEtaMin', () => {
  it('is slower on foot and null without a distance', () => {
    expect(estimateEtaMin(3, 'walk')!).toBeGreaterThan(estimateEtaMin(3, 'car')!);
    expect(estimateEtaMin(null)).toBeNull();
    expect(estimateEtaMin(NaN)).toBeNull();
  });
});

describe('mapReport (backend snake_case)', () => {
  const r = mapReport(BACKEND_REPORT);
  it('maps depth, image and author', () => {
    expect(r.waterDepthCm).toBe(35);
    expect(formatCm(r.waterDepthCm)).toBe('35 cm');
    expect(r.imageUrl).toBe('/banjir2.jpg'); // the backend's /assets/ prefix does not exist in public/
    expect(r.timestampStr).toBe('12 minutes ago');
  });
  it('shows a dash for an unknown depth instead of 0 or NaN', () => {
    const u = mapReport({ ...BACKEND_REPORT, water_depth_cm: undefined });
    expect(formatCm(u.waterDepthCm)).toBe(DASH);
  });
  it('normalises image urls', () => {
    expect(normalizeImageUrl('/assets/x.jpg')).toBe('/x.jpg');
    expect(normalizeImageUrl('/x.jpg')).toBe('/x.jpg');
    expect(normalizeImageUrl('')).toBeUndefined();
    expect(normalizeImageUrl(undefined)).toBeUndefined();
  });
});
