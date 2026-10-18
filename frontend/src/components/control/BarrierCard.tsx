import { Ban, CircleCheck, Hand, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { clockTime } from '../../lib/vision/format';
import { parseTrigger } from '../../lib/vision/barriers';
import type { Barrier, BarrierAction } from '../../types/vision';
import { StatusChip } from '../live/shared/StatusChip';
import { btnSecondary, card, cardPad, cardTitle, num } from '../../styles/tokens';

interface Props {
  barrier: Barrier;
  onCommand: (action: BarrierAction) => Promise<void>;
}

/** The arm itself: raised when open, lowered with stripes when closed. Motion respects reduced-motion settings. */
function BarrierArt({ closed }: { closed: boolean }) {
  return (
    <svg viewBox="0 0 120 64" className="h-16 w-28 shrink-0" role="img" aria-label={closed ? 'Barrier arm lowered' : 'Barrier arm raised'}>
      <rect x="0" y="58" width="120" height="6" rx="2" className="fill-slate-300" />
      <rect x="10" y="20" width="10" height="40" rx="2" className="fill-slate-700" />
      <circle cx="15" cy="24" r="5" className={closed ? 'fill-red-600' : 'fill-emerald-500'} />
      <g
        style={{ transformOrigin: '15px 28px', transform: closed ? 'rotate(0deg)' : 'rotate(-62deg)' }}
        className="transition-transform duration-700 ease-out motion-reduce:transition-none"
      >
        <rect x="15" y="25" width="100" height="7" rx="2" className="fill-white stroke-slate-400" strokeWidth="1" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={24 + i * 19} y="25" width="9" height="7" className={closed ? 'fill-red-600' : 'fill-slate-300'} />
        ))}
      </g>
    </svg>
  );
}

export function BarrierCard({ barrier: b, onCommand }: Props) {
  const [busy, setBusy] = useState<BarrierAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const closed = b.state === 'CLOSED';
  const trigger = parseTrigger(b.trigger);

  const run = async (action: BarrierAction) => {
    setBusy(action);
    setError(null);
    try {
      await onCommand(action);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The command did not reach the server.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className={`${card} ${cardPad} ${closed ? 'border-red-300 ring-1 ring-red-200' : ''}`} aria-labelledby={`barrier-${b.id}`}>
      <div className="flex items-start gap-3">
        <BarrierArt closed={closed} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold tracking-wide ${closed ? 'bg-red-700 text-white' : 'bg-emerald-700 text-white'}`}
            >
              {closed ? <Ban className="h-3.5 w-3.5" aria-hidden="true" /> : <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" />}
              {closed ? 'CLOSED' : 'OPEN'}
            </span>
            <span className="rounded-full border border-slate-300 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {b.mode === 'auto' ? 'Automatic' : 'Manual override'}
            </span>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-900">SIMULATED</span>
          </div>
          <h3 id={`barrier-${b.id}`} className={`${cardTitle} mt-1.5`}>{b.name}</h3>
          <p className="mt-0.5 text-sm/5 text-slate-700">{b.reason}</p>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl bg-slate-50 p-3 text-xs/4">
        <div className="min-w-0">
          <dt className="text-slate-600">{trigger.kind === 'camera' ? 'Trigger camera' : 'Trigger depth node'}</dt>
          <dd className="font-semibold text-slate-900 [overflow-wrap:anywhere]">{b.trigger_name.replace(' (sample camera)', '')}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Trigger level</dt>
          <dd className="mt-0.5">{b.last_level ? <StatusChip level={b.last_level} /> : <span className="font-semibold text-slate-700">No reading yet</span>}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Last change</dt>
          <dd className={`${num} font-semibold text-slate-900`}>{b.changed_at ? clockTime(b.changed_at) : '–'}</dd>
        </div>
        <div>
          <dt className="text-slate-600">Rule</dt>
          <dd className="font-semibold text-slate-900">Close at DANGER, reopen at Advisory</dd>
        </div>
      </dl>

      <div className="mt-3 grid grid-cols-3 gap-2" role="group" aria-label={`Operator controls for ${b.name}`}>
        <button type="button" className={`${btnSecondary} px-2 text-xs`} disabled={busy !== null || (closed && b.mode === 'manual')} onClick={() => void run('close')}>
          <Hand className="h-4 w-4" aria-hidden="true" /> {busy === 'close' ? 'Closing…' : 'Close'}
        </button>
        <button type="button" className={`${btnSecondary} px-2 text-xs`} disabled={busy !== null || (!closed && b.mode === 'manual')} onClick={() => void run('open')}>
          <CircleCheck className="h-4 w-4" aria-hidden="true" /> {busy === 'open' ? 'Opening…' : 'Open'}
        </button>
        <button type="button" className={`${btnSecondary} px-2 text-xs`} disabled={busy !== null || b.mode === 'auto'} onClick={() => void run('auto')}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Auto
        </button>
      </div>
      {error && <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs/4 font-semibold text-red-900">{error}</p>}
    </article>
  );
}
