import { useId, useRef, useState } from 'react';
import { Clock, RotateCw, WifiOff } from 'lucide-react';
import { useCaptureCycle } from '../../../hooks/vision/useCaptureCycle';
import { useElementHeight } from '../../../hooks/vision/useElementSize';
import { sourceLabel } from '../../../lib/vision/describe';
import { pct, timeAgo } from '../../../lib/vision/format';
import { spreadLabels } from '../../../lib/vision/labels';
import { frameUrl } from '../../../services/vision/visionApi';
import type { Camera } from '../../../types/vision';
import { interactive, num } from '../shared/ui';
import type { OverlayState } from './OverlayToggles';
import { RiverScene } from './RiverScene';

interface Props {
  camera: Camera;
  tag: string; // CAM-001
  useScene: boolean;
  overlays: OverlayState;
  compact?: boolean;
  onRetry?: () => void;
}

const LINES = {
  danger: { color: '#EF4444', label: 'Danger', tag: 'bg-red-600 text-white' },
  warning: { color: '#F59E0B', label: 'Warning', tag: 'bg-amber-400 text-slate-950' },
  normal: { color: '#10B981', label: 'Normal', tag: 'bg-emerald-700 text-white' },
} as const;
type LineKey = keyof typeof LINES;
const LINE_KEYS: LineKey[] = ['danger', 'warning', 'normal']; // top to bottom
// Tags sit on arbitrary frames (bright sky, dark water): give them an outline and a soft shadow.
const onFrame = 'ring-1 ring-black/25 shadow-[0_1px_3px_rgba(0,0,0,0.45)]';
const TAG_PX = 26;

