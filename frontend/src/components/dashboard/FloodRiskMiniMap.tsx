import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Navigation, Shield, AlertTriangle, Layers, Maximize2 } from 'lucide-react';

export function FloodRiskMiniMap() {
  const navigate = useNavigate();
  const [mapMode, setMapMode] = useState<'radar' | 'satellite'>('radar');

  return (
    <div className="rounded-2xl bg-[#071322] border border-slate-800 text-white overflow-hidden shadow-sm flex flex-col h-full min-h-[340px]">
      {/* Mini-map Top Header */}
      <div className="px-4 py-3 bg-[#0B1E38]/90 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-[#1677FF]" />
          <span className="font-heading font-bold text-sm text-slate-200">Geospatial Flood Risk Radar</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMapMode(mapMode === 'radar' ? 'satellite' : 'radar')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 flex items-center gap-1"
          >
            <Layers className="w-3 h-3" />
            <span>{mapMode === 'radar' ? 'Satellite' : 'Radar'}</span>
          </button>
          <button
            onClick={() => navigate('/map')}
            className="px-2.5 py-1 rounded bg-[#1677FF] hover:bg-[#0958D9] text-[11px] font-bold text-white flex items-center gap-1 shadow-xs"
          >
            <span>Open Full Map</span>
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Geospatial Interactive Canvas (SVG Radar simulation) */}
      <div className="relative flex-1 bg-[#050E1A] overflow-hidden p-4">
        {/* River Channel SVG Line */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="floodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#1E293B" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#1E293B" strokeWidth="1" strokeDasharray="3,3" />
          <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#1E293B" strokeWidth="1" strokeDasharray="3,3" />

          {/* River Basin Polygon */}
          <path
            d="M 20 280 Q 120 180 240 190 T 450 110 T 700 80"
            fill="none"
            stroke="#1D4ED8"
            strokeWidth="14"
            strokeOpacity="0.4"
          />

          {/* Flood Risk Inundation Polygon */}
          <polygon
            points="60,240 180,160 260,190 320,130 140,260"
            fill="url(#floodGrad)"
            stroke="#DC2626"
            strokeWidth="1.5"
            className="animate-pulse"
          />

          {/* Safe Route Polyline to Shelter */}
          <path
            d="M 120 220 L 160 140 L 290 90 L 360 70"
            fill="none"
            stroke="#10B981"
            strokeWidth="4"
            strokeDasharray="6,4"
          />
        </svg>

        {/* User Location Marker */}
        <div className="absolute left-[110px] top-[210px] flex flex-col items-center pointer-events-none">
          <div className="w-5 h-5 rounded-full bg-[#1677FF] border-2 border-white flex items-center justify-center shadow-lg shadow-blue-500/50 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="text-[10px] font-bold text-blue-300 bg-slate-900/90 px-1.5 py-0.5 rounded mt-1 border border-blue-500/40">
            You Are Here
          </span>
        </div>

        {/* Blocked Road Marker */}
        <div className="absolute left-[200px] top-[140px] flex items-center gap-1 bg-red-950/90 border border-red-500/70 px-2 py-0.5 rounded shadow-lg">
          <AlertTriangle className="w-3 h-3 text-red-400" />
          <span className="text-[10px] font-bold text-red-300">Jalan Raja Muda Blocked</span>
        </div>

        {/* Safe Shelter Destination Pin */}
        <div className="absolute left-[340px] top-[50px] flex flex-col items-center">
          <div className="w-7 h-7 rounded-xl bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] font-bold text-emerald-300 bg-slate-900/90 px-1.5 py-0.5 rounded mt-1 border border-emerald-500/40 whitespace-nowrap">
            SK Seksyen 24 (1.2 km)
          </span>
        </div>

        {/* Floating Status Overlay Pill */}
        <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium">3 Roads Blocked · 2 Safe Corridors Open</span>
          </div>
          <button
            onClick={() => navigate('/map')}
            className="text-[#60A5FA] hover:text-white font-bold text-xs flex items-center gap-1"
          >
            <span>Details</span>
            <Navigation className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
