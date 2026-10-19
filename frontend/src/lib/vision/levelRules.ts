// The flood level rules with no UI dependencies, so the web app and the mobile app share one definition.
// lib/vision/levels.ts re-exports all of this and adds the web-only icons and class names.
import type { Level } from '../../types/vision';

export const LEVELS: Level[] = ['NORMAL', 'ADVISORY', 'WARNING', 'DANGER'];
export const levelRank = (level: Level): number => LEVELS.indexOf(level);
export const isAlertLevel = (level: Level): boolean => levelRank(level) >= levelRank('WARNING');

/**
 * The risk colour scale, used identically on Home, Map, Live Vision and Reports. Contrast is verified by
 * src/__tests__/palette.test.ts (WCAG): text on tint >= 4.5:1, white text on solid >= 4.5:1, marker on white >= 3:1.
 * Never put white text on a marker colour: NORMAL, ADVISORY and WARNING markers fail that on purpose (they are lighter).
 */
export const LEVEL_PALETTE: Record<Level, { text: string; tint: string; solid: string; marker: string }> = {
  NORMAL: { text: '#047857', tint: '#ECFDF5', solid: '#047857', marker: '#059669' },
  ADVISORY: { text: '#075985', tint: '#F0F9FF', solid: '#0369A1', marker: '#0284C7' },
  WARNING: { text: '#92400E', tint: '#FFFBEB', solid: '#B45309', marker: '#D97706' },
  DANGER: { text: '#991B1B', tint: '#FEF2F2', solid: '#B91C1C', marker: '#DC2626' },
};

/** Default thresholds, used only by the offline sample data. The server computes the real ones from calibration. */
export const SAMPLE_THRESHOLDS = { normal: 0.2, warning: 0.5, danger: 0.97 };

export function ratioToLevel(ratio: number, t = SAMPLE_THRESHOLDS): Level {
  if (ratio >= t.danger) return 'DANGER';
  if (ratio >= t.warning) return 'WARNING';
  if (ratio >= t.normal) return 'ADVISORY';
  return 'NORMAL';
}
