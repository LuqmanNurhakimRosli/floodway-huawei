import { forwardRef } from 'react';
import type { Fusion } from '../../../lib/fusion';
import { levelRank } from '../../../lib/vision/levelRules';
import { LEVEL_META } from '../../../lib/vision/levels';
import { num } from '../shared/ui';

const SIZE = 168;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/** The fused level as a ring that fills a quarter per level step. */
export const RiskRing = forwardRef<HTMLDivElement, { fusion: Fusion; total: number }>(function RiskRing({ fusion, total }, ref) {
  const meta = LEVEL_META[fusion.level];
  const Icon = meta.icon;
  const fill = (levelRank(fusion.level) + 1) / 4;
  const caption = fusion.agreeing.length > 0 ? `${fusion.agreeing.length} of ${total} agree` : `${fusion.reporting} of ${total} reporting`;

  return (
    <div ref={ref} className="relative mx-auto flex h-[168px] w-[168px] items-center justify-center" role="img" aria-label={`Fused flood level ${meta.label}, ${caption}`}>
      {fusion.level === 'DANGER' && (
        <span className="absolute inset-2 rounded-full bg-red-500/20 motion-safe:animate-[fusion-halo_1.8s_ease-out_infinite]" aria-hidden="true" />
      )}
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="white" stroke="#EEF2F7" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={meta.hex}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - fill)}
          className="transition-[stroke-dashoffset,stroke] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        />
      </svg>
      <div className="relative flex flex-col items-center text-center">
        <Icon className={`h-5 w-5 ${meta.text}`} aria-hidden="true" />
        <span className={`font-heading text-xl/7 font-extrabold tracking-tight ${meta.text}`}>{meta.label.toUpperCase()}</span>
        <span className={`${num} text-xs/4 text-slate-600`}>{caption}</span>
      </div>
    </div>
  );
});
