import { camTag } from '../../../lib/vision/camTag';
import { pct } from '../../../lib/vision/format';
import type { Camera } from '../../../types/vision';
import { OfflineChip, StatusChip } from '../shared/StatusChip';
import { card, focusRing } from '../shared/ui';
import { FeedViewer } from './FeedViewer';
import type { OverlayState } from './OverlayToggles';

interface Props {
  cameras: Camera[];
  allCameras: Camera[];
  useScene: boolean;
  overlays: OverlayState;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Several cameras at once: 2 x 2 on desktop, one column on phones. */
export function CameraGrid({ cameras, allCameras, useScene, overlays, selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cameras.slice(0, 4).map((camera) => (
        <button
          key={camera.id}
          type="button"
          onClick={() => onSelect(camera.id)}
          aria-label={`Open ${camera.name}`}
          className={`${card} p-2 text-left ${focusRing} ${selectedId === camera.id ? 'border-[#1677FF] ring-2 ring-[#1677FF]/40' : 'hover:border-slate-300'}`}
        >
          <FeedViewer camera={camera} tag={camTag(allCameras, camera.id)} useScene={useScene} overlays={overlays} compact />
          <div className="mt-2 space-y-1 px-1">
            <p className="truncate text-sm font-bold text-slate-900">{camera.name}</p>
            <div className="flex items-center gap-2">
              {camera.online && camera.reading ? (
                <>
                  <StatusChip level={camera.reading.level} />
                  <span className="font-mono text-xs font-semibold text-slate-700">{pct(camera.reading.water_ratio)} of bank</span>
                </>
              ) : (
                <OfflineChip />
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
