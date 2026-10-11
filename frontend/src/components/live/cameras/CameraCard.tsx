import { Droplet, MapPin } from 'lucide-react';
import { useCaptureCycle } from '../../../hooks/vision/useCaptureCycle';
import { formatDistance } from '../../../lib/vision/geo';
import { pct, timeAgo } from '../../../lib/vision/format';
import { LEVEL_META } from '../../../lib/vision/levels';
import { FeedThumb } from '../feed/FeedThumb';
import { OfflineChip, StatusChip } from '../shared/StatusChip';
import { Sparkline } from '../shared/Sparkline';
import { focusRing } from '../shared/ui';
import type { Camera, Reading } from '../../../types/vision';

interface Props {
  camera: Camera;
  distanceKm: number;
  history: Reading[];
  selected: boolean;
  useScene: boolean;
  onSelect: () => void;
}

export function CameraCard({ camera, distanceKm, history, selected, useScene, onSelect }: Props) {
  const cycle = useCaptureCycle(camera);
  const reading = camera.reading;
  const meta = reading ? LEVEL_META[reading.level] : null;

  let status = `Next capture in ${cycle.secondsLeft}s`;
  if (!camera.online) status = `Offline for ${timeAgo(camera.last_frame_at).replace(' ago', '')}`;
  else if (cycle.phase === 'stale') status = 'Stale feed';
  else if (cycle.phase === 'analysing') status = 'Analysing…';
  else if (camera.feed_refresh_s > 0) status = `Updated ${timeAgo(camera.last_frame_at)}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full gap-3 rounded-2xl border-2 bg-white p-2.5 text-left transition-colors ${focusRing} ${
        selected ? 'border-[#1677FF] shadow-md shadow-blue-500/10' : 'border-slate-200 hover:border-slate-300'
      } ${!camera.online ? 'opacity-80' : ''}`}
    >
      <FeedThumb camera={camera} useScene={useScene} className="w-24 shrink-0 self-start" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{camera.name}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {formatDistance(distanceKm)}
          </span>
          {camera.online && reading ? <StatusChip level={reading.level} /> : <OfflineChip />}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          {camera.online && reading ? (
            <p className="flex items-center gap-1 font-mono text-base font-bold text-slate-900">
              <Droplet className="h-3.5 w-3.5 text-[#1677FF]" aria-hidden="true" />
              {pct(reading.water_ratio)}
            </p>
          ) : (
            <p className="font-mono text-base font-bold text-slate-400">–</p>
          )}
          {camera.online && history.length > 1 && <Sparkline values={history.slice(-20).map((r) => r.water_ratio)} color={meta?.hex ?? '#0EA5E9'} width={72} height={26} />}
        </div>
        <p className={`mt-0.5 text-xs ${cycle.phase === 'stale' ? 'font-semibold text-amber-700' : 'text-slate-600'}`}>{status}</p>
      </div>
    </button>
  );
}
