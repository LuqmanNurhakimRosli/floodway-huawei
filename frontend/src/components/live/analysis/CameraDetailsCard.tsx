import { Camera as CameraIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { sourceLabel } from '../../../lib/vision/describe';
import { formatCoords, formatDistance } from '../../../lib/vision/geo';
import type { Camera } from '../../../types/vision';
import { card, cardPad, cardTitle, interactive, num } from '../shared/ui';

interface Props {
  camera: Camera;
  distanceKm: number;
  onRemove?: () => Promise<void>;
}

export function CameraDetailsCard({ camera, distanceKm, onRemove }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const removable = camera.provider === 'mine' && camera.source_type !== 'synthetic' && onRemove;

  const rows: { k: string; v: string; mono?: boolean }[] = [
    { k: 'Source', v: camera.source_type === 'synthetic' ? 'Sample (self-running scene)' : sourceLabel(camera) },
    { k: 'Distance', v: `${formatDistance(distanceKm)} from you`, mono: true },
    { k: 'Coordinates', v: formatCoords(camera.lat, camera.lon), mono: true },
    { k: 'Capture cycle', v: `every ${camera.interval_s}s`, mono: true },
  ];

  return (
    <section className={`${card} ${cardPad}`} aria-labelledby="cd-title">
      <div className="flex min-h-10 items-center justify-between gap-3">
        <h3 id="cd-title" className={`${cardTitle} flex items-center gap-2`}>
          <CameraIcon className="h-5 w-5 text-slate-600" aria-hidden="true" /> Camera details
        </h3>
        {removable && !confirming && (
          <button type="button" onClick={() => setConfirming(true)} aria-label="Remove this camera" className={`flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700 ${interactive}`}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <dl className="mt-2 divide-y divide-slate-100 text-sm/5">
        {rows.map(({ k, v, mono }) => (
          <div key={k} className="flex min-h-10 items-center justify-between gap-3 py-2">
            <dt className="shrink-0 text-slate-600">{k}</dt>
            <dd className={`truncate text-right font-medium text-slate-900 ${mono ? num : ''}`}>{v}</dd>
          </div>
        ))}
      </dl>
      {removable && confirming && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3" role="alertdialog" aria-label="Confirm removal">
          <p className="text-sm/5 font-semibold text-red-800">Remove this camera?</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirming(false)} className={`min-h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-800 ${interactive}`}>
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onRemove?.();
                } finally {
                  setBusy(false);
                  setConfirming(false);
                }
              }}
              className={`min-h-11 rounded-xl bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 ${interactive}`}
            >
              {busy ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
