import { AlertTriangle, CheckCircle2, Info, Siren } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Level } from '../../types/vision';

export const LEVELS: Level[] = ['NORMAL', 'ADVISORY', 'WARNING', 'DANGER'];
export const levelRank = (level: Level): number => LEVELS.indexOf(level);
export const isAlertLevel = (level: Level): boolean => levelRank(level) >= levelRank('WARNING');

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
    label: 'Normal', hex: '#10B981', icon: CheckCircle2,
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-700', border: 'border-emerald-300',
    dot: 'bg-emerald-500', solid: 'bg-emerald-700 text-white', soft: 'bg-emerald-50',
  },
  ADVISORY: {
    label: 'Advisory', hex: '#0EA5E9', icon: Info,
    chip: 'bg-sky-50 text-sky-800 border-sky-200', text: 'text-sky-700', border: 'border-sky-300',
    dot: 'bg-sky-500', solid: 'bg-sky-700 text-white', soft: 'bg-sky-50',
  },
  WARNING: {
    label: 'Warning', hex: '#F59E0B', icon: AlertTriangle,
    chip: 'bg-amber-50 text-amber-800 border-amber-300', text: 'text-amber-700', border: 'border-amber-300',
    dot: 'bg-amber-500', solid: 'bg-amber-500 text-slate-900', soft: 'bg-amber-50',
  },
  DANGER: {
    label: 'Danger', hex: '#DC2626', icon: Siren,
    chip: 'bg-red-50 text-red-700 border-red-300', text: 'text-red-700', border: 'border-red-400',
    dot: 'bg-red-600', solid: 'bg-red-600 text-white', soft: 'bg-red-50',
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
