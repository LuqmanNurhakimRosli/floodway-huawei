import { Building2, ChevronRight, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { formatKm, formatMin, percentOf } from '../../lib/format';
import { card } from '../../styles/tokens';

/** Relief centres as a compact list: distance, time, and how full each one is. Demo list, not an official register. */
export function ReliefList() {
  const { shelters, sheltersReady } = useApp();
  if (!sheltersReady || shelters.length === 0) return null;
  const rows = [...shelters].filter((s) => s.status !== 'CLOSED').sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 3);

  return (
    <section aria-labelledby="relief-title" className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <h2 id="relief-title" className="font-heading text-lg/7 font-bold text-slate-900">Relief centres</h2>
        <Link to="/map" className="-mr-2 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-[#0958D9] hover:underline">View all</Link>
      </div>
      <ul className="mt-2 space-y-2.5">
        {rows.map((s) => {
          const pct = percentOf(s.currentCapacity, s.maxCapacity) ?? 0;
          const full = s.status === 'FULL';
          return (
            <li key={s.id}>
              <Link to={`/navigation/${s.id}`} className={`${card} flex items-center gap-3 p-3 hover:border-[#1677FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]`}>
                <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#1677FF] to-[#071426] text-white">
                  <img
                    src={`/media/places/${s.id}.jpg`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                  />
                  <Building2 className="absolute h-7 w-7 opacity-20" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="truncate font-heading text-[15px]/5 font-semibold text-slate-900">{s.name.replace('Demo relief centre: ', '')}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${full ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>{s.status}</span>
                  </span>
                  <span className="mt-1 flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{formatKm(s.distanceKm)}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" />~{formatMin(s.travelTimeMin)}</span>
                  </span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                      <span className={`block h-full rounded-full ${pct >= 100 ? 'bg-red-600' : pct > 80 ? 'bg-amber-500' : 'bg-[#1677FF]'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                    </span>
                    <span className="shrink-0 text-xs font-bold tabular-nums text-slate-900">{pct}%</span>
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-slate-600">Demo list of relief centres, not an official register.</p>
    </section>
  );
}
