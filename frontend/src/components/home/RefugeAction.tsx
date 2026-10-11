import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileWarning, Map as MapIcon, Navigation, ShieldCheck } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { formatKm, formatMin, textOr } from '../../lib/format';
import { nearestOpenShelter } from '../../lib/home';
import { btnPrimary, btnSecondary, card, cardPad, cardTitle } from '../../styles/tokens';
import { EmptyState } from '../live/shared/EmptyState';
import { Skeleton } from '../live/shared/Skeleton';
import { CapacityRing } from './CapacityRing';

/** The one primary action on the page: go to the nearest open refuge. Secondary actions sit under it, quieter. */
export function RefugeAction() {
  const navigate = useNavigate();
  const { shelters, sheltersReady } = useApp();

  if (!sheltersReady) return <Skeleton className="h-72 w-full" />;
  const shelter = nearestOpenShelter(shelters);
  if (!shelter) {
    return (
      <EmptyState icon={ShieldCheck} title="No shelters loaded" hint="The shelter list could not be loaded. Open the map to see the demo list." action={{ label: 'Open the map', onClick: () => navigate('/map') }} />
    );
  }

  return (
    <section className={`${card} ${cardPad} flex flex-col gap-4`} aria-labelledby="refuge-title">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs/4 font-semibold uppercase tracking-wide text-slate-700">{shelter.status === 'OPEN' ? 'Nearest open refuge' : 'Nearest refuge (not open)'}</p>
          <h2 id="refuge-title" className={`${cardTitle} mt-0.5 text-lg/7`}>{textOr(shelter.name)}</h2>
          <p className="text-sm/5 text-slate-700">{textOr(shelter.category)}</p>
          <p className="text-xs/4 text-slate-700">Demo shelter list, not an official register.</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs/4 font-semibold ${shelter.status === 'OPEN' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-amber-300 bg-amber-50 text-amber-900'}`}>{shelter.status}</span>
      </div>

      <p className="text-sm/5 text-slate-800">
        <span className="font-semibold tabular-nums">{formatKm(shelter.distanceKm)}</span> away · about{' '}
        <span className="font-semibold tabular-nums">{formatMin(shelter.travelTimeMin)}</span> by car{' '}
        <span className="text-slate-700">(estimate, approximate route, not road-aware)</span>
      </p>

      <CapacityRing current={shelter.currentCapacity} max={shelter.maxCapacity} />

      <div className="mt-auto space-y-2">
        <button type="button" onClick={() => navigate(`/navigation/${shelter.id}`)} className={`${btnPrimary} min-h-12 w-full text-base`}>
          <Navigation className="h-5 w-5" aria-hidden="true" /> Go to nearest refuge
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => navigate('/map')} className={btnSecondary}><MapIcon className="h-4 w-4" aria-hidden="true" /> View map</button>
          <button type="button" onClick={() => navigate('/reports')} className={btnSecondary}><FileWarning className="h-4 w-4" aria-hidden="true" /> Report flood</button>
        </div>
      </div>
    </section>
  );
}