function formatStamp(iso: string | undefined): string {
  if (!iso) return '----/--/-- --:--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '----/--/-- --:--:--';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function FeedViewer({ camera, tag, useScene, overlays, compact = false, onRetry }: Props) {
  const clipId = useId();
  const box = useRef<HTMLDivElement>(null);
  const height = useElementHeight(box);
  const cycle = useCaptureCycle(camera);
  const [failedAt, setFailedAt] = useState<string | null>(null);
  const reading = camera.reading;
  const cal = camera.calibration;
  const kind = camera.source_type === 'synthetic' ? 'SAMPLE' : camera.is_playback ? 'PLAYBACK' : 'LIVE';
  const stale = camera.online && cycle.phase === 'stale';
  const imgFailed = reading !== null && failedAt === reading.timestamp; // a new reading retries the frame

  const roiPoints = cal.roi.map(([x, y]) => `${x * 100},${y * 100}`).join(' ');
  const xs = cal.roi.map((p) => p[0]);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const bed = Math.max(...cal.roi.map((p) => p[1]));
  const waterY = reading?.waterline_y ?? null;
  const chip = compact ? 'px-2 py-0.5 text-xs/4' : 'px-2.5 py-1 text-xs/4';
  const tagTops = spreadLabels(LINE_KEYS.map((k) => cal.lines[k]), height ? TAG_PX / height : 0.08, 0.04, 0.96);

  return (
    <div
      ref={box}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-800"
      role="img"
      aria-label={`${camera.name}, ${kind.toLowerCase()} feed${reading ? `, water at ${pct(reading.water_ratio)} of bank height` : ''}${stale ? ', feed is stale' : ''}`}
    >
      {!camera.online ? null : useScene ? (
        <RiverScene ratio={reading?.water_ratio ?? 0} />
      ) : !reading ? (
        <div className="flex h-full w-full items-center justify-center bg-slate-700 text-sm/5 text-slate-200">Waiting for the first frame…</div>
      ) : imgFailed ? (
        <div className="flex h-full w-full items-center justify-center bg-slate-700 text-sm/5 text-slate-200">Frame unavailable. Retrying next cycle.</div>
      ) : (
        <img src={frameUrl(camera.id, reading.timestamp)} alt="" className="h-full w-full object-cover" onError={() => setFailedAt(reading.timestamp)} />
      )}

      {camera.online && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <clipPath id={clipId}>
              <polygon points={roiPoints} />
            </clipPath>
          </defs>
          {overlays.mask && waterY !== null && (
            <rect x={xMin * 100} y={waterY * 100} width={(xMax - xMin) * 100} height={Math.max(0, (bed - waterY) * 100)} fill="#38BDF8" opacity={0.3} clipPath={`url(#${clipId})`} />
          )}
          {overlays.roi && <polygon points={roiPoints} fill="none" stroke="#FFFFFF" strokeWidth={1.5} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />}
          {overlays.lines &&
            LINE_KEYS.map((k) => (
              <line key={k} x1={0} x2={100} y1={cal.lines[k] * 100} y2={cal.lines[k] * 100} stroke={LINES[k].color} strokeWidth={2} strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />
            ))}
          {overlays.waterline && waterY !== null && <line x1={xMin * 100} x2={xMax * 100} y1={waterY * 100} y2={waterY * 100} stroke="#7DD3FC" strokeWidth={3} vectorEffect="non-scaling-stroke" />}
        </svg>
      )}

      {camera.online && overlays.lines && !compact &&
        LINE_KEYS.map((k, i) => (
          <span key={k} className={`pointer-events-none absolute right-0 -translate-y-1/2 rounded-l-md px-2 py-0.5 text-xs/4 font-semibold ${LINES[k].tag} ${onFrame}`} style={{ top: `${tagTops[i] * 100}%` }}>
            {LINES[k].label}
          </span>
        ))}

      {camera.online && overlays.waterline && waterY !== null && reading && !compact && (
        <>
          <span className={`pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+6px)] whitespace-nowrap rounded-lg bg-[#0958D9] px-2.5 py-1 text-xs/4 font-semibold text-white ${onFrame}`} style={{ left: `${((xMin + xMax) / 2) * 100}%`, top: `${waterY * 100}%` }}>
            Water at <span className={num}>{pct(reading.water_ratio)}</span> of bank
          </span>
          <span className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#1677FF] bg-white shadow" style={{ left: `${((xMin + xMax) / 2) * 100}%`, top: `${waterY * 100}%` }} aria-hidden="true" />
        </>
      )}

      <span className={`${num} absolute left-2 top-2 rounded-md bg-black/65 font-medium text-white ${chip}`}>{compact ? tag : formatStamp(reading?.timestamp)}</span>
      {!compact && <span className={`${num} absolute right-2 top-2 rounded-md bg-black/65 px-2.5 py-1 text-xs/4 font-medium text-white`}>{tag}</span>}
      <span className={`absolute left-2 ${stale ? 'bottom-10' : 'bottom-2'} inline-flex items-center gap-1 rounded-full font-semibold ${chip} ${onFrame} ${kind === 'LIVE' ? 'bg-red-600 text-white' : 'bg-amber-400 text-slate-950'}`}>
        {kind === 'LIVE' && <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />}
        {kind}
        {!compact && kind !== 'SAMPLE' && <span className="font-medium">· {sourceLabel(camera)}</span>}
      </span>

      {!camera.online && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/90 px-4 text-center">
          <WifiOff className="h-7 w-7 text-slate-300" aria-hidden="true" />
          <p className="font-heading text-base/6 font-bold text-white">Camera offline</p>
          {!compact && <p className="text-sm/5 text-slate-300">{camera.last_frame_at ? `No signal. Last frame ${timeAgo(camera.last_frame_at)}.` : 'No frame received yet. We keep retrying.'}</p>}
          {onRetry && !compact && (
            <button type="button" onClick={onRetry} className={`mt-1 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#0958D9] px-4 text-sm font-semibold text-white hover:bg-[#003EB3] ${interactive}`}>
              <RotateCw className="h-4 w-4" aria-hidden="true" /> Try now
            </button>
          )}
        </div>
      )}
      {stale && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-amber-400 px-3 py-1.5 text-xs/4 font-semibold text-slate-950">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Stale feed. The result may be out of date.
        </div>
      )}
    </div>
  );
}
