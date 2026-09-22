import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Navigation, Users, CheckCircle2, Phone } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function NearestShelterCard() {
  const navigate = useNavigate();
  const { shelters } = useApp();
  const primaryShelter = shelters[0] || {
    id: 'shelter-01',
    name: 'SK Seksyen 24 Shah Alam',
    category: 'Relief Center / School',
    status: 'OPEN',
    currentCapacity: 146,
    maxCapacity: 200,
    distanceKm: 1.2,
    travelTimeMin: 7,
    routeStatus: 'CLEAR'
  };

  const capacityPct = Math.round((primaryShelter.currentCapacity / primaryShelter.maxCapacity) * 100);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Nearest Safe Refuge</span>
              <h3 className="font-heading font-bold text-base md:text-lg text-slate-900 leading-tight">
                {primaryShelter.name}
              </h3>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase tracking-wide">
            {primaryShelter.status}
          </span>
        </div>

        {/* Distance and Route Badge */}
        <div className="flex items-center gap-3 my-4 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700">
            {primaryShelter.distanceKm} km · ~{primaryShelter.travelTimeMin} min (by car)
          </div>
          <div className="flex items-center gap-1 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Route Safe</span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Shelter Occupancy
            </span>
            <span className="font-bold text-slate-800">
              {primaryShelter.currentCapacity} / {primaryShelter.maxCapacity} ({capacityPct}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                capacityPct > 85 ? 'bg-red-500' : capacityPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-5 mt-4 border-t border-slate-100 flex items-center gap-2">
        <button
          onClick={() => navigate(`/navigation/${primaryShelter.id}`)}
          className="flex-1 py-2.5 px-4 rounded-xl bg-[#1677FF] hover:bg-[#0958D9] text-white text-xs md:text-sm font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] shadow-xs"
        >
          <Navigation className="w-4 h-4" />
          <span>Start Navigation</span>
        </button>
        <button
          onClick={() => navigate('/map')}
          className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
        >
          All Shelters
        </button>
      </div>
    </div>
  );
}
