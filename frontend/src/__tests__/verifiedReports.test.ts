import { describe, expect, it } from 'vitest';
import { areaAge, areaLabel, buildVerifiedAreas, clusterVerified, freshnessFor, intensityFor, isVerified, radiusFor, reportTime, verifiedZones, MAX_RADIUS_M } from '../lib/verifiedReports';
import type { CitizenReport } from '../types';

const NOW = new Date(2026, 9, 19, 12, 0).getTime();
const H = 3600000;
const base = (over: Partial<CitizenReport>): CitizenReport => ({
  id: 'r', title: '', location: '', lat: 3.165, lon: 101.7, waterDepthCm: 40, status: 'VERIFIED', verifiedBy: '', timestampStr: '',
  createdAt: NOW - 10 * 60000, author: 'Ali', upvotes: 0, ...over,
});
// every call in this file evaluates at NOW
const areas = (rs: CitizenReport[]) => buildVerifiedAreas(rs, NOW);

describe('verified report areas', () => {
  it('counts only verified statuses', () => {
    expect(isVerified(base({ status: 'VERIFIED' }))).toBe(true);
    expect(isVerified(base({ status: 'AI_VERIFIED' }))).toBe(false);
    expect(isVerified(base({ status: 'OFFICIAL_VERIFIED' }))).toBe(true);
    expect(isVerified(base({ status: 'UNDER_REVIEW' }))).toBe(false);
    expect(isVerified(base({ status: 'REJECTED' }))).toBe(false);
    expect(areas([base({ status: 'UNDER_REVIEW' }), base({ status: 'REJECTED', id: 'x' })])).toEqual([]);
  });

  it('a report posted in this session draws a 2 km crowd area once an operator verifies it', () => {
    const posted = base({ crowdRadiusM: 2000, status: 'AI_VERIFIED' });
    expect(areas([posted])).toEqual([]);
    const [a] = areas([{ ...posted, status: 'OFFICIAL_VERIFIED' }]);
    expect(a.radiusM).toBe(2000);
    expect(verifiedZones([{ ...posted, status: 'OFFICIAL_VERIFIED' }], NOW)[0].radiusM).toBe(2000);
  });

  it('a single verified report gives a small circle of about 500 m', () => {
    const [a] = areas([base({ waterDepthCm: 12 })]);
    expect(a.radiusM).toBe(500);
    expect(a.reportCount).toBe(1);
    expect(a.reporterCount).toBe(1);
  });

  it('repeat reports from one person do not make the area stronger', () => {
    const many = Array.from({ length: 6 }, (_, i) => base({ id: `r${i}`, author: 'Ali' }));
    const [a] = areas(many);
    expect(a.reportCount).toBe(6);
    expect(a.reporterCount).toBe(1);
    expect(a.intensity).toBe(0);
    expect(a.radiusM).toBe(areas([base({ author: 'Solo' })])[0].radiusM);
  });

  it('independent reporters grow the radius and the brightness, capped at 5 km', () => {
    const people = Array.from({ length: 3 }, (_, i) => base({ id: `p${i}`, author: `Person ${i}`, lat: 3.165 + i * 0.001 }));
    const [a] = areas(people);
    expect(a.reporterCount).toBe(3);
    expect(a.intensity).toBeCloseTo(0.5, 5);
    expect(a.radiusM).toBeGreaterThan(500);
    expect(radiusFor(50, 200)).toBe(MAX_RADIUS_M);
    expect(intensityFor(9)).toBe(1);
  });

  it('depth raises the radius and colours the area red at danger depth', () => {
    const shallow = areas([base({ waterDepthCm: 20 })])[0];
    const deep = areas([base({ waterDepthCm: 45 })])[0];
    expect(shallow.tone).toBe('amber');
    expect(deep.tone).toBe('red');
    expect(deep.radiusM).toBeGreaterThan(shallow.radiusM);
  });

  it('uses the photo depth range when there is one', () => {
    const [a] = areas([base({ waterDepthCm: 42, depthRangeCm: { lo: 35, hi: 50 } })]);
    expect(a.depthLoCm).toBe(35);
    expect(a.depthHiCm).toBe(50);
  });

  it('groups reports within 1 km and keeps far ones apart', () => {
    const near = base({ id: 'n', author: 'B', lat: 3.1665, lon: 101.7 }); // about 0.3 km from the first
    const far = base({ id: 'f', author: 'C', lat: 3.25, lon: 101.7 }); // about 10 km away
    const groups = clusterVerified([base({ id: 'a', author: 'A' }), near, far], NOW);
    expect(groups.map((g) => g.length).sort()).toEqual([1, 2]);
  });

  it('anonymous reports count as one shared reporter', () => {
    const [a] = areas([base({ id: '1', author: 'Anonymous' }), base({ id: '2', author: '' })]);
    expect(a.reporterCount).toBe(1);
  });

  it('writes the label the map shows on the circle', () => {
    const people = [base({ id: 'a', author: 'A', waterDepthCm: 35, depthRangeCm: { lo: 35, hi: 50 } }), base({ id: 'b', author: 'B', waterDepthCm: 35, depthRangeCm: { lo: 35, hi: 50 } }), base({ id: 'c', author: 'C', waterDepthCm: 35, depthRangeCm: { lo: 35, hi: 50 } })];
    const [a] = areas(people);
    // three different people, median depth 42.5 cm: 500 + 2 x 400 + 20 x (42.5 - 11) = 1930, rounded to 1900 m
    expect(areaLabel(a)).toBe('3 verified reports, 35 to 50 cm, 1.9 km radius');
    const [solo] = areas([base({ waterDepthCm: 12 })]);
    expect(areaLabel(solo)).toBe('1 verified report, 12 to 12 cm, 500 m radius');
    const [repeat] = areas([base({ id: 'x', author: 'Ali', waterDepthCm: 12 }), base({ id: 'y', author: 'Ali', waterDepthCm: 12 })]);
    expect(areaLabel(repeat)).toBe('2 verified reports from 1 person, 12 to 12 cm, 500 m radius');
  });

  it('reads report times from createdAt or the display string', () => {
    expect(reportTime({ createdAt: 5, timestampStr: 'Just now' }, NOW)).toBe(5);
    expect(reportTime({ timestampStr: 'Just now' }, NOW)).toBe(NOW);
    expect(reportTime({ timestampStr: '12 min ago' }, NOW)).toBe(NOW - 12 * 60000);
    expect(reportTime({ timestampStr: '2 h ago' }, NOW)).toBe(NOW - 2 * H);
    expect(reportTime({ timestampStr: '3 hours ago' }, NOW)).toBe(NOW - 3 * H);
    expect(reportTime({ timestampStr: '2026-10-19T10:00:00Z' }, NOW)).toBe(Date.parse('2026-10-19T10:00:00Z'));
    expect(reportTime({ timestampStr: 'yesterday-ish' }, NOW)).toBeNull();
  });

  it('fades after an hour and drops reports older than six hours or with no time', () => {
    expect(freshnessFor(0)).toBe(1);
    expect(freshnessFor(1 * H)).toBe(1);
    expect(freshnessFor(3.5 * H)).toBeCloseTo(0.5, 5);
    expect(freshnessFor(6 * H)).toBe(0);
    expect(areas([base({ createdAt: NOW - 7 * H })])).toEqual([]);
    expect(areas([base({ createdAt: undefined, timestampStr: '' })])).toEqual([]);
    const [fading] = areas([base({ createdAt: NOW - 3.5 * H })]);
    expect(fading.freshness).toBeCloseTo(0.5, 5);
    expect(areaAge(fading, NOW)).toBe('Newest report 3.5 h ago, fading');
    // one fresh report keeps the whole area fresh
    const [mixed] = areas([base({ id: 'old', author: 'A', createdAt: NOW - 5 * H }), base({ id: 'new', author: 'B', createdAt: NOW - 5 * 60000 })]);
    expect(mixed.freshness).toBe(1);
    expect(areaAge(mixed, NOW)).toBe('Newest report 5 min ago');
  });

  it('does not draw an area for an AI check alone', () => {
    expect(areas([base({ status: 'AI_VERIFIED', waterDepthCm: 12 })])).toHaveLength(0);
  });

  it('turns areas into zones that routing avoids', () => {
    const zones = verifiedZones([base({ id: 'z', waterDepthCm: 12 }), base({ id: 'u', status: 'UNDER_REVIEW', lat: 3.3 })], NOW);
    expect(zones).toHaveLength(1);
    expect(zones[0]).toMatchObject({ radiusM: 500 });
    expect(zones[0].id.startsWith('rep-')).toBe(true);
  });
});
