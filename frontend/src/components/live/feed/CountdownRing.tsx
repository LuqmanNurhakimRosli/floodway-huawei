import type { CycleState } from '../../../hooks/vision/useCaptureCycle';

interface Props {
  cycle: CycleState;
  size?: number;
}

/** Circular countdown: seconds in the middle while waiting, a spinning arc while analysing. */
export function CountdownRing({ cycle, size = 48 }: Props) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const analysing = cycle.phase === 'analysing';
  const dim = cycle.phase === 'offline' || cycle.phase === 'stale';
  const dash = analysing ? c * 0.28 : c * Math.max(0, Math.min(1, cycle.progress));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={analysing ? 'Analysing' : dim ? 'No countdown' : `${cycle.secondsLeft} seconds to next capture`}>
      <svg width={size} height={size} className={analysing ? 'animate-spin motion-reduce:animate-none' : '-rotate-90'}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dim ? '#94A3B8' : '#1677FF'} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${dash} ${c}`} className="transition-[stroke-dasharray] duration-300 ease-linear motion-reduce:transition-none" />
      </svg>
      {!analysing && (
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-slate-800">{dim ? '–' : `${cycle.secondsLeft}s`}</span>
      )}
    </div>
  );
}
