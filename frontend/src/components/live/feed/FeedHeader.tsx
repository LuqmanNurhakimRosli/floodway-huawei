import { MapPin } from 'lucide-react';
import { useCaptureCycle } from '../../../hooks/vision/useCaptureCycle';
import { sourceLabel } from '../../../lib/vision/describe';
import { formatDistance } from '../../../lib/vision/geo';
import { pct } from '../../../lib/vision/format';
import type { Camera } from '../../../types/vision';
import { OfflineChip, StatusChip } from '../shared/StatusChip';
import { card, heading, num } from '../shared/ui';
import { CountdownRing } from './CountdownRing';

/** Name and meta on the left; level, water % and the countdown on the right. Stacks into two rows when narrow. */
export function FeedHeader({ camera, distanceKm }: { camera: Camera; distanceKm: number }) {
  const cycle = useCaptureCycle(camera);
  const reading = camera.online ? camera.reading : null;
  return (
    <header className={`${card} @container/fh px-4 py-3 @min-[760px]/main:px-5`}>
      <div className="flex flex-col gap-3 @min-[520px]/fh:flex-row @min-[520px]/fh:items-center @min-[520px]/fh:justify-between">
        <div className="min-w-0">
          <h2 className={`${heading} truncate text-lg/7 @min-[520px]/fh:text-xl/7`} title={camera.name}>{camera.name}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm/5 text-slate-600">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className={num}>{formatDistance(distanceKm)}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{sourceLabel(camera)}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-between gap-4 @min-[520px]/fh:justify-end">
          <div className="flex items-center gap-3">
            {reading ? <StatusChip level={reading.level} size="md" /> : <OfflineChip label={camera.online ? 'WAITING' : 'OFFLINE'} size="md" />}
            {reading && (
              <p className="leading-none">
                <span className={`${num} block text-lg/6 font-semibold text-slate-900`}>{pct(reading.water_ratio)}</span>
                <span className="block text-xs/4 text-slate-600">of bank</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="text-xs/4 text-slate-600">Next<br />capture</span>
            <CountdownRing cycle={cycle} size={44} />
          </div>
        </div>
      </div>
    </header>
  );
}
