import { describe, expect, it } from 'vitest';
import { areaLabel, buildVerifiedAreas, clusterVerified, intensityFor, isVerified, radiusFor, MAX_RADIUS_M } from '../lib/verifiedReports';
import type { CitizenReport } from '../types';

const base = (over: Partial<CitizenReport>): CitizenReport => ({
  id: 'r', title: '', location: '', lat: 3.165, lon: 101.7, waterDepthCm: 40, status: 'VERIFIED', verifiedBy: '', timestampStr: '',
  author: 'Ali', upvotes: 0, ...over,
});

describe('verified report areas', () => {
  it('counts only verified statuses', () => {
    expect(isVerified(base({ status: 'VERIFIED' }))).toBe(true);
    expect(isVerified(base({ status: 'AI_VERIFIED' }))).toBe(true);
    expect(isVerified(base({ status: 'OFFICIAL_VERIFIED' }))).toBe(true);
    expect(isVerified(base({ status: 'UNDER_REVIEW' }))).toBe(false);
    expect(isVerified(base({ status: 'REJECTED' }))).toBe(false);
    expect(buildVerifiedAreas([base({ status: 'UNDER_REVIEW' }), base({ status: 'REJECTED', id: 'x' })])).toEqual([]);
  });

  it('a single verified report gives a small circle of about 500 m', () => {
    const [a] = buildVerifiedAreas([base({ waterDepthCm: 12 })]);
    expect(a.radiusM).toBe(500);
    expect(a.reportCount).toBe(1);
    expect(a.reporterCount).toBe(1);
  });

  it('repeat reports from one person do not make the area stronger', () => {
    const many = Array.from({ length: 6 }, (_, i) => base({ id: `r${i}`, author: 'Ali' }));
    const [a] = buildVerifiedAreas(many);
    expect(a.reportCount).toBe(6);
    expect(a.reporterCount).toBe(1);
    expect(a.intensity).toBe(0);
    expect(a.radiusM).toBe(buildVerifiedAreas([base({ author: 'Solo' })])[0].radiusM);
  });

  it('independent reporters grow the radius and the brightness, capped at 5 km', () => {
    const people = Array.from({ length: 3 }, (_, i) => base({ id: `p${i}`, author: `Person ${i}`, lat: 3.165 + i * 0.001 }));
    const [a] = buildVerifiedAreas(people);
    expect(a.reporterCount).toBe(3);
    expect(a.intensity).toBeCloseTo(0.5, 5);
    expect(a.radiusM).toBeGreaterThan(500);
    expect(radiusFor(50, 200)).toBe(MAX_RADIUS_M);
    expect(intensityFor(9)).toBe(1);
  });

  it('depth raises the radius and colours the area red at danger depth', () => {
    const shallow = buildVerifiedAreas([base({ waterDepthCm: 20 })])[0];
    const deep = buildVerifiedAreas([base({ waterDepthCm: 45 })])[0];
    expect(shallow.tone).toBe('amber');
    expect(deep.tone).toBe('red');
    expect(deep.radiusM).toBeGreaterThan(shallow.radiusM);
  });

  it('uses the photo depth range when there is one', () => {
    const [a] = buildVerifiedAreas([base({ waterDepthCm: 42, depthRangeCm: { lo: 35, hi: 50 } })]);
    expect(a.depthLoCm).toBe(35);
    expect(a.depthHiCm).toBe(50);
  });

  it('groups reports within 1 km and keeps far ones apart', () => {
    const near = base({ id: 'n', author: 'B', lat: 3.1665, lon: 101.7 }); // about 0.3 km from the first
    const far = base({ id: 'f', author: 'C', lat: 3.25, lon: 101.7 }); // about 10 km away
    const groups = clusterVerified([base({ id: 'a', author: 'A' }), near, far]);
    expect(groups.map((g) => g.length).sort()).toEqual([1, 2]);
  });

  it('anonymous reports count as one shared reporter', () => {
    const [a] = buildVerifiedAreas([base({ id: '1', author: 'Anonymous' }), base({ id: '2', author: '' })]);
    expect(a.reporterCount).toBe(1);
  });

  it('writes the label the map shows on the circle', () => {
    const people = [base({ id: 'a', author: 'A', waterDepthCm: 35, depthRangeCm: { lo: 35, hi: 50 } }), base({ id: 'b', author: 'B', waterDepthCm: 35, depthRangeCm: { lo: 35, hi: 50 } }), base({ id: 'c', author: 'C', waterDepthCm: 35, depthRangeCm: { lo: 35, hi: 50 } })];
    const [a] = buildVerifiedAreas(people);
    // three different people, median depth 42.5 cm: 500 + 2 x 400 + 20 x (42.5 - 11) = 1930, rounded to 1900 m
    expect(areaLabel(a)).toBe('3 verified reports, 35 to 50 cm, 1.9 km radius');
    const [solo] = buildVerifiedAreas([base({ waterDepthCm: 12 })]);
    expect(areaLabel(solo)).toBe('1 verified report, 12 to 12 cm, 500 m radius');
    const [repeat] = buildVerifiedAreas([base({ id: 'x', author: 'Ali', waterDepthCm: 12 }), base({ id: 'y', author: 'Ali', waterDepthCm: 12 })]);
    expect(areaLabel(repeat)).toBe('2 verified reports from 1 person, 12 to 12 cm, 500 m radius');
  });
});
