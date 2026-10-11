import { useCaptureCycle } from '../../../hooks/vision/useCaptureCycle';
import { timeAgo } from '../../../lib/vision/format';
import type { Camera } from '../../../types/vision';
import { StatusChip } from '../shared/StatusChip';
import { card } from '../shared/ui';
import { CountdownRing } from './CountdownRing';

/** The automatic cycle, made visible: "Next capture in 7s" -> "Analysing…" -> new result. No manual controls. */
export function CaptureStrip({ camera }: { camera: Camera }) {
  const cycle = useCaptureCycle(camera);
  const slowFeed = camera.feed_refresh_s > 0;

  let label = `Next capture in ${cycle.secondsLeft}s`;
  if (cycle.phase === 'offline') label = 'Camera offline';
  else if (cycle.phase === 'stale') label = 'Waiting for a fresh frame';
  else if (cycle.phase === 'analysing') label = 'Analysing…';

  return (
    <div className={`${card} flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3`} aria-live="polite">
      <div className="flex items-center gap-3">
        <CountdownRing cycle={cycle} size={36} />
        <span className="text-sm font-semibold text-slate-900">{label}</span>
      </div>
      <span className="font-mono text-xs text-slate-600">
        {slowFeed ? `Feed updates every ${Math.round(camera.feed_refresh_s / 60)} min · frame ${timeAgo(camera.last_frame_at)}` : `Last analysed ${timeAgo(camera.reading?.timestamp ?? null)}`}
      </span>
      {camera.online && camera.reading && (
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          AI analysis: <StatusChip level={camera.reading.level} />
        </span>
      )}
    </div>
  );
}
