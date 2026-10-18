// Depth from a resident's photo, using a reference object of known size, and a cross-check against nearby sensors.
//
// HONESTY: every result here is a RANGE, never a single exact depth. Object sizes vary (cars, people, kerbs), taps are a
// few pixels off, and the camera angle distorts heights. The cross-check compares evidence; it is not a verification.
import type { Level } from '../types/vision';

export type DepthRange = { lo: number; hi: number }; // centimetres

// ───────── Landmark method: "the water reaches the knee of a standing adult" ─────────

export interface Landmark {
  id: string;
  label: string;
  range: DepthRange;
}

export interface ReferenceObject {
  id: string;
  label: string;
  hint: string;
  landmarks: Landmark[];
}

// Typical heights above the ground. Ranges are deliberately wide to cover common variation (adult height, car model).
// They are rules of thumb for reporting, not survey values.
export const REFERENCE_OBJECTS: ReferenceObject[] = [
  {
    id: 'kerb', label: 'Kerb', hint: 'Road kerbs are about 15 cm high.',
    landmarks: [
      { id: 'below', label: 'Below the kerb top', range: { lo: 2, hi: 12 } },
      { id: 'level', label: 'Level with the kerb top', range: { lo: 12, hi: 20 } },
      { id: 'over', label: 'Over the kerb, pavement wet', range: { lo: 18, hi: 30 } },
    ],
  },
  {
    id: 'person', label: 'Standing adult', hint: 'An adult standing in the water, not wading through a current.',
    landmarks: [
      { id: 'ankle', label: 'Ankle', range: { lo: 8, hi: 15 } },
      { id: 'mid-shin', label: 'Mid-shin', range: { lo: 20, hi: 32 } },
      { id: 'knee', label: 'Knee', range: { lo: 42, hi: 55 } },
      { id: 'thigh', label: 'Mid-thigh', range: { lo: 60, hi: 75 } },
      { id: 'waist', label: 'Waist', range: { lo: 90, hi: 110 } },
    ],
  },
  {
    id: 'car', label: 'Parked car', hint: 'A saloon or hatchback. SUVs sit higher.',
    landmarks: [
      { id: 'rim', label: 'Bottom of the wheel rim', range: { lo: 8, hi: 15 } },
      { id: 'hub', label: 'Wheel centre', range: { lo: 28, hi: 35 } },
      { id: 'sill', label: 'Door sill, under the doors', range: { lo: 30, hi: 40 } },
      { id: 'tyre-top', label: 'Top of the tyre', range: { lo: 55, hi: 68 } },
      { id: 'handle', label: 'Door handle', range: { lo: 85, hi: 100 } },
    ],
  },
  {
    id: 'motorcycle', label: 'Motorcycle', hint: 'A typical kapchai or scooter, upright.',
    landmarks: [
      { id: 'rim', label: 'Bottom of the wheel rim', range: { lo: 5, hi: 12 } },
      { id: 'hub', label: 'Wheel axle', range: { lo: 22, hi: 30 } },
      { id: 'footrest', label: 'Footrest', range: { lo: 25, hi: 35 } },
      { id: 'seat', label: 'Seat', range: { lo: 70, hi: 85 } },
    ],
  },
];

export function landmarkRange(objectId: string, landmarkId: string): DepthRange | null {
  const obj = REFERENCE_OBJECTS.find((o) => o.id === objectId);
  return obj?.landmarks.find((l) => l.id === landmarkId)?.range ?? null;
}

// ───────── Measure method: tap two marks of known height and the waterline on the photo ─────────

export interface MeasureRef {
  id: string;
  label: string;
  /** Height above the ground of the upper and lower mark, with how much they vary. */
  upper: { label: string; cm: number; tolCm: number };
  lower: { label: string; cm: number; tolCm: number };
}

export const MEASURE_REFS: MeasureRef[] = [
  {
    id: 'door', label: 'House or shop door',
    upper: { label: 'Top of the door frame', cm: 210, tolCm: 10 },
    lower: { label: 'Door handle', cm: 100, tolCm: 8 },
  },
  {
    id: 'car', label: 'Parked car (saloon)',
    upper: { label: 'Roof edge', cm: 145, tolCm: 8 },
    lower: { label: 'Door handle', cm: 92, tolCm: 8 },
  },
  {
    id: 'gauge', label: 'Painted depth gauge or marked pole',
    upper: { label: 'Upper mark you can read', cm: 100, tolCm: 1 },
    lower: { label: 'Lower mark you can read', cm: 50, tolCm: 1 },
  },
];

export interface MeasureInput {
  /** Vertical positions in image pixels (0 = top of the photo). */
  upperY: number;
  lowerY: number;
  waterY: number;
  upperCm: number;
  lowerCm: number;
  upperTolCm?: number;
  lowerTolCm?: number;
  /** How far off a tap can be, in pixels. */
  tapErrPx?: number;
  /** Extra relative error for camera angle (perspective). */
  perspective?: number;
}

export type MeasureResult = { ok: true; range: DepthRange; cmPerPx: number } | { ok: false; reason: string };

const clampRange = (lo: number, hi: number): DepthRange => ({ lo: Math.max(0, Math.round(lo)), hi: Math.max(0, Math.round(hi)) });

/**
 * Depth = height of the lower mark minus the photo distance from that mark down to the water, scaled by the two marks.
 * The range combines mark-height variation, tap error on all three points and a perspective allowance.
 */
