import { LayoutGrid, Maximize } from 'lucide-react';
import { focusRing } from '../shared/ui';

export type ViewMode = 'focus' | 'grid';

interface Props {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: Props) {
  const btn = (mode: ViewMode, label: string, Icon: typeof Maximize) => (
    <button
      key={mode}
      type="button"
      aria-pressed={value === mode}
      onClick={() => onChange(mode)}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ${focusRing} ${value === mode ? 'bg-[#1677FF] text-white' : 'text-slate-700 hover:bg-slate-100'}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="group" aria-label="View mode">
      {btn('focus', 'Focus', Maximize)}
      {btn('grid', 'Grid', LayoutGrid)}
    </div>
  );
}
