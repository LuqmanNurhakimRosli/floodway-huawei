import { useRef } from 'react';
import { useElementWidth } from '../../hooks/vision/useElementSize';
import { LEVEL_PALETTE } from '../../lib/vision/levels';
import type { StormResult } from '../../types/vision';

// The storm lab replays use the synthetic scene's calibration: these are its lines (backend seed.sample_calibration).
const LINES = [
  { key: 'danger', label: 'Danger', value: 0.97, color: LEVEL_PALETTE.DANGER.marker },
  { key: 'warning', label: 'Warning', value: 0.5, color: LEVEL_PALETTE.WARNING.marker },
  { key: 'normal', label: 'Normal', value: 0.2, color: LEVEL_PALETTE.NORMAL.marker },
] as const;

const H = 220;
const PAD = { l: 40, r: 12, t: 12, b: 28 };
const MAX = 1.25;

interface Props {
  result: StormResult;
  durationS: number;
}

/**
 * True water height (line) against what the pipeline measured (dots, coloured by the level it held), with alert and
 * barrier markers. Drawn at the real pixel width so text never shrinks on a phone.
 */
export function StormChart({ result, durationS }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const w = useElementWidth(ref, 640);
  const x = (t: number) => PAD.l + (t / durationS) * (w - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - Math.min(v, MAX) / MAX) * (H - PAD.t - PAD.b);
  const truth = result.timeline.map((p) => `${x(p.t).toFixed(1)},${y(p.truth).toFixed(1)}`).join(' ');
  const ticks = [0, durationS / 4, durationS / 2, (3 * durationS) / 4, durationS];
  const closed = result.barrier_events.find((e) => e.state === 'CLOSED');

  return (
    <div ref={ref} className="w-full">
      <svg
        width={w}
        height={H}
        viewBox={`0 0 ${w} ${H}`}
        className="block rounded-lg bg-slate-50"
        role="img"
        aria-label={`Storm replay: true water height and measured readings over ${Math.round(durationS / 60)} minutes, with ${result.alerts.length} alert${result.alerts.length === 1 ? '' : 's'}`}
      >
        {LINES.map((l) => (
          <g key={l.key}>
            <line x1={PAD.l} x2={w - PAD.r} y1={y(l.value)} y2={y(l.value)} stroke={l.color} strokeDasharray="4 4" strokeWidth={1} />
            <text x={PAD.l - 6} y={y(l.value) + 4} textAnchor="end" className="fill-slate-600 text-[12px]">{Math.round(l.value * 100)}%</text>
          </g>
        ))}
        {ticks.map((t) => (
          <text key={t} x={x(t)} y={H - 8} textAnchor={t === 0 ? 'start' : t === durationS ? 'end' : 'middle'} className="fill-slate-600 text-[12px]">
            {t === 0 ? '0' : `${Math.round(t / 60 * 10) / 10} min`}
          </text>
        ))}
        {closed && (
          <g>
            <rect x={x(closed.t)} y={PAD.t} width={Math.max(0, w - PAD.r - x(closed.t))} height={H - PAD.t - PAD.b} className="fill-red-600/5" />
            <line x1={x(closed.t)} x2={x(closed.t)} y1={PAD.t} y2={H - PAD.b} stroke="#B91C1C" strokeWidth={1.5} />
          </g>
        )}
        {result.alerts.map((a) => (
          <g key={`${a.t}-${a.level}`}>
            <line x1={x(a.t)} x2={x(a.t)} y1={PAD.t} y2={H - PAD.b} stroke={LEVEL_PALETTE[a.level].marker} strokeWidth={2} strokeDasharray={a.false_alert ? '3 3' : undefined} />
            <path d={`M ${x(a.t) - 6} ${PAD.t} h 12 l -6 8 z`} fill={LEVEL_PALETTE[a.level].marker} />
          </g>
        ))}
        <polyline points={truth} fill="none" stroke="#334155" strokeWidth={2} strokeLinejoin="round" />
        {result.timeline.map((p) =>
          p.measured === null ? null : p.held ? (
            <g key={p.t} stroke="#0F172A" strokeWidth={2}>
              <line x1={x(p.t) - 5} x2={x(p.t) + 5} y1={y(p.measured) - 5} y2={y(p.measured) + 5} />
              <line x1={x(p.t) - 5} x2={x(p.t) + 5} y1={y(p.measured) + 5} y2={y(p.measured) - 5} />
            </g>
          ) : (
            <circle key={p.t} cx={x(p.t)} cy={y(p.measured)} r={3.2} fill={LEVEL_PALETTE[p.level].marker} stroke="#fff" strokeWidth={1} />
          ),
        )}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs/4 text-slate-600" aria-label="Chart legend">
        <li className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full bg-slate-700" aria-hidden="true" />True height (scripted)</li>
        <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-600" aria-hidden="true" />Reading, coloured by level held</li>
        <li className="inline-flex items-center gap-1.5"><span className="text-sm/4 font-bold text-slate-900" aria-hidden="true">×</span>Held by the fault filter</li>
        <li className="inline-flex items-center gap-1.5"><span className="h-3 w-0.5 bg-red-600" aria-hidden="true" />Alert (dashed: false)</li>
        {closed && <li className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-red-100 ring-1 ring-red-600" aria-hidden="true" />Barrier closed</li>}
      </ul>
    </div>
  );
}
