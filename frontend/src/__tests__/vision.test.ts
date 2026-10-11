import { beforeEach, describe, expect, it } from 'vitest';
import { camTag } from '../lib/vision/camTag';
import { haversineKm, KLCC } from '../lib/vision/geo';
import { deriveHazards, detourAroundHazards, hazardsKey } from '../lib/vision/hazards';
import type { VisionHazard } from '../lib/vision/hazards';
import { levelSince } from '../lib/vision/history';
import { spreadLabels } from '../lib/vision/labels';
import { levelRank, ratioToLevel } from '../lib/vision/levels';
import { linesAreValid, thresholdsFromCalibration } from '../lib/vision/thresholds';
import { moveLine } from '../components/live/onboarding/CalibrationCanvas';
import * as store from '../services/vision/visionStore';
import { mockCameras } from '../services/vision/mockVision';
import type { Calibration, Camera, Reading } from '../types/vision';

// Same calibration as backend/tests/test_levels.py, so both sides must agree on the numbers.
const CAL: Calibration = { roi: [[0.2, 0.3], [0.8, 0.3], [0.8, 0.9], [0.2, 0.9]], lines: { normal: 0.78, warning: 0.6, danger: 0.35 } };

const reading = (id: string, level: Reading['level'], ratio: number, ts = '2026-10-14T01:00:00+08:00'): Reading => ({
  camera_id: id, timestamp: ts, window_seconds: 2, frames_analyzed: 5, water_ratio: ratio, waterline_y: 0.5, level, observed_level: level,
  confidence: 0.9, low_confidence: false, lines_crossed: [], trend: 'steady', model: 't', latency_ms: 1, action: 'none',
});
const cam = (id: string, over: Partial<Camera> = {}): Camera => ({
  id, name: id, provider: 'city', lat: 3.15, lon: 101.7, source_type: 'snapshot', is_playback: false, online: true, interval_s: 8,
  feed_refresh_s: 0, last_frame_at: null, calibration: CAL, reading: null, ...over,
});

describe('thresholds (must match the backend)', () => {
  it('maps lines to bank-height ratios', () => {
    const t = thresholdsFromCalibration(CAL);
    expect(t.normal).toBeCloseTo((0.9 - 0.78) / (0.9 - 0.35), 6);
    expect(t.warning).toBeCloseTo((0.9 - 0.6) / (0.9 - 0.35), 6);
    expect(t.danger).toBe(0.97);
  });
  it('validates ordering', () => {
    expect(linesAreValid(CAL)).toBe(true);
    expect(linesAreValid({ ...CAL, lines: { normal: 0.5, warning: 0.6, danger: 0.4 } })).toBe(false);
    expect(linesAreValid({ ...CAL, roi: [[0.1, 0.1], [0.2, 0.2]] })).toBe(false);
  });
  it.each([[0.0, 'NORMAL'], [0.3, 'ADVISORY'], [0.6, 'WARNING'], [0.96, 'WARNING'], [0.97, 'DANGER'], [1.2, 'DANGER']] as const)('ratio %s is %s', (r, level) => {
    expect(ratioToLevel(r, thresholdsFromCalibration(CAL))).toBe(level);
  });
});

describe('calibration canvas rules', () => {
  const lines = { normal: 0.8, warning: 0.62, danger: 0.38 };
  it('keeps danger < warning < normal with a gap whichever handle moves', () => {
    const a = moveLine(lines, 'danger', 0.9);
    expect(a.danger).toBeLessThan(a.warning);
    const b = moveLine(lines, 'warning', 0.0);
    expect(b.warning).toBeGreaterThan(b.danger);
    const c = moveLine(lines, 'normal', 0.1);
    expect(c.normal).toBeGreaterThan(c.warning);
  });
  it('never leaves the frame', () => {
    expect(moveLine(lines, 'normal', 5).normal).toBeLessThanOrEqual(0.98);
    expect(moveLine(lines, 'danger', -5).danger).toBeGreaterThanOrEqual(0.02);
  });
});

