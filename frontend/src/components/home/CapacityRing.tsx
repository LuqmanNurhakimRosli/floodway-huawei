import React from 'react';
import { formatCapacity, percentOf } from '../../lib/format';
import { LEVEL_PALETTE } from '../../lib/vision/levels';

interface Props {
  current: number;
  max: number;
  size?: number;
}

/**
 * Shelter occupancy ring. Unknown capacity shows a dash and "Not reported", never 0%: an empty ring would claim the
 * shelter is empty.
 */
export function CapacityRing({ current, max, size = 84 }: Props) {
  const pct = percentOf(current, max);
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const state = pct === null ? null : pct >= 85 ? 'Nearly full' : pct >= 60 ? 'Filling' : 'Space available';
  const color = pct === null ? '#94A3B8' : pct >= 85 ? LEVEL_PALETTE.DANGER.marker : pct >= 60 ? LEVEL_PALETTE.WARNING.marker : LEVEL_PALETTE.NORMAL.marker;

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={pct === null ? 'Occupancy not reported' : `${pct}% occupied. ${state}.`}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} strokeDasharray={pct === null ? '4 5' : undefined} />
          {pct !== null && (
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * pct) / 100} ${c}`} className="transition-[stroke-dasharray] duration-500 ease-out motion-reduce:transition-none" />
          )}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-heading text-lg/6 font-bold tabular-nums text-slate-900">{pct === null ? '–' : `${pct}%`}</span>
      </div>
      <div className="min-w-0 text-sm/5">
        <p className="font-semibold text-slate-900">{state ?? 'Not reported'}</p>
        <p className="text-slate-700 tabular-nums">{formatCapacity(current, max)} places</p>
      </div>
    </div>
  );
}
