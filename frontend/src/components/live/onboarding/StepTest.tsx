import { Loader2 } from 'lucide-react';
import { pct } from '../../../lib/vision/format';
import type { Reading } from '../../../types/vision';
import { JsonOutputCard } from '../analysis/JsonOutputCard';
import { StatusChip } from '../shared/StatusChip';
import { btnSecondary } from '../shared/ui';

interface Props {
  loading: boolean;
  error: string | null;
  reading: Reading | null;
  offlineSample: boolean;
  onRetry: () => void;
}

export function StepTest({ loading, error, reading, offlineSample, onRetry }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-[#0E7C7B] motion-reduce:animate-none" aria-hidden="true" />
        <p className="font-semibold text-slate-900">Analysing a short burst of frames…</p>
        <p className="text-sm text-slate-600">This takes a few seconds.</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-3">
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
          {error}
        </p>
        <button type="button" onClick={onRetry} className={btnSecondary}>
          Try again
        </button>
      </div>
    );
  }
  if (!reading) return null;
  return (
    <div className="space-y-3">
      {offlineSample && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">Offline sample result. Connect the backend to run a real test.</p>}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
        <div>
          <p className="text-sm text-slate-600">Water at</p>
          <p className="font-heading text-3xl font-extrabold text-slate-900">{pct(reading.water_ratio)} <span className="text-base font-semibold text-slate-600">of bank</span></p>
        </div>
        <div className="text-right">
          <StatusChip level={reading.level} size="md" />
          <p className="mt-1 font-mono text-xs text-slate-600">confidence {Math.round(reading.confidence * 100)}%</p>
        </div>
      </div>
      {reading.low_confidence && <p className="text-sm font-semibold text-amber-800">Low confidence. Check that the zone covers only water and the lines match the bank, then test again.</p>}
      <JsonOutputCard reading={reading} />
    </div>
  );
}
