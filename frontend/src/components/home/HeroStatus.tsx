import React from 'react';
import { Activity, CircleHelp } from 'lucide-react';
import { useNow } from '../../hooks/useNow';
import { freshness, heroSentence } from '../../lib/home';
import type { CameraCounts } from '../../lib/home';
import { clockTime } from '../../lib/vision/format';
import { LEVEL_META, LEVEL_PALETTE } from '../../lib/vision/levels';
import type { Camera, Level } from '../../types/vision';
import { Skeleton } from '../live/shared/Skeleton';
import { pill } from '../../styles/tokens';

interface Props {
  loading: boolean;
  level: Level | null;
  topCamera: Camera | null;
  updatedAt: number | null;
  /** true when every camera is a sample, or the server is unreachable and the page runs on built-in sample data */
  sample: boolean;
  counts: CameraCounts;
}

const FRESH = {
  fresh: { dot: 'bg-emerald-600', word: 'Fresh' },
  aging: { dot: 'bg-amber-600', word: 'Ageing' },
  stale: { dot: 'bg-red-600', word: 'Stale' },
  unknown: { dot: 'bg-slate-400', word: 'No data' },
} as const;

/** The first thing on screen: one overall level, how fresh the data is, and where it comes from. */
export function HeroStatus({ loading, level, topCamera, updatedAt, sample, counts }: Props) {
  const now = useNow(1000);
  if (loading) return <Skeleton className="h-36 w-full md:h-32" />;

  const meta = level ? LEVEL_META[level] : null;
  const pal = level ? LEVEL_PALETTE[level] : null;
  const Icon = meta?.icon ?? CircleHelp;
  const fresh = freshness(updatedAt, now);
  const f = FRESH[fresh.state];

  return (
    <section
      aria-label="Overall flood risk"
      className="rounded-2xl border-2 p-4 md:p-6"
      style={{ backgroundColor: pal?.tint ?? '#F1F5F9', borderColor: pal?.marker ?? '#94A3B8' }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3 md:gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white md:h-14 md:w-14" style={{ backgroundColor: pal?.solid ?? '#475569' }}>
            <Icon className="h-6 w-6 md:h-7 md:w-7" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs/4 font-semibold uppercase tracking-wide" style={{ color: pal?.text ?? '#334155' }}>Flood risk</p>
            <h1 className="font-heading text-3xl/9 font-extrabold md:text-4xl/10" style={{ color: pal?.text ?? '#334155' }}>
              {meta ? meta.label.toUpperCase() : 'NO DATA'}
            </h1>
            <p className="mt-1 max-w-[62ch] text-sm/5 text-slate-800">{heroSentence(level, sample ? 'sample' : 'live', topCamera)}</p>
            <span className="sr-only" aria-live="polite">{meta ? `Flood risk is ${meta.label}.` : 'No data.'}</span>
          </div>
        </div>

        <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-xs/4 md:text-right">
          <div>
            <dt className="text-slate-700">Updated</dt>
            <dd className="font-['JetBrains_Mono',ui-monospace,monospace] text-sm/5 font-semibold tabular-nums text-slate-900">{updatedAt ? clockTime(new Date(updatedAt).toISOString()) : '--:--:--'}</dd>
          </div>
          <div>
            <dt className="text-slate-700">Data age</dt>
            <dd className="flex items-center gap-1.5 text-sm/5 font-semibold text-slate-900 md:justify-end">
              <span className={`h-2.5 w-2.5 rounded-full ${f.dot}`} aria-hidden="true" />
              {f.word}{fresh.seconds !== null && <span className="font-normal text-slate-700 tabular-nums"> · {fresh.seconds}s</span>}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={pill}><Activity className="h-3.5 w-3.5" aria-hidden="true" /> {counts.online} of {counts.total} cameras online</span>
        {counts.alerting > 0 && <span className={`${pill} border-red-300 text-red-800`}>{counts.alerting} at warning or above</span>}
        <span className={`${pill} ${sample ? 'border-amber-300 bg-amber-50 text-amber-900' : ''}`}>{sample ? 'Sample cameras (simulated)' : 'Includes user cameras'}</span>
      </div>
    </section>
  );
}
