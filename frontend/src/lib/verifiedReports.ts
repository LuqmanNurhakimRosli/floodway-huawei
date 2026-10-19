import type { CitizenReport } from '../types';
import { haversineM } from './routing';
import { STREET_LEVELS } from './depthFromPhoto';

/**
 * Turns verified citizen reports into flood areas for the map.
 *
 * Rules (from the product brief):
 * - Only reports with a verified status make an area. Unverified and rejected reports never paint a circle.
 * - Reports within CLUSTER_M of each other form one area.
 * - Strength is counted in independent reporters, not reports: one person sending five reports counts once.
 *   Anonymous reports cannot be told apart, so they all count as one shared reporter.
 * - The radius starts at 500 m and grows with the number of independent reporters and the depth, capped at 5 km.
 * - Colour follows depth: amber below the danger depth, red at or above it (STREET_LEVELS.danger).
 * - Opacity follows the number of independent reporters, capped, so the map gets brighter only with more people.
 *
 * Nothing here is an official flood map. The areas show what verified reports say, and the copy must say so.
 */

export const VERIFIED_STATUSES: ReadonlyArray<CitizenReport['status']> = ['VERIFIED', 'AI_VERIFIED', 'OFFICIAL_VERIFIED'];

export const CLUSTER_M = 1000;
export const BASE_RADIUS_M = 500;
export const MAX_RADIUS_M = 5000;
const RADIUS_PER_REPORTER_M = 400;
const RADIUS_PER_CM_OVER_ADVISORY_M = 20;
const ANON = '__anonymous__';

export interface VerifiedArea {
  id: string;
  lat: number;
  lon: number;
  radiusM: number;
  /** Reports in the cluster, including repeats. */
  reportCount: number;
  /** Distinct reporters (see the rules above). */
  reporterCount: number;
  depthLoCm: number;
  depthHiCm: number;
  /** Red when the median depth reaches the danger depth, else amber. */
  tone: 'amber' | 'red';
  /** 0 to 1, from the reporter count only. */
  intensity: number;
  reportIds: string[];
}

/** Reports that count as verified for the map. */
export function isVerified(r: CitizenReport): boolean {
  return VERIFIED_STATUSES.includes(r.status);
}

function depthOf(r: CitizenReport): { lo: number; hi: number; mid: number } {
  const lo = r.depthRangeCm?.lo ?? r.waterDepthCm;
  const hi = r.depthRangeCm?.hi ?? r.waterDepthCm;
  return { lo, hi, mid: (lo + hi) / 2 };
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Groups verified reports by distance (single link: a report joins a group if it is within CLUSTER_M of any member). */
export function clusterVerified(reports: CitizenReport[]): CitizenReport[][] {
  const groups: CitizenReport[][] = [];
  for (const r of reports.filter(isVerified)) {
    const hits = groups.filter((g) => g.some((m) => haversineM([m.lat, m.lon], [r.lat, r.lon]) <= CLUSTER_M));
    if (hits.length === 0) {
      groups.push([r]);
      continue;
    }
    const merged = [r, ...hits.flat()];
    groups.splice(0, groups.length, ...groups.filter((g) => !hits.includes(g)), merged);
  }
  return groups;
}

/** Radius in metres for a cluster: grows with independent reporters and with depth above advisory, capped. */
export function radiusFor(reporterCount: number, medianCm: number): number {
  const extra = RADIUS_PER_REPORTER_M * Math.max(0, reporterCount - 1) + RADIUS_PER_CM_OVER_ADVISORY_M * Math.max(0, medianCm - STREET_LEVELS.advisory);
  const r = Math.min(MAX_RADIUS_M, BASE_RADIUS_M + extra);
  return Math.round(r / 100) * 100;
}

/** Opacity strength from the reporter count only: 1 reporter is faint, 5 or more is the brightest. */
export function intensityFor(reporterCount: number): number {
  return Math.min(1, Math.max(0, (reporterCount - 1) / 4));
}

export function reporterKey(r: CitizenReport): string {
  const name = (r.author || '').trim().toLowerCase();
  return !name || name === 'anonymous' ? ANON : name;
}

export function buildVerifiedAreas(reports: CitizenReport[]): VerifiedArea[] {
  return clusterVerified(reports).map((group, i) => {
    const reporters = new Set(group.map(reporterKey));
    const depths = group.map(depthOf);
    const lat = group.reduce((s, r) => s + r.lat, 0) / group.length;
    const lon = group.reduce((s, r) => s + r.lon, 0) / group.length;
    const medianCm = median(depths.map((d) => d.mid));
    return {
      id: `area-${i}-${group[0].id}`,
      lat,
      lon,
      radiusM: radiusFor(reporters.size, medianCm),
      reportCount: group.length,
      reporterCount: reporters.size,
      depthLoCm: Math.round(Math.min(...depths.map((d) => d.lo))),
      depthHiCm: Math.round(Math.max(...depths.map((d) => d.hi))),
      tone: medianCm >= STREET_LEVELS.danger ? 'red' : 'amber',
      intensity: intensityFor(reporters.size),
      reportIds: group.map((r) => r.id),
    };
  });
}

/** The line shown on the circle, e.g. "3 verified reports, 35 to 50 cm, 1.5 km". */
export function areaLabel(a: VerifiedArea): string {
  const reports = `${a.reportCount} verified ${a.reportCount === 1 ? 'report' : 'reports'}`;
  const who = a.reporterCount === a.reportCount ? '' : ` from ${a.reporterCount} ${a.reporterCount === 1 ? 'person' : 'people'}`;
  const km = a.radiusM >= 1000 ? `${(a.radiusM / 1000).toFixed(1)} km` : `${a.radiusM} m`;
  return `${reports}${who}, ${a.depthLoCm} to ${a.depthHiCm} cm, ${km} radius`;
}
