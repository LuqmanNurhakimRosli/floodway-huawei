// Display formatters. Rule: nothing in the UI may ever render NaN, undefined, null or an empty value.
// Every formatter returns an em dash (or an explicit "Not reported") when its input is missing or not finite.
export const DASH = '–';

/** A finite number, or null. Accepts numeric strings; rejects NaN, Infinity, '', null and undefined. */
export function safeNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function formatKm(km: unknown): string {
  const n = safeNumber(km);
  if (n === null || n < 0) return DASH;
  return n < 1 ? `${Math.round(n * 1000)} m` : `${n.toFixed(1)} km`;
}

export function formatMin(min: unknown): string {
  const n = safeNumber(min);
  if (n === null || n < 0) return DASH;
  return n < 1 ? '< 1 min' : `${Math.round(n)} min`;
}

/** Whole-number percent of current/max, clamped to 0..100. null when max is missing, zero or negative. */
export function percentOf(current: unknown, max: unknown): number | null {
  const c = safeNumber(current);
  const m = safeNumber(max);
  if (c === null || m === null || m <= 0 || c < 0) return null;
  return Math.min(100, Math.round((c / m) * 100));
}

export function formatPct(current: unknown, max: unknown): string {
  const p = percentOf(current, max);
  return p === null ? DASH : `${p}%`;
}

/** "146 / 200", or "Not reported" when either side is unusable. */
export function formatCapacity(current: unknown, max: unknown): string {
  const c = safeNumber(current);
  const m = safeNumber(max);
  if (c === null || m === null || m <= 0) return 'Not reported';
  return `${c} / ${m}`;
}

export function formatCm(cm: unknown): string {
  const n = safeNumber(cm);
  return n === null || n < 0 ? DASH : `${Math.round(n)} cm`;
}

/** Text that may be missing: never an empty string. */
export function textOr(value: unknown, fallback = DASH): string {
  return typeof value === 'string' && value.trim() !== '' ? value : fallback;
}
