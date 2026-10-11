import { Droplet, MapPin } from 'lucide-react';
import { useCaptureCycle } from '../../../hooks/vision/useCaptureCycle';
import { sourceLabel } from '../../../lib/vision/describe';
import { formatDistance } from '../../../lib/vision/geo';
import { pct } from '../../../lib/vision/format';
import type { Camera } from '../../../types/vision';
import { OfflineChip, StatusChip } from '../shared/StatusChip';
import { card, heading } from '../shared/ui';
import { CountdownRing } from './CountdownRing';

export function FeedHeader({ camera, distanceKm }: { camera: Camera; distanceKm: number }) {
  const cycle = useCaptureCycle(camera);
  const reading = camera.reading;
  return (
    <header className={`${card} flex flex-wrap items-center justify-between gap-3 p-4`}>
      <div className="min-w-0">
        <h2 className={`${heading} truncate text-xl`}>{camera.name}</h2>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
          {formatDistance(distanceKm)}
          <span aria-hidden="true">·</span>
          {sourceLabel(camera)}
        </p>
      </div>
      <div className="flex items-center gap-4">
        {camera.online && reading ? <StatusChip level={reading.level} className="px-3 py-1.5 text-sm" /> : <OfflineChip className="px-3 py-1.5 text-sm" />}
        {camera.online && reading && (
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-[#1677FF]" aria-hidden="true" />
            <div className="leading-tight">
              <p className="font-mono text-lg font-bold text-slate-900">{pct(reading.water_ratio)}</p>
              <p className="text-xs text-slate-600">Water level</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <div className="text-right text-xs leading-tight text-slate-600">
            <p>Next capture in</p>
          </div>
          <CountdownRing cycle={cycle} />
        </div>
      </div>
    </header>
  );
}