export function measureDepth(m: MeasureInput): MeasureResult {
  const tap = m.tapErrPx ?? 6;
  const persp = m.perspective ?? 0.1;
  if (!(m.upperCm > m.lowerCm)) return { ok: false, reason: 'The upper mark must be higher above the ground than the lower one.' };
  if (!(m.upperY < m.lowerY)) return { ok: false, reason: 'Tap the upper mark first, then the lower mark below it.' };
  if (!(m.waterY > m.lowerY)) return { ok: false, reason: 'The waterline must be below the lower mark. Choose a lower mark above the water.' };
  const markPx = m.lowerY - m.upperY;
  if (markPx < 20) return { ok: false, reason: 'The two marks are too close together on the photo to measure. Zoom out or pick marks further apart.' };

  const markCm = m.upperCm - m.lowerCm;
  const cmPerPx = markCm / markPx;
  const gapPx = m.waterY - m.lowerY;
  const depth = m.lowerCm - gapPx * cmPerPx;

  // Worst-case bounds: scale from the extremes of mark heights and taps, then widen for perspective.
  const markCmLo = Math.max(1, markCm - (m.upperTolCm ?? 0) - (m.lowerTolCm ?? 0));
  const markCmHi = markCm + (m.upperTolCm ?? 0) + (m.lowerTolCm ?? 0);
  const scaleLo = markCmLo / (markPx + 2 * tap);
  const scaleHi = markCmHi / Math.max(1, markPx - 2 * tap);
  const deep = m.lowerCm + (m.lowerTolCm ?? 0) - Math.max(0, gapPx - 2 * tap) * scaleLo;
  const shallow = m.lowerCm - (m.lowerTolCm ?? 0) - (gapPx + 2 * tap) * scaleHi;
  const spread = Math.abs(depth) * persp;
  const lo = Math.min(shallow, depth) - spread;
  const hi = Math.max(deep, depth) + spread;
  if (hi <= 0) return { ok: false, reason: 'By these marks the water is below the ground. Check that you tapped the waterline, not a reflection.' };
  return { ok: true, range: clampRange(lo, hi), cmPerPx };
}

// ───────── Levels and the cross-check ─────────

// Street-depth working thresholds, the same as the demo underpass depth node fw-node-03 (backend config.py):
// ADVISORY from 11 cm (75% of the warning line), WARNING from 15 cm, DANGER from 30 cm. Not an official standard.
export const STREET_LEVELS = { advisory: 11, warning: 15, danger: 30 };

export function depthToLevel(cm: number): Level {
  if (cm >= STREET_LEVELS.danger) return 'DANGER';
  if (cm >= STREET_LEVELS.warning) return 'WARNING';
  if (cm >= STREET_LEVELS.advisory) return 'ADVISORY';
  return 'NORMAL';
}

export const midpoint = (r: DepthRange): number => Math.round((r.lo + r.hi) / 2);
export const formatRange = (r: DepthRange): string => (r.lo === r.hi ? `${r.lo} cm` : `${r.lo} to ${r.hi} cm`);

const RANK: Record<Level, number> = { NORMAL: 0, ADVISORY: 1, WARNING: 2, DANGER: 3 };

/** The levels a depth range could be in, lowest to highest. */
export function levelsInRange(r: DepthRange): Level[] {
  const lo = RANK[depthToLevel(r.lo)];
  const hi = RANK[depthToLevel(r.hi)];
  return (['NORMAL', 'ADVISORY', 'WARNING', 'DANGER'] as Level[]).filter((l) => RANK[l] >= lo && RANK[l] <= hi);
}

export type Agreement = 'agrees' | 'close' | 'differs' | 'unavailable';

export interface NearbySensor {
  kind: 'camera' | 'street-node' | 'river-node';
  name: string;
  distanceKm: number;
  level: Level;
  /** Street depth in metres, only for street depth nodes. */
  depthM?: number;
}

export const NEARBY_KM = 1.5;

/**
 * A river camera or river station measures bank height or river stage, not street depth, so it is compared by danger
 * level. A street depth node measures the same thing as the photo, so it is compared in centimetres.
 */
export function compareSensor(range: DepthRange, s: NearbySensor | null): Agreement {
  if (!s || s.distanceKm > NEARBY_KM) return 'unavailable';
  if (s.kind === 'street-node' && s.depthM !== undefined) {
    const cm = s.depthM * 100;
    if (cm >= range.lo - 5 && cm <= range.hi + 5) return 'agrees';
    return Math.abs(cm - midpoint(range)) <= 15 ? 'close' : 'differs';
  }
  const levels = levelsInRange(range);
  if (levels.includes(s.level)) return 'agrees';
  const gap = Math.min(...levels.map((l) => Math.abs(RANK[l] - RANK[s.level])));
  return gap <= 1 ? 'close' : 'differs';
}

/** The AI's own depth estimate against the photo range. `null` when the check did not run or gave no number. */
export function compareAi(range: DepthRange, aiDepthCm: number | null | undefined): Agreement {
  if (aiDepthCm === null || aiDepthCm === undefined || !Number.isFinite(aiDepthCm) || aiDepthCm <= 0) return 'unavailable';
  if (aiDepthCm >= range.lo - 5 && aiDepthCm <= range.hi + 5) return 'agrees';
  return Math.abs(aiDepthCm - midpoint(range)) <= 20 ? 'close' : 'differs';
}

/** "2 of 2 available inputs agree with your measurement" style summary. Never a verdict. */
export function summarise(checks: Agreement[]): { available: number; agreeing: number; text: string } {
  const available = checks.filter((c) => c !== 'unavailable').length;
  const agreeing = checks.filter((c) => c === 'agrees' || c === 'close').length;
  if (available === 0) return { available, agreeing, text: 'Nothing nearby to compare with yet. A person still reviews this report.' };
  return {
    available,
    agreeing,
    text: `${agreeing} of ${available} other ${available === 1 ? 'input is' : 'inputs are'} consistent with your measurement. A person still reviews this report.`,
  };
}
