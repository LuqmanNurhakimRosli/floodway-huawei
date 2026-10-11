import { AlertTriangle, CheckCircle2, Info, Siren } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

interface LevelMeta {
  label: string;
  hex: string;
  icon: LucideIcon;
  chip: string;  // light pill: tinted background + dark text + border
  text: string;  // coloured text on white
  border: string;
  dot: string;
  solid: string; // saturated fill with a text colour that passes contrast
  soft: string;  // tinted card background
}

// Class strings are written out in full so Tailwind can see them at build time.
// Every text/background pair below is >= 4.5:1.
export const LEVEL_META: Record<Level, LevelMeta> = {
  NORMAL: {
    label: 'Normal', hex: LEVEL_PALETTE.NORMAL.marker, icon: CheckCircle2,
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', border: 'border-emerald-300',
    dot: 'bg-emerald-500', solid: 'bg-emerald-700 text-white', soft: 'bg-emerald-50',
  },
  ADVISORY: {
    label: 'Advisory', hex: LEVEL_PALETTE.ADVISORY.marker, icon: Info,
    chip: 'bg-sky-50 text-sky-800 border-sky-200', text: 'text-sky-700', border: 'border-sky-300',
    dot: 'bg-sky-500', solid: 'bg-sky-700 text-white', soft: 'bg-sky-50',
  },
  WARNING: {
    label: 'Warning', hex: LEVEL_PALETTE.WARNING.marker, icon: AlertTriangle,
    chip: 'bg-amber-50 text-amber-800 border-amber-300', text: 'text-amber-700', border: 'border-amber-300',
    dot: 'bg-amber-500', solid: 'bg-amber-700 text-white', soft: 'bg-amber-50',
  },
  DANGER: {
    label: 'Danger', hex: LEVEL_PALETTE.DANGER.marker, icon: Siren,
    chip: 'bg-red-50 text-red-800 border-red-300', text: 'text-red-700', border: 'border-red-400',
    dot: 'bg-red-600', solid: 'bg-red-700 text-white', soft: 'bg-red-50',
  },
};

/** Default thresholds, used only by the offline sample data. The server computes the real ones from calibration. */
export const SAMPLE_THRESHOLDS = { normal: 0.2, warning: 0.5, danger: 0.97 };

export function ratioToLevel(ratio: number, t = SAMPLE_THRESHOLDS): Level {
  if (ratio >= t.danger) return 'DANGER';
  if (ratio >= t.warning) return 'WARNING';
  if (ratio >= t.normal) return 'ADVISORY';
  return 'NORMAL';
}
