import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Navigation, Users, CheckCircle2, AlertTriangle, Phone, ExternalLink } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { InPageActionDock } from './InPageActionDock';

export function ShelterMapView() {
  const navigate = useNavigate();
  const { shelters } = useApp();
  const [selectedShelterId, setSelectedShelterId] = useState<string>(shelters[0]?.id || 'shelter-01');
  const [filter, setFilter] = useState<'all' | 'open' | 'recommended'>('all');

  const selectedShelter = shelters.find((s) => s.id === selectedShelterId) || shelters[0];

  const filteredShelters = shelters.filter((s) => {
    if (filter === 'open') return s.status === 'OPEN';
    if (filter === 'recommended') return s.routeStatus === 'CLEAR';
    return true;
  });

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden bg-slate-100">
      {/* Floating In-Page Action Switcher Dock at Top-Right */}
      <InPageActionDock />

      {/* Map Radar Canvas (Left/Center) */}
      <div className="relative flex-1 bg-[#091629] overflow-hidden flex items-center justify-center p-4">
        {/* Synthetic Interactive Geospatial Canvas */}
        <div className="absolute inset-0 bg-[#071322]">
          {/* Street & River SVG Overlay */}
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E293B" strokeWidth="0.8" />
              </pattern>
              <linearGradient id="floodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#DC2626" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0.15" />
              </linearGradient>
            </defs>

            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* River Klang Vector */}
            <path
              d="M 50 450 Q 250 300 450 320 T 750 210 T 1100 180"
              fill="none"
              stroke="#1E40AF"
              strokeWidth="24"
              strokeOpacity="0.5"
            />

            {/* Submerged Hazard Polygons */}
            <polygon
              points="120,400 320,280 440,320 520,240 280,420"
              fill="url(#floodGrad)"
              stroke="#DC2626"
              strokeWidth="2"
            />

            {/* Safe Route Vector to Selected Shelter */}
            <path
              d="M 220 380 L 290 260 L 510 190 L 640 140"
              fill="none"
              stroke="#10B981"
              strokeWidth="5"
              strokeDasharray="8,6"
            />
          </svg>

          {/* User Live Location Pin */}
          <div className="absolute left-[200px] top-[360px] flex flex-col items-center">
            <div className="w-6 h-6 rounded-full bg-[#1677FF] border-2 border-white flex items-center justify-center shadow-xl shadow-blue-500/50 animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
            <span className="text-[10px] font-bold text-white bg-slate-900/90 px-2 py-0.5 rounded-md mt-1 border border-blue-500">
              Your Residence
            </span>
          </div>

          {/* Shelter Pins */}
          {shelters.map((s, idx) => {
            const isSelected = s.id === selectedShelter?.id;
            const positions = [
              { left: '620px', top: '120px' },
              { left: '780px', top: '240px' },
              { left: '380px', top: '220px' },
              { left: '490px', top: '90px' }
            ];
            const pos = positions[idx % positions.length];

            return (
              <button
                key={s.id}
                onClick={() => setSelectedShelterId(s.id)}
                className={`absolute flex flex-col items-center transition-transform hover:scale-110 ${
                  isSelected ? 'scale-110 z-30' : 'z-20'
                }`}
                style={{ left: pos.left, top: pos.top }}
              >
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg border-2 ${
                    isSelected
                      ? 'bg-[#1677FF] border-white text-white shadow-blue-500/50'
                      : 'bg-white border-emerald-500 text-emerald-600'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-200 bg-slate-900/90 px-2 py-0.5 rounded mt-1 border border-slate-700 whitespace-nowrap">
                  {s.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Legend */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-[11px] text-slate-300 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Safe Route</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Hazard Flooded Zone</span>
          </div>
        </div>
      </div>

      {/* Shelter Directory Drawer (Right Side on Desktop / Bottom on Mobile) */}
      <div className="w-full md:w-[380px] lg:w-[420px] bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col z-20 shadow-xl overflow-hidden">
        {/* Filter Header */}
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-heading font-extrabold text-lg text-slate-900 mb-2">
            Designated Relief Shelters
          </h2>
          <div className="flex items-center gap-1.5">
            {(['all', 'open', 'recommended'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors ${
                  filter === mode
                    ? 'bg-[#1677FF] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Shelter List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredShelters.map((s) => {
            const isSelected = s.id === selectedShelter?.id;
            const capPct = Math.round((s.currentCapacity / s.maxCapacity) * 100);

            return (
              <div
                key={s.id}
                onClick={() => setSelectedShelterId(s.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#1677FF] bg-blue-50/40 shadow-sm ring-1 ring-[#1677FF]/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase">{s.category}</span>
                    <h3 className="font-heading font-bold text-sm text-slate-900">{s.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    {s.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 my-2 text-xs text-slate-600">
                  <span className="font-bold text-slate-800">{s.distanceKm} km away</span>
                  <span>·</span>
                  <span>~{s.travelTimeMin} min</span>
                  <span>·</span>
                  <span className="text-emerald-600 font-semibold">{s.routeStatus}</span>
                </div>

                {/* Capacity */}
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Capacity ({capPct}%)</span>
                    <span>{s.currentCapacity}/{s.maxCapacity}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        capPct > 85 ? 'bg-red-500' : capPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${capPct}%` }}
                    />
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/navigation/${s.id}`);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#1677FF] hover:bg-[#0958D9] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Navigate Now</span>
                    </button>
                    <a
                      href={`tel:${s.contact}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                      title="Call Shelter Warden"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
