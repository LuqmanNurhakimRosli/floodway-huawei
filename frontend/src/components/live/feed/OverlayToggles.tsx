import { Eye, EyeOff } from 'lucide-react';
import { focusRing } from '../shared/ui';

export interface OverlayState {
  roi: boolean;
  lines: boolean;
  mask: boolean;
  waterline: boolean;
}

export const DEFAULT_OVERLAYS: OverlayState = { roi: true, lines: true, mask: true, waterline: true };
const LABELS: Record<keyof OverlayState, string> = { roi: 'Zone', lines: 'Lines', mask: 'Water', waterline: 'Waterline' };

interface Props {
  value: OverlayState;
  onChange: (next: OverlayState) => void;
}

export function OverlayToggles({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Feed overlays">
      {(Object.keys(LABELS) as (keyof OverlayState)[]).map((key) => {
        const on = value[key];
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange({ ...value, [key]: !on })}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold ${focusRing} ${
              on ? 'border-[#1677FF]/40 bg-blue-50 text-[#0958D9]' : 'border-slate-300 bg-white text-slate-600 hover:text-slate-900'
            }`}
          >
            {on ? <Eye className="h-3.5 w-3.5" aria-hidden="true" /> : <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />}
            {LABELS[key]}
          </button>
        );
      })}
    </div>
  );
}