describe('hazards for the map', () => {
  it('only WARNING/DANGER cameras that are online become flood zones', () => {
    const cams = [
      cam('ok', { reading: reading('ok', 'NORMAL', 0.1) }),
      cam('adv', { reading: reading('adv', 'ADVISORY', 0.3) }),
      cam('warn', { reading: reading('warn', 'WARNING', 0.6) }),
      cam('danger', { reading: reading('danger', 'DANGER', 1.0) }),
      cam('dead', { online: false, reading: reading('dead', 'DANGER', 1.0) }),
    ];
    const h = deriveHazards(cams);
    expect(h.map((x) => x.cameraId)).toEqual(['warn', 'danger']);
    expect(h[1].radiusM).toBeGreaterThan(h[0].radiusM);
  });
});

describe('helpers', () => {
  it('orders levels', () => expect(levelRank('DANGER')).toBeGreaterThan(levelRank('WARNING')));
  it('computes distance', () => {
    expect(haversineKm(KLCC.lat, KLCC.lon, KLCC.lat, KLCC.lon)).toBeCloseTo(0, 6);
    expect(haversineKm(3.1579, 101.7116, 3.149, 101.696)).toBeGreaterThan(1.5);
  });
  it('tags cameras by position', () => {
    const list = [cam('a'), cam('b')];
    expect(camTag(list, 'b')).toBe('CAM-002');
    expect(camTag(list, 'zzz')).toBe('CAM-000');
  });
  it('ships six sample cameras with one offline', () => {
    const s = mockCameras();
    expect(s).toHaveLength(6);
    expect(s.filter((c) => !c.online)).toHaveLength(1);
  });
});

describe('store message handling', () => {
  beforeEach(() => store.applyMessage({ type: 'snapshot', cameras: [cam('a'), cam('b')] }));

  it('applies readings and keeps a de-duplicated history', () => {
    const r = reading('a', 'WARNING', 0.6);
    store.applyMessage({ type: 'reading', reading: r });
    store.applyMessage({ type: 'reading', reading: r }); // same timestamp: ignored
    const s = store.getState();
    expect(s.cameras.find((c) => c.id === 'a')?.reading?.level).toBe('WARNING');
    expect(s.history['a']).toHaveLength(1);
  });
  it('queues each alert once', () => {
    const alert = { id: 'x1', camera_id: 'a', camera_name: 'A', level: 'DANGER' as const, water_ratio: 1, timestamp: 't', message: 'm' };
    store.applyMessage({ type: 'alert', alert });
    store.applyMessage({ type: 'alert', alert });
    expect(store.getState().unseen.filter((a) => a.id === 'x1')).toHaveLength(1);
    store.ackAlert('x1');
    expect(store.getState().unseen.some((a) => a.id === 'x1')).toBe(false);
    expect(store.getState().alerts.some((a) => a.id === 'x1')).toBe(true);
  });
  it('handles status, add and remove', () => {
    store.applyMessage({ type: 'status', camera_id: 'a', online: false });
    expect(store.getState().cameras.find((c) => c.id === 'a')?.online).toBe(false);
    store.applyMessage({ type: 'camera', camera: cam('c') });
    expect(store.getState().cameras.some((c) => c.id === 'c')).toBe(true);
    store.applyMessage({ type: 'camera_removed', camera_id: 'c' });
    expect(store.getState().cameras.some((c) => c.id === 'c')).toBe(false);
  });
});

