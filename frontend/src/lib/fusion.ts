// Four-factor fusion: one flood level for a place from the IoT node, the camera, the flood-prone model and MET Malaysia.
// A hand-written rule, not a trained model. Same rule as backend/app/services/fusion.py; keep the two in step.
import model from '../data/floodProneModel.json';
import type { Level } from '../types/vision';
import { LEVELS, levelRank } from './vision/levelRules';

export type FactorKey = 'model' | 'met' | 'iot' | 'cctv';
export type MetWarning = 'none' | 'yellow' | 'orange' | 'red';

export const LIVE_FACTORS: FactorKey[] = ['iot', 'cctv'];
const CONTEXT_FACTORS: FactorKey[] = ['model', 'met'];

export interface Fusion {
  level: Level;
  /** Factors at WARNING or above. */
  agreeing: FactorKey[];
  /** Factors with data. */
  reporting: number;
  /** Raised one step because another factor agreed. */
  escalated: boolean;
  /** Context only (model, MET), held at ADVISORY. */
  capped: boolean;
}

export function fuse(factors: Partial<Record<FactorKey, Level | null>>): Fusion {
  const present = (Object.entries(factors) as [FactorKey, Level | null][]).filter((e): e is [FactorKey, Level] => e[1] != null);
  const agreeing = present.filter(([, l]) => levelRank(l) >= levelRank('WARNING')).map(([k]) => k);
  const live = present.filter(([k]) => LIVE_FACTORS.includes(k));
  const lead = live.reduce<[FactorKey, Level] | null>((best, e) => (!best || levelRank(e[1]) > levelRank(best[1]) ? e : best), null);
  const floor: Level = lead ? lead[1] : 'NORMAL';

  if (levelRank(floor) < levelRank('ADVISORY')) {
    const contextRaised = present.some(([k, l]) => CONTEXT_FACTORS.includes(k) && levelRank(l) >= levelRank('WARNING'));
    return { level: contextRaised ? 'ADVISORY' : floor, agreeing, reporting: present.length, escalated: false, capped: contextRaised };
  }

  const othersAgree = agreeing.some((k) => k !== lead?.[0]);
  const level = othersAgree ? LEVELS[Math.min(levelRank(floor) + 1, LEVELS.length - 1)] : floor;
  return { level, agreeing, reporting: present.length, escalated: level !== floor, capped: false };
}

/** Tisya's illustrative tiers: >= 0.70 elevated, 0.40-0.70 moderate. A relative score, so it tops out at WARNING. */
export function modelLevel(score: number): Level {
  if (score >= 0.7) return 'WARNING';
  if (score >= 0.4) return 'ADVISORY';
  return 'NORMAL';
}

/** MET Malaysia colour warnings: yellow (waspada), orange (buruk), red (bahaya). */
export const MET_LEVEL: Record<MetWarning, Level> = { none: 'NORMAL', yellow: 'ADVISORY', orange: 'WARNING', red: 'DANGER' };

export const floodProneModel = model;
export type ModelSite = typeof model.site;

/**
 * Tisya's Benchmark A logistic regression, scored in the browser from its exported weights
 * (scripts/export_flood_prone_model.py). Inputs in the trained order: 1/3/7-day prior rain (mm), elevation (m), slope (deg).
 * Returns a relative score in 0..1, not a flood probability.
 */
export function floodProneScore(rain: [number, number, number], site: { elevation_m: number; slope_deg: number } = model.site): number {
  const x = [...rain, site.elevation_m, site.slope_deg];
  const z = x.reduce((sum, v, i) => sum + ((v - model.mean[i]) / model.scale[i]) * model.coef[i], model.intercept);
  return 1 / (1 + Math.exp(-z));
}
