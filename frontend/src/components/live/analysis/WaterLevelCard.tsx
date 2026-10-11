import { AlertTriangle, Waves } from 'lucide-react';
import { describeReading } from '../../../lib/vision/describe';
import { pct } from '../../../lib/vision/format';
import { LEVEL_META } from '../../../lib/vision/levels';
import { thresholdsFromCalibration } from '../../../lib/vision/thresholds';
import type { Camera } from '../../../types/vision';
import { card, heading } from '../shared/ui';

const REF = [
  { key: 'danger', label: 'Danger', note: 'bank full', dot: 'bg-red-500' },
  { key: 'warning', label: 'Warning', note: 'high', dot: 'bg-amber-500' },
  { key: 'normal', label: 'Normal', note: 'low', dot: 'bg-emerald-500' },
] as const;

export function WaterLevelCard({ camera }: { camera: Camera }) {
  const reading = camera.reading;
  const t = thresholdsFromCalibration(camera.calibration);

  if (!camera.online || !reading) {
    return (
      <section className={`${card} p-4`} aria-live="polite">
        <h3 className={`${heading} flex items-center gap-2 text-base`}>
          <Waves className="h-5 w-5 text-[#1677FF]" aria-hidden="true" /> Water level
        </h3>
        <p className="mt-3 font-semibold text-slate-900">{camera.online ? 'Waiting for the first analysis…' : 'No reading: camera offline'}</p>
        <p className="mt-1 text-sm text-slate-600">{camera.online ? 'The first result appears after the first capture cycle.' : 'The last level is hidden because it may be out of date.'}</p>
      </section>
    );
  }

  const meta = LEVEL_META[reading.level];
  const Icon = meta.icon;
  const fill = Math.min(100, Math.round(reading.water_ratio * 100));
  const conf = Math.round(reading.confidence * 100);

  return (
    <section className={`${card} p-4`} aria-live="polite">
      <div className="flex items-center justify-between">
        <h3 className={`${heading} flex items-center gap-2 text-base`}>
          <Waves className="h-5 w-5 text-[#1677FF]" aria-hidden="true" /> Water level
        </h3>
        <span className={`inline-flex items-center gap-1.5 text-sm font-extrabold ${meta.text}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
          {meta.label.toUpperCase()}
        </span>
      </div>

      <p className="mt-3 flex items-baseline gap-2">
        <span className="font-heading text-5xl font-extrabold tracking-tight text-slate-900">{pct(reading.water_ratio)}</span>
        <span className="text-base text-slate-600">of bank</span>
      </p>

      <div className="relative mt-3 h-3 rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={fill} aria-label="Water level as a share of bank height">
        <div className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${fill}%`, backgroundColor: meta.hex }} />
        {[t.normal, t.warning].map((v, i) => (
          <span key={i} className="absolute top-0 h-full w-0.5 bg-slate-400/70" style={{ left: `${Math.min(100, v * 100)}%` }} aria-hidden="true" />
        ))}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-700">{describeReading(reading)}</p>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <h4 className={`${heading} text-sm`}>Reference lines</h4>
        <ul className="mt-2 space-y-1.5 text-sm">
          {REF.map((r) => (
            <li key={r.key} className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-slate-800">
                <span className={`h-3 w-3 rounded-full ${r.dot}`} aria-hidden="true" />
                {r.label}
              </span>
              <span className="font-mono text-slate-600">
                ~{Math.round(t[r.key] * 100)}% ({r.note})
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">AI confidence</span>
          <span className="font-mono font-bold text-slate-900">{conf}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={conf} aria-label="AI confidence">
          <div className="h-full rounded-full bg-[#1677FF]" style={{ width: `${conf}%` }} />
        </div>
        {reading.low_confidence && (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> Low confidence. Human review recommended.
          </p>
        )}
        <p className="mt-2 text-xs text-slate-600">Level drops only after 3 safe readings.</p>
      </div>
    </section>
  );
}
