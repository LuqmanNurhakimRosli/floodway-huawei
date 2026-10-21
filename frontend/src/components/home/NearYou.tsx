import { Ban, Building2, Camera as CameraIcon, CircleCheck, MapPin, Waves } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useVisionStore } from '../../hooks/vision/useVisionStore';
import { formatKm, percentOf } from '../../lib/format';
import { isSampleCamera } from '../../lib/home';
import { levelRank } from '../../lib/vision/levels';
import { cameraPhotoUrl } from '../../lib/vision/samplePhoto';
import { StatusChip } from '../live/shared/StatusChip';

type Filter = 'all' | 'cameras' | 'underpasses' | 'centres';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'cameras', label: 'River cameras' },
  { id: 'underpasses', label: 'Underpasses' },
  { id: 'centres', label: 'Relief centres' },
];

const tile = 'relative flex w-[232px] shrink-0 snap-start flex-col overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_12px_32px_-22px_rgba(7,20,38,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] md:w-[260px]';

/** "Near you": cameras, underpasses and relief centres as swipeable cards, like a travel app's explore row. */
export function NearYou() {
  const vision = useVisionStore();
  const { shelters } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const live = vision.status === 'ready' && !vision.usingMock;

  const cameras = useMemo(
    () => vision.cameras.filter((c) => c.online && c.reading).sort((a, b) => levelRank(b.reading!.level) - levelRank(a.reading!.level) || b.reading!.water_ratio - a.reading!.water_ratio),
    [vision.cameras],
  );
  const centres = useMemo(() => [...shelters].sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 4), [shelters]);
  const show = (f: Filter) => filter === 'all' || filter === f;

  return (
    <section aria-labelledby="near-title" className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <h2 id="near-title" className="font-heading text-lg/7 font-bold text-slate-900">Near you</h2>
        <Link to="/live" className="-mr-2 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-[#0958D9] hover:underline">View all</Link>
      </div>

      <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:px-0" role="group" aria-label="Show">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] motion-reduce:transition-none ${
              filter === f.id ? 'border-[#0958D9] bg-[#0958D9] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:thin] md:mx-0 md:px-0">
        {show('cameras') &&
          cameras.map((c) => {
            const src = cameraPhotoUrl(c, live);
            const r = c.reading!;
            return (
              <Link key={c.id} to={`/live?camera=${encodeURIComponent(c.id)}`} className={tile} aria-label={`${c.name}, ${r.level}, water at ${Math.round(r.water_ratio * 100)}% of bank height`}>
                <div className="relative h-36 bg-gradient-to-br from-blue-700 to-blue-900">
                  {src ? <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" /> : <CameraIcon className="absolute inset-0 m-auto h-8 w-8 text-white/70" aria-hidden="true" />}
                  <span className="absolute right-2 top-2"><StatusChip level={r.level} /></span>
                  {isSampleCamera(c) && <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs font-semibold text-white">Sample</span>}
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <p className="truncate font-heading text-base/6 font-semibold text-slate-900">{c.name}</p>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><Waves className="h-3.5 w-3.5 text-[#1677FF]" aria-hidden="true" /> River camera</span>
                    <span className="font-bold tabular-nums text-slate-900">{Math.round(r.water_ratio * 100)}% <span className="font-medium text-slate-600">of bank</span></span>
                  </div>
                </div>
              </Link>
            );
          })}

        {show('underpasses') &&
          vision.barriers.map((b) => {
            const closed = b.state === 'CLOSED';
            const img = `/media/places/underpass-${b.id}.jpg`;
            return (
              <Link key={b.id} to="/map" className={tile} aria-label={`${b.name}, ${closed ? 'closed' : 'open'}`}>
                <div className={`relative h-36 overflow-hidden ${closed ? 'bg-gradient-to-br from-red-600 to-red-800' : 'bg-gradient-to-br from-blue-600 to-blue-800'}`}>
                  <img
                    src={img}
                    alt={b.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                  <span className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-extrabold shadow-sm ${closed ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>{closed ? 'CLOSED' : 'OPEN'}</span>
                  <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">Simulated barrier</span>
                </div>
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <p className="line-clamp-1 font-heading text-base/6 font-semibold text-slate-900">{b.name.replace(' (demo)', '')}</p>
                  <p className="line-clamp-2 text-xs text-slate-600">{closed ? 'Routes avoid this underpass.' : b.reason}</p>
                </div>
              </Link>
            );
          })}

        {show('centres') &&
          centres.map((s) => {
            const pct = percentOf(s.currentCapacity, s.maxCapacity) ?? 0;
            const img = `/media/places/${s.id}.jpg`;
            return (
              <Link key={s.id} to={`/navigation/${s.id}`} className={tile} aria-label={`${s.name}, ${s.status}, ${formatKm(s.distanceKm)} away`}>
                <div className="relative h-36 overflow-hidden bg-gradient-to-br from-[#1677FF] to-[#071426]">
                  <img
                    src={img}
                    alt={s.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                  <span className={`absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-extrabold shadow-sm ${s.status === 'OPEN' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>{s.status}</span>
                  <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/70 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">Demo centre</span>
                </div>
                <div className="flex flex-1 flex-col gap-1.5 p-3">
                  <p className="truncate font-heading text-base/6 font-semibold text-slate-900">{s.name.replace('Demo relief centre: ', '')}</p>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-[#1677FF]" aria-hidden="true" />{formatKm(s.distanceKm)}</span>
                    <span className="font-bold tabular-nums text-slate-900">{pct}% full</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                    <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-600' : pct > 80 ? 'bg-amber-500' : 'bg-[#1677FF]'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
    </section>
  );
}
