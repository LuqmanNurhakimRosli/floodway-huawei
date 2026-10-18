import { AlertTriangle, Ban, Bike, Car, CheckCircle2, Footprints, MapPin, Navigation, Route } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Shelter } from '../../types';
import type { Barrier } from '../../types/vision';
import type { TravelMode } from '../../lib/mappers';
import { formatCapacity, formatMin, percentOf } from '../../lib/format';
import { etaMin, type ScoredRoute } from '../../lib/routing';

export type ShelterFilter = 'all' | 'open' | 'recommended';


const fmtKm = (m: number) => `${(m / 1000).toFixed(1)} km`;

interface Props {
  /** "Your route" or "Route for Tok Wan". */
  fromLabel: string;
  originLabel: string;
  /** Present when the route is for a family member: switches back to your own. */
  onClearFrom?: () => void;
  floodedCount: number;
  cameraZoneCount: number;
  closedBarriers: Barrier[];
  shelters: Shelter[];
  best: Record<string, ScoredRoute | null>;
  selectedId: string;
  onSelect: (id: string) => void;
  filter: ShelterFilter;
  onFilter: (f: ShelterFilter) => void;
  mode: TravelMode;
  onMode: (m: TravelMode) => void;
  alternatives: ScoredRoute[];
  chosen: number;
  onChoose: (i: number) => void;
  navigating: boolean;
  onStart: () => void;
  routesReady: boolean;
}

const MODES: { id: TravelMode; label: string; Icon: typeof Car }[] = [
  { id: 'car', label: 'Drive', Icon: Car },
  { id: 'bike', label: 'Motorcycle', Icon: Bike },
  { id: 'walk', label: 'Walk', Icon: Footprints },
];

