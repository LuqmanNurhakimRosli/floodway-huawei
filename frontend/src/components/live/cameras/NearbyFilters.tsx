import { ChevronDown, MapPin, Search } from 'lucide-react';
import type { CameraTab } from '../../../hooks/vision/useNearbyCameras';
import type { Place } from '../../../lib/vision/geo';
import { focusRing } from '../shared/ui';

interface Props {
  places: Place[];
  placeId: string;
  onPlace: (id: string) => void;
  radiusKm: number;
  onRadius: (km: number) => void;
  tab: CameraTab;
  onTab: (tab: CameraTab) => void;
  query: string;
  onQuery: (q: string) => void;
}

const TABS: { id: CameraTab; label: string }[] = [
  { id: 'nearby', label: 'Nearby' },
  { id: 'city', label: 'City' },
  { id: 'mine', label: 'My cameras' },
];
const RADII = [1, 3, 5];

export function NearbyFilters({ places, placeId, onPlace, radiusKm, onRadius, tab, onTab, query, onQuery }: Props) {
  return (
    <div className="space-y-3">
      <label className="relative block">
        <span className="sr-only">Your location</span>
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1677FF]" aria-hidden="true" />
        <select value={placeId} onChange={(e) => onPlace(e.target.value)} className={`min-h-11 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-sm font-semibold text-slate-900 ${focusRing}`}>
          {places.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      </label>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-700">Radius</span>
        <div className="grid flex-1 grid-cols-3 rounded-full border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label="Search radius">
          {RADII.map((km) => (
            <button key={km} type="button" aria-pressed={radiusKm === km} onClick={() => onRadius(km)} className={`min-h-9 rounded-full text-sm font-bold ${focusRing} ${radiusKm === km ? 'bg-[#0958D9] text-white' : 'text-slate-700 hover:text-slate-900'}`}>
              {km} km
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 border-b border-slate-200" role="tablist" aria-label="Camera source">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => onTab(t.id)} className={`-mb-px min-h-11 border-b-2 text-sm font-bold ${focusRing} ${tab === t.id ? 'border-[#1677FF] text-[#0958D9]' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <label className="relative block">
        <span className="sr-only">Search cameras</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search cameras…" className={`min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-500 ${focusRing}`} />
      </label>
    </div>
  );
}
