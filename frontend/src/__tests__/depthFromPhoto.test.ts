import { describe, expect, it } from 'vitest';
import {
  compareAi, compareSensor, depthToLevel, landmarkRange, levelsInRange, measureDepth, midpoint, REFERENCE_OBJECTS, summarise,
} from '../lib/depthFromPhoto';

describe('landmark method', () => {
  it('returns a range for every listed landmark, low below high', () => {
    for (const o of REFERENCE_OBJECTS) for (const l of o.landmarks) {
      const r = landmarkRange(o.id, l.id)!;
      expect(r.lo).toBeLessThan(r.hi);
    }
  });
  it('knee depth is dangerous for cars', () => {
    expect(levelsInRange(landmarkRange('person', 'knee')!)).toEqual(['DANGER']);
  });
  it('unknown ids give null', () => {
    expect(landmarkRange('boat', 'deck')).toBeNull();
  });
});

describe('measure method', () => {
  // Door: handle at 100 cm, frame top at 210 cm, 110 cm apart = 220 px, so 0.5 cm per px.
  const base = { upperY: 100, lowerY: 320, upperCm: 210, lowerCm: 100, upperTolCm: 0, lowerTolCm: 0, tapErrPx: 0, perspective: 0 };

  it('computes depth from the gap below the lower mark', () => {
    const r = measureDepth({ ...base, waterY: 440 }); // 120 px below the handle = 60 cm below it -> 40 cm deep
    expect(r.ok && r.range).toEqual({ lo: 40, hi: 40 });
  });

  it('widens the range with tap error and perspective', () => {
    const r = measureDepth({ ...base, waterY: 440, tapErrPx: 6, perspective: 0.1, upperTolCm: 10, lowerTolCm: 8 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.range.lo).toBeLessThan(40);
      expect(r.range.hi).toBeGreaterThan(40);
      expect(midpoint(r.range)).toBeGreaterThan(25);
      expect(midpoint(r.range)).toBeLessThan(55);
    }
  });

  it('rejects points in the wrong order with a reason', () => {
    expect(measureDepth({ ...base, waterY: 200 })).toMatchObject({ ok: false });
    expect(measureDepth({ ...base, upperY: 330, waterY: 440 })).toMatchObject({ ok: false });
    expect(measureDepth({ ...base, lowerY: 110, waterY: 440 })).toMatchObject({ ok: false }); // marks too close
  });

  it('refuses water below the ground', () => {
    const r = measureDepth({ ...base, waterY: 600 }); // 140 cm below a 100 cm mark
    expect(r).toMatchObject({ ok: false });
  });
});

describe('cross-check', () => {
  it('maps street depth to the underpass node levels', () => {
    expect(depthToLevel(5)).toBe('NORMAL');
    expect(depthToLevel(12)).toBe('ADVISORY');
    expect(depthToLevel(20)).toBe('WARNING');
    expect(depthToLevel(30)).toBe('DANGER');
  });

  it('compares a street node in centimetres', () => {
    const node = { kind: 'street-node' as const, name: 'n', distanceKm: 0.3, level: 'DANGER' as const, depthM: 0.42 };
    expect(compareSensor({ lo: 35, hi: 50 }, node)).toBe('agrees');
    expect(compareSensor({ lo: 5, hi: 10 }, node)).toBe('differs');
  });

  it('compares a river camera by danger level only', () => {
    const cam = { kind: 'camera' as const, name: 'c', distanceKm: 0.8, level: 'WARNING' as const };
    expect(compareSensor({ lo: 15, hi: 25 }, cam)).toBe('agrees');
    expect(compareSensor({ lo: 35, hi: 45 }, cam)).toBe('close');
    expect(compareSensor({ lo: 2, hi: 8 }, cam)).toBe('differs');
  });

  it('ignores sensors that are too far away', () => {
    expect(compareSensor({ lo: 15, hi: 25 }, { kind: 'camera', name: 'c', distanceKm: 4, level: 'WARNING' })).toBe('unavailable');
    expect(compareSensor({ lo: 15, hi: 25 }, null)).toBe('unavailable');
  });

  it('treats a missing AI estimate as unavailable, not as agreement', () => {
    expect(compareAi({ lo: 30, hi: 40 }, null)).toBe('unavailable');
    expect(compareAi({ lo: 30, hi: 40 }, 0)).toBe('unavailable');
    expect(compareAi({ lo: 30, hi: 40 }, 38)).toBe('agrees');
    expect(compareAi({ lo: 30, hi: 40 }, 90)).toBe('differs');
  });

  it('summarises without a verdict', () => {
    expect(summarise(['unavailable', 'unavailable']).text).toMatch(/person still reviews/);
    const s = summarise(['agrees', 'differs']);
    expect(s).toMatchObject({ available: 2, agreeing: 1 });
    expect(s.text).not.toMatch(/verified/i);
  });
});
