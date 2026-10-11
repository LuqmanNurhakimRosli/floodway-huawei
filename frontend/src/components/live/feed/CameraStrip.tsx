import { camTag } from '../../../lib/vision/camTag';
import { LEVEL_META } from '../../../lib/vision/levels';
import type { Camera } from '../../../types/vision';
import { card, focusRing } from '../shared/ui';
import { FeedThumb } from './FeedThumb';

interface Props {
  cameras: Camera[];
  allCameras: Camera[];
  selectedId: string | null;
  useScene: boolean;
  onSelect: (id: string) => void;
}

/** Thumbnail strip under the main feed for quick switching. */
export function CameraStrip({ cameras, allCameras, selectedId, useScene, onSelect }: Props) {
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1" role="listbox" aria-label="Switch camera">
      {cameras.map((camera) => {
        const selected = camera.id === selectedId;
        const level = camera.online ? camera.reading?.level : undefined;
        return (
          <button
            key={camera.id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onSelect(camera.id)}
            className={`${card} w-44 shrink-0 p-2 text-left ${focusRing} ${selected ? 'border-[#1677FF] ring-2 ring-[#1677FF]/40' : 'hover:border-slate-300'}`}
          >
            <FeedThumb camera={camera} useScene={useScene} />
            <span className="mt-2 flex items-center gap-1.5 px-0.5">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${level ? LEVEL_META[level].dot : 'bg-slate-400'}`} aria-hidden="true" />
              <span className="font-mono text-xs font-bold text-slate-900">{camTag(allCameras, camera.id)}</span>
            </span>
            <span className="block truncate px-0.5 text-xs text-slate-600">{camera.name}</span>
          </button>
        );
      })}
    </div>
  );
}
