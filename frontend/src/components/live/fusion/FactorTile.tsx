import type { LucideIcon } from 'lucide-react';
import { forwardRef } from 'react';
import type { FactorSource } from '../../../lib/fusion';
import type { FactorState } from '../../../lib/stormScenario';
import { LEVEL_META } from '../../../lib/vision/levels';
import { num } from '../shared/ui';
import { OfflineChip, StatusChip } from '../shared/StatusChip';

const SOURCE_STYLE: Record<FactorSource, string> = {
  REAL: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  MODEL: 'border-blue-200 bg-blue-50 text-blue-800',
  SAMPLE: 'border-amber-200 bg-amber-50 text-amber-900',
  SCRIPTED: 'border-slate-300 bg-slate-100 text-slate-700',
  PLANNED: 'border-dashed border-slate-300 bg-white text-slate-600',
};

interface Props {
  icon: LucideIcon;
  name: string;
  /** What this factor answers: where, when, now. */
  role: string;
  state: FactorState;
  /** Changes whenever the reading changes, to replay the pulse. */
  pulseKey: number;
}

export const FactorTile = forwardRef<HTMLDivElement, Props>(function FactorTile({ icon: Icon, name, role, state, pulseKey }, ref) {
  const meta = state.level ? LEVEL_META[state.level] : null;
  return (
    <div
      ref={ref}
      key={pulseKey}
      className={`relative flex min-w-0 flex-col gap-2 rounded-2xl border bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color] duration-300 ease-out motion-reduce:transition-none @min-[640px]/main:p-4 ${meta ? meta.border : 'border-slate-200'} ${pulseKey > 0 ? 'motion-safe:animate-[fusion-pulse_280ms_ease-out]' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta ? meta.soft : 'bg-slate-50'}`}>
            <Icon className={`h-[18px] w-[18px] ${meta ? meta.text : 'text-slate-500'}`} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm/5 font-semibold text-slate-900">{name}</p>
            <p className="truncate text-xs/4 text-slate-500">{role}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px]/4 font-bold tracking-wide ${SOURCE_STYLE[state.source]}`}>{state.source}</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
        <span className={`${num} text-2xl/8 font-semibold text-slate-900`}>{state.value}</span>
        {state.level ? <StatusChip level={state.level} /> : <OfflineChip label="NO DATA" />}
      </div>
      <p className="line-clamp-2 text-xs/4 text-slate-600">{state.detail}</p>
    </div>
  );
});
