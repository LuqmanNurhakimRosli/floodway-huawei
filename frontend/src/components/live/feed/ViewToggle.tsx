import { LayoutGrid, Maximize } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { interactive } from '../shared/ui';

export type ViewMode = 'focus' | 'grid';

interface Props {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

const MODES: { mode: ViewMode; label: string; icon: LucideIcon }[] = [
  { mode: 'focus', label: 'Focus', icon: Maximize },
  { mode: 'grid', label: 'Grid', icon: LayoutGrid },
];

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="inline-flex shrink-0 rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="View mode">
      {MODES.map(({ mode, label, icon: Icon }) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          title={label}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-2 @min-[400px]/toolbar:px-3 @min-[760px]/main:min-h-9 text-sm/5 font-semibold ${interactive} ${value === mode ? 'bg-[#0958D9] text-white' : 'text-slate-700 hover:bg-slate-100'}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {/* Icon-only on the narrowest phones so the toolbar never overflows; the label stays for screen readers. */}
          <span className="sr-only @min-[400px]/toolbar:not-sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
