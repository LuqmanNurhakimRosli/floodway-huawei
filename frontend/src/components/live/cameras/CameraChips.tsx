import { Plus } from 'lucide-react';
import { formatDistance } from '../../../lib/vision/geo';
import { LEVEL_META } from '../../../lib/vision/levels';
import type { CameraWithDistance } from '../../../hooks/vision/useNearbyCameras';
import { focusRing } from '../shared/ui';

interface Props {
  items: CameraWithDistance[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

/** Mobile: horizontal snap-scrolling camera picker. */
export function CameraChips({ items, selectedId, onSelect, onAdd }: Props) {
  return (
    <div className="-mx-3 flex snap-x snap-mandatory scroll-px-3 gap-2 overflow-x-auto px-3 pb-1 sm:-mx-4 sm:scroll-px-4 sm:px-4" role="listbox" aria-label="Cameras">
      {items.map(({ camera, distanceKm }) => {
        const level = camera.online ? camera.reading?.level : undefined;
        const selected = camera.id === selectedId;
        return (
          <button
            key={camera.id}
            type="button"
            role="option"
            aria-selected={selected}
            onClick={() => onSelect(camera.id)}
            className={`min-h-14 w-44 shrink-0 snap-start rounded-xl border-2 bg-white p-2.5 text-left ${focusRing} ${selected ? 'border-[#1677FF] shadow-md shadow-blue-500/10' : 'border-slate-200'}`}
          >
            <span className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${level ? LEVEL_META[level].dot : 'bg-slate-400'}`} aria-hidden="true" />
              <span className="truncate text-sm font-bold text-slate-900">{camera.name}</span>
            </span>
            <span className="mt-0.5 block text-xs text-slate-600">
              {formatDistance(distanceKm)} · {camera.online ? (level ? LEVEL_META[level].label : 'Waiting') : 'Offline'}
            </span>
          </button>
        );
      })}
      <button type="button" onClick={onAdd} aria-label="Add my camera" className={`flex min-h-14 w-14 shrink-0 snap-start items-center justify-center rounded-xl border-2 border-dashed border-[#1677FF]/50 bg-blue-50/40 text-[#0958D9] ${focusRing}`}>
        <Plus className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
