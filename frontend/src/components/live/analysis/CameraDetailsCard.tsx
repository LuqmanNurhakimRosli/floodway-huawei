import { Camera as CameraIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { sourceLabel } from '../../../lib/vision/describe';
import { formatCoords, formatDistance } from '../../../lib/vision/geo';
import type { Camera } from '../../../types/vision';
import { card, focusRing, heading } from '../shared/ui';

interface Props {
  camera: Camera;
  distanceKm: number;
  onRemove?: () => Promise<void>;
}

export function CameraDetailsCard({ camera, distanceKm, onRemove }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const removable = camera.provider === 'mine' && camera.source_type !== 'synthetic' && onRemove;

  const rows: [string, string][] = [
    ['Name', camera.name],
    ['Location', `${formatDistance(distanceKm)} from you`],
    ['Source', camera.source_type === 'synthetic' ? 'Sample (self-running scene)' : sourceLabel(camera)],
    ['Coordinates', formatCoords(camera.lat, camera.lon)],
  ];

  return (
    <section className={`${card} p-4`}>
      <div className="flex items-center justify-between">
        <h3 className={`${heading} flex items-center gap-2 text-base`}>
          <CameraIcon className="h-5 w-5 text-slate-600" aria-hidden="true" /> Camera details
        </h3>
        {removable && !confirming && (
          <button type="button" onClick={() => setConfirming(true)} aria-label="Remove this camera" className={`flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-red-600 ${focusRing}`}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <dl className="mt-3 divide-y divide-slate-100 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3 py-2">
            <dt className="text-slate-600">{k}</dt>
            <dd className="text-right font-semibold text-slate-900">{v}</dd>
          </div>
        ))}
      </dl>
      {removable && confirming && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-semibold text-red-800">Remove this camera?</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setConfirming(false)} className={`min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 ${focusRing}`}>
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
              className={`min-h-10 rounded-lg bg-red-600 px-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60 ${focusRing}`}
            >
              {busy ? 'Removing…' : 'Remove'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