/** Controls and relief-centre list. Rendered in the desktop side panel and inside the phone bottom sheet. */
export function MapPanel(p: Props) {
  const shown = p.shelters.filter((s) => (p.filter === 'open' ? s.status === 'OPEN' : p.filter === 'recommended' ? s.status === 'OPEN' && s.routeStatus === 'CLEAR' : true));
  const selected = p.shelters.find((s) => s.id === p.selectedId);

  return (
    <div className="space-y-4 p-4">
      {/* Whose route this is: you, or a family member picked on the People tab */}
      <section aria-label="Route from" className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-3">
        <MapPin className="h-5 w-5 shrink-0 text-[#0958D9]" aria-hidden="true" />
        <p className="min-w-0 flex-1 text-sm/5 text-slate-800">
          <span className="font-bold">{p.fromLabel}</span>
          <span className="block text-xs text-slate-600">Starts from the nearest demo start point, {p.originLabel}. {p.floodedCount} of 16 demo areas flooded{p.cameraZoneCount > 0 ? ` plus ${p.cameraZoneCount} camera ${p.cameraZoneCount === 1 ? 'zone' : 'zones'}` : ''}.</span>
        </p>
        {p.onClearFrom && (
          <button type="button" onClick={p.onClearFrom} className="min-h-11 shrink-0 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]">
            Use mine
          </button>
        )}
      </section>

      {/* Closed underpass barriers: the one thing on this panel that overrides a route */}
      {p.closedBarriers.length > 0 && (
        <section aria-label="Closed underpass barriers" className="rounded-2xl border border-red-300 bg-red-50 p-3">
          <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-red-800">
            <Ban className="h-3.5 w-3.5" aria-hidden="true" /> {p.closedBarriers.length === 1 ? 'Underpass closed' : `${p.closedBarriers.length} underpasses closed`}
          </p>
          <ul className="mt-1 space-y-1">
            {p.closedBarriers.map((b) => (
              <li key={b.id} className="text-xs text-red-900">
                <span className="font-bold">{b.name}.</span> {b.reason}
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-xs text-red-900">
            Routes through a closed barrier are marked Blocked and listed last. Simulated barriers.{' '}
            <Link to="/control" className="font-bold underline underline-offset-2">Open the control room</Link>
          </p>
        </section>
      )}

      {/* Route alternatives for the selected relief centre */}
      <section aria-labelledby="routes-label">
        <p id="routes-label" className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
          <Route className="h-3.5 w-3.5" aria-hidden="true" /> Routes to {selected ? selected.name.replace('Demo relief centre: ', '') : 'a relief centre'}
        </p>
        {!p.routesReady ? (
          <p className="text-xs text-slate-600">Loading road routes…</p>
        ) : p.alternatives.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">No stored road route for this pair.</p>
        ) : (
          <ul className="space-y-1.5">
            {p.alternatives.map((r, i) => (
              <li key={r.index}>
                <button
                  type="button"
                  aria-pressed={p.chosen === i}
                  onClick={() => p.onChoose(i)}
                  className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 text-left text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] ${
                    p.chosen === i ? 'border-[#1677FF] bg-blue-50 ring-1 ring-[#1677FF]/30' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <span className="font-bold text-slate-900">
                    Route {String.fromCharCode(65 + i)}
                    {i === 0 ? ' · suggested' : ''}
                  </span>
                  <span className="text-slate-700">
                    {fmtKm(r.distanceM)} · ~{formatMin(etaMin(r, p.mode))}
                  </span>
                  {r.blockedBy.length > 0 ? (
                    <span className="flex shrink-0 items-center gap-1 font-bold text-red-700">
                      <Ban className="h-3.5 w-3.5" aria-hidden="true" /> Blocked
                    </span>
                  ) : (
                    <span className={`shrink-0 font-bold ${r.crossings === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {r.crossings === 0 ? 'Avoids flood' : `Crosses ${r.crossings}`}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
        {p.alternatives.length > 0 && p.alternatives[0].blockedBy.length > 0 && (
          <p role="alert" className="mt-1.5 rounded-xl border border-red-300 bg-red-50 p-2 text-xs font-semibold text-red-900">
            Every stored route to this centre passes a closed underpass barrier. Choose another relief centre.
          </p>
        )}
        {p.alternatives.length > 0 && p.alternatives[0].blockedBy.length === 0 && p.alternatives[0].crossings > 0 && (
          <p className="mt-1.5 rounded-xl border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-900">
            Every stored route crosses flooded areas in this scenario. Route A crosses the fewest.
          </p>
        )}
        <p className="mt-1.5 text-xs text-slate-600">Roads from OpenStreetMap. Time has no live traffic{p.mode !== 'car' ? ' and uses a typical speed for this mode' : ''}.</p>
        <div role="group" aria-label="Travel mode" className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={p.mode === id}
              onClick={() => p.onMode(id)}
              className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] ${
                p.mode === id ? 'bg-[#1677FF] text-white' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      </section>

      {/* Relief centres */}
      <section aria-labelledby="centres-label">
        <div className="mb-1.5 flex items-center justify-between">
          <h2 id="centres-label" className="font-heading text-sm font-extrabold text-slate-900">
            Relief centres <span className="font-medium text-slate-600">(demo list, {shown.length} shown)</span>
          </h2>
        </div>
        <div role="group" aria-label="Filter relief centres" className="mb-2 grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1">
          {(['all', 'open', 'recommended'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={p.filter === f}
              onClick={() => p.onFilter(f)}
              className={`min-h-9 rounded-lg text-xs font-bold capitalize focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] ${
                p.filter === f ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {f === 'open' ? 'Open only' : f}
            </button>
          ))}
        </div>
        <ul className="space-y-2">
          {shown.map((s) => {
            const sel = s.id === p.selectedId;
            const b = p.best[s.id];
            const pct = percentOf(s.currentCapacity, s.maxCapacity);
            const unavailable = s.status === 'FULL' || s.status === 'CLOSED';
            return (
              <li key={s.id}>
                <div className={`rounded-2xl border p-3 ${sel ? 'border-[#1677FF] bg-blue-50/40 ring-1 ring-[#1677FF]/30' : 'border-slate-200 bg-white'}`}>
                  <button
                    type="button"
                    aria-pressed={sel}
                    onClick={() => p.onSelect(s.id)}
                    className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="block text-xs font-bold uppercase tracking-wide text-slate-600">{s.category}</span>
                        <span className="block font-heading text-sm font-bold text-slate-900">{s.name}</span>
                      </div>
                      <span
                        className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold ${
                          s.status === 'CLOSED' ? 'bg-red-100 text-red-800' : s.status === 'FULL' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {unavailable ? <AlertTriangle className="h-3 w-3" aria-hidden="true" /> : <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
                        {s.status === 'FULL' ? 'FULL' : s.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-700">
                      {b ? (
                        <>
                          <span className="font-bold text-slate-900">{fmtKm(b.distanceM)}</span>
                          <span className="font-semibold text-[#0958D9]">~{formatMin(etaMin(b, p.mode))}</span>
                          <span className={`font-semibold ${b.crossings === 0 && b.blockedBy.length === 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {b.blockedBy.length > 0 ? 'Blocked by a closed barrier' : b.crossings === 0 ? 'Avoids flood' : `Crosses ${b.crossings} flooded`}
                          </span>
                        </>
                      ) : (
                        <span>Road route unavailable</span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="mb-1 flex justify-between text-xs text-slate-600">
                        <span>Occupancy {pct === null ? '–' : `${pct}%`}</span>
                        <span className="font-bold text-slate-800">{formatCapacity(s.currentCapacity, s.maxCapacity)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                        <div className={`h-full rounded-full ${(pct ?? 0) >= 100 ? 'bg-red-600' : (pct ?? 0) > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct ?? 0}%` }} />
                      </div>
                    </div>
                    {unavailable && <p className="mt-2 text-xs font-semibold text-amber-900">Full. Choose another centre.</p>}
                  </button>
                  {sel && !unavailable && (
                    <button
                      type="button"
                      onClick={p.onStart}
                      disabled={p.navigating || !p.alternatives.length || (p.alternatives[p.chosen]?.blockedBy.length ?? 0) > 0}
                      className="mt-3 flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#1677FF] text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-[#0958D9] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                      <Navigation className="h-4 w-4" aria-hidden="true" />{' '}
                      {p.navigating ? 'Navigating…' : (p.alternatives[p.chosen]?.blockedBy.length ?? 0) > 0 ? 'Route blocked: pick another' : 'Start turn-by-turn'}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
