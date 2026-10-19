import { AlertTriangle, CheckCircle2, Info, Siren } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Level } from '../../types/vision';
import { LEVEL_PALETTE } from './levelRules';

export * from './levelRules';

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