describe('routes avoid vision flood zones', () => {
  const zone: VisionHazard = { cameraId: 'z', name: 'Z', lat: 3.15, lon: 101.70, level: 'DANGER', waterRatio: 1, radiusM: 250 };
  const metres = (a: [number, number], b: [number, number]) => haversineKm(a[0], a[1], b[0], b[1]) * 1000;
  // Distance from the zone centre to the closest point of a segment, sampled finely.
  const closest = (route: [number, number][]) => {
    let best = Infinity;
    for (let i = 1; i < route.length; i++) {
      for (let k = 0; k <= 50; k++) {
        const t = k / 50;
        const p: [number, number] = [route[i - 1][0] + (route[i][0] - route[i - 1][0]) * t, route[i - 1][1] + (route[i][1] - route[i - 1][1]) * t];
        best = Math.min(best, metres(p, [zone.lat, zone.lon]));
      }
    }
    return best;
  };

  it('bends a segment that crosses a zone so it stays outside it', () => {
    const straight: [number, number][] = [[3.15, 101.69], [3.15, 101.71]]; // passes right through the centre
    expect(closest(straight)).toBeLessThan(zone.radiusM);
    const out = detourAroundHazards(straight, [zone]);
    expect(out.avoided).toEqual(['z']);
    expect(out.route[0]).toEqual(straight[0]);
    expect(out.route[out.route.length - 1]).toEqual(straight[1]);
    expect(closest(out.route)).toBeGreaterThanOrEqual(zone.radiusM);
  });
  it('leaves routes that already miss every zone untouched', () => {
    const far: [number, number][] = [[3.17, 101.69], [3.17, 101.71]];
    expect(detourAroundHazards(far, [zone])).toEqual({ route: far, avoided: [] });
    expect(detourAroundHazards(far, [])).toEqual({ route: far, avoided: [] });
  });
  it('does not try to route around a zone the user is already inside', () => {
    const fromInside: [number, number][] = [[3.15, 101.70], [3.15, 101.72]];
    expect(detourAroundHazards(fromInside, [zone]).avoided).toEqual([]);
  });
  it('real map geometry: the Kampung Baru shelter route bends around the Kampung Baru Drain zone', () => {
    const route: [number, number][] = [[3.161, 101.7005], [3.1625, 101.7015], [3.165, 101.705]]; // ShelterMapView short route
    const drain: VisionHazard = { cameraId: 'drain', name: 'Kampung Baru Drain', lat: 3.1642, lon: 101.7031, level: 'WARNING', waterRatio: 0.55, radiusM: 120 };
    const out = detourAroundHazards(route, [drain]);
    expect(out.avoided).toEqual(['drain']);
    expect(out.route.length).toBeGreaterThan(route.length);
  });
  it('keys hazards by identity and level, not by reading', () => {
    expect(hazardsKey([zone])).toBe(hazardsKey([{ ...zone, waterRatio: 0.99 }]));
    expect(hazardsKey([zone])).not.toBe(hazardsKey([{ ...zone, level: 'WARNING' }]));
  });
});

describe('label spreading', () => {
  it('pushes close labels apart and keeps them in bounds', () => {
    const out = spreadLabels([0.4, 0.41, 0.42], 0.1, 0, 1);
    expect(out[1] - out[0]).toBeGreaterThanOrEqual(0.1 - 1e-9);
    expect(out[2] - out[1]).toBeGreaterThanOrEqual(0.1 - 1e-9);
    const edge = spreadLabels([0.9, 0.95, 0.99], 0.1, 0, 1);
    expect(edge[2]).toBeLessThanOrEqual(1);
    expect(edge[1] - edge[0]).toBeGreaterThanOrEqual(0.1 - 1e-9);
  });
  it('leaves well-separated labels alone', () => expect(spreadLabels([0.2, 0.5, 0.8], 0.1)).toEqual([0.2, 0.5, 0.8]));
});

describe('level history', () => {
  it('finds when the current level started', () => {
    const h = [reading('a', 'NORMAL', 0.1, 't1'), reading('a', 'WARNING', 0.6, 't2'), reading('a', 'WARNING', 0.62, 't3')];
    expect(levelSince(h)).toBe('t2');
    expect(levelSince(h.slice(1))).toBeNull();
    expect(levelSince([])).toBeNull();
  });
});
