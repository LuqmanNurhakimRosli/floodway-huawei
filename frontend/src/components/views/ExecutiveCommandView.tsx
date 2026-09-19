import React, { useState } from 'react';
import { 
  ArrowRight, 
  FileText, 
  Clock, 
  Layers,
  Truck,
  Shield,
  Compass
} from 'lucide-react';
import { DisasterScenario } from '../../types';
import { MainAppView } from '../desktop/DashboardSidebar';

interface ExecutiveCommandViewProps {
  scenario: DisasterScenario;
  onNavigateView: (view: MainAppView) => void;
  onOpenSitRepModal: () => void;
}

export const ExecutiveCommandView: React.FC<ExecutiveCommandViewProps> = ({
  scenario,
  onNavigateView,
  onOpenSitRepModal,
}) => {
  const [dispatchFilter, setDispatchFilter] = useState<'all' | 'on_route' | 'waiting' | 'delayed' | 'completed'>('all');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('TRK-01');

  const isKajang = scenario.id === 'kajang_river_surge';

  // Mission Units in Dispatch Queue
  const dispatchQueue = isKajang ? [
    {
      id: 'TRK-01',
      unitName: 'SMART Alpha 4x4 Convoy',
      destination: 'Hospital Kajang via Semenyih Bypass',
      eta: '12 min left',
      distance: '3.8 km',
      status: 'ON_ROUTE',
      progress: 68,
      speed: '42 km/h',
      wading: '0.12m',
      fuel: '84%',
      channel: 'Gov DMR Trunking #01',
      driver: 'Kapt. Farhan (SMART Team Lead)'
    },
    {
      id: 'RIB-02',
      unitName: 'APM Tactical Swift-Water Rib',
      destination: 'Taman Sri Jelok Submersion Pocket',
      eta: '4 min left',
      distance: '1.4 km',
      status: 'ON_ROUTE',
      progress: 88,
      speed: '18 km/h',
      wading: '1.80m (Waterborne)',
      fuel: '92%',
      channel: 'VHF CH-04 Civil Defence',
      driver: 'Lt. Azman (APM Boat Unit)'
    },
    {
      id: 'AMB-04',
      unitName: 'Red Crescent Medical Evac',
      destination: 'Dewan Seri Cempaka Relief Shelter',
      eta: 'Waiting Clear',
      distance: '4.2 km',
      status: 'WAITING',
      progress: 15,
      speed: '0 km/h',
      wading: '0.05m',
      fuel: '95%',
      channel: 'Medical Emergency 999',
      driver: 'Paramedic Siti & Staff'
    },
    {
      id: 'ENG-03',
      unitName: 'MPKj Heavy Machinery Barrier Squad',
      destination: 'Jambatan Reko Floodway Barricade',
      eta: 'On Scene',
      distance: '1.6 km',
      status: 'COMPLETED',
      progress: 100,
      speed: '0 km/h',
      wading: '0.85m',
      fuel: '76%',
      channel: 'Public Works Ch 2',
      driver: 'Eng. Tan (MPKj Engineering)'
    }
  ] : [
    {
      id: 'UME-01',
      unitName: 'Unidad Militar de Emergencias (UME)',
      destination: 'Paiporta North Evacuation Axis',
      eta: '18 min left',
      distance: '8.4 km',
      status: 'ON_ROUTE',
      progress: 55,
      speed: '50 km/h',
      wading: '0.25m',
      fuel: '78%',
      channel: 'Military Radio TETRA',
      driver: 'Cmdt. Navarro (UME Batallón III)'
    },
    {
      id: 'SAMU-02',
      unitName: 'SAMU Critical Care Transport',
      destination: 'Hospital La Fe Trauma Center',
      eta: '7 min left',
      distance: '3.2 km',
      status: 'ON_ROUTE',
      progress: 82,
      speed: '65 km/h',
      wading: '0.08m',
      fuel: '90%',
      channel: 'Generalitat Sanidad',
      driver: 'Dr. Morales & Paramedic'
    },
    {
      id: 'BOM-05',
      unitName: 'Bomberos Valencia Heavy Rescue',
      destination: 'Sedaví Ravine Crossing',
      eta: 'Delayed / Rerouting',
      distance: '5.1 km',
      status: 'DELAYED',
      progress: 32,
      speed: '12 km/h',
      wading: '0.65m',
      fuel: '62%',
      channel: 'Consorcio Provincial',
      driver: 'Sargento Ruiz'
    }
  ];

  const filteredQueue = dispatchFilter === 'all' 
    ? dispatchQueue 
    : dispatchQueue.filter(u => u.status.toLowerCase() === dispatchFilter);

  const activeAsset = dispatchQueue.find(u => u.id === selectedAssetId) || dispatchQueue[0];

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-geo-canvas text-geo-text-primary p-3 sm:p-6 space-y-6 select-none pb-28 md:pb-6">
      
      {/* 1. EOC Master Cockpit Header Bar */}
      <div className="rounded-xl border border-geo-border bg-geo-panel p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-geo-surface-2 text-geo-text-tertiary border border-geo-border uppercase">
                {scenario.country} • Joint Emergency Operations Center (EOC)
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Common Operating Picture
              </span>
            </div>
            <h1 className="text-2xl font-bold text-geo-text-primary tracking-tight mt-1.5 flex items-center gap-2.5">
              <span>{scenario.name}</span>
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-geo-surface-1 border border-geo-border text-geo-text-secondary">
                UTC {new Date().toISOString().substring(11, 19)}
              </span>
            </h1>
            <p className="text-xs text-geo-text-secondary mt-1">
              Satellite Ingestion: <strong className="text-geo-text-primary">{scenario.sensor}</strong> • AI Serving: <strong className="text-geo-accent">{scenario.processingModel}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => onNavigateView('map')}
              className="h-9 px-4 rounded-lg bg-geo-accent hover:bg-geo-accent-hover text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-transform active:scale-98"
            >
              <Layers className="w-4 h-4" />
              Full Tactical Map
            </button>
            <button
              onClick={onOpenSitRepModal}
              className="h-9 px-3.5 rounded-lg bg-geo-surface-1 hover:bg-geo-surface-2 border border-geo-border text-geo-text-primary text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4 text-geo-accent" />
              SITREP Briefing
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards with Real SVG Sparklines (Inspired by uploaded Image 5 Nexus Global) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Inundation Extent */}
        <div className="p-4 rounded-xl border border-geo-border bg-geo-panel shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-geo-text-tertiary uppercase tracking-wider">
              Inundation Extent
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-600 border border-cyan-500/30">
              EO DETECTED
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">{scenario.stats.floodAreaKm2}</span>
            <span className="text-xs font-mono text-geo-text-secondary">km² flooded</span>
          </div>
          <div className="h-7 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 20 Q 30 14, 60 8 T 100 4" fill="none" stroke="#06b6d4" strokeWidth="2.5" />
              <path d="M 0 20 Q 30 14, 60 8 T 100 4 L 100 25 L 0 25 Z" fill="rgba(6,182,212,0.15)" />
            </svg>
          </div>
        </div>

        {/* Metric 2: Damaged Structures */}
        <div className="p-4 rounded-xl border border-geo-border bg-geo-panel shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-geo-text-tertiary uppercase tracking-wider">
              Damaged Structures
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 border border-rose-500/30">
              AT RISK 15%
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">{scenario.stats.damagedStructuresCount}</span>
            <span className="text-xs font-mono text-geo-text-secondary">buildings</span>
          </div>
          <div className="h-7 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 22 Q 25 18, 55 10 T 80 5 T 100 8" fill="none" stroke="#ef4444" strokeWidth="2.5" />
              <path d="M 0 22 Q 25 18, 55 10 T 80 5 T 100 8 L 100 25 L 0 25 Z" fill="rgba(239,68,68,0.15)" />
            </svg>
          </div>
        </div>

        {/* Metric 3: Severed Road Corridors */}
        <div className="p-4 rounded-xl border border-geo-border bg-geo-panel shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-geo-text-tertiary uppercase tracking-wider">
              Severed Roadways
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30">
              IMPASSABLE
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">{scenario.stats.impassableRoadsCount}</span>
            <span className="text-xs font-mono text-geo-text-secondary">links cut</span>
          </div>
          <div className="h-7 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 18 Q 40 14, 70 8 T 100 5" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
              <path d="M 0 18 Q 40 14, 70 8 T 100 5 L 100 25 L 0 25 Z" fill="rgba(245,158,11,0.15)" />
            </svg>
          </div>
        </div>

        {/* Metric 4: Viable Rescue Corridors */}
        <div className="p-4 rounded-xl border border-geo-border bg-geo-panel shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-geo-text-tertiary uppercase tracking-wider">
              Viable Corridors
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              VERIFIED 20%+
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{scenario.candidateRoutes.length}</span>
            <span className="text-xs font-mono text-geo-text-secondary">cleared routes</span>
          </div>
          <div className="h-7 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 22 Q 35 16, 65 8 T 100 4" fill="none" stroke="#10b981" strokeWidth="2.5" />
              <path d="M 0 22 Q 35 16, 65 8 T 100 4 L 100 25 L 0 25 Z" fill="rgba(16,185,129,0.15)" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Main Operational Cockpit: 3-Column Command Grid (Dispatch Queue, Tactical Map Preview, Asset Telemetry HUD) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Dispatch Queue (4 cols) */}
        <div className="lg:col-span-4 p-4 rounded-xl border border-geo-border bg-geo-panel shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-geo-border">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-geo-accent" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-geo-text-primary">
                Dispatch Queue
              </h2>
            </div>
            <span className="text-[10px] font-mono text-geo-text-tertiary">
              {filteredQueue.length} Units Active
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[10px] font-mono overflow-x-auto pb-1">
            {(['all', 'on_route', 'waiting', 'delayed', 'completed'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setDispatchFilter(tab)}
                className={`px-2 py-0.5 rounded capitalize font-medium transition-colors ${
                  dispatchFilter === tab
                    ? 'bg-geo-accent text-white font-bold'
                    : 'bg-geo-surface-1 text-geo-text-secondary hover:text-geo-text-primary'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Unit Cards List */}
          <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
            {filteredQueue.map(unit => {
              const isSelected = selectedAssetId === unit.id;
              let statusBadge = 'bg-cyan-500/15 text-cyan-600 border-cyan-500/30';
              if (unit.status === 'COMPLETED') statusBadge = 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30';
              if (unit.status === 'DELAYED') statusBadge = 'bg-rose-500/15 text-rose-600 border-rose-500/30';
              if (unit.status === 'WAITING') statusBadge = 'bg-amber-500/15 text-amber-600 border-amber-500/30';

              return (
                <div
                  key={unit.id}
                  onClick={() => setSelectedAssetId(unit.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-geo-accent-muted border-geo-border-accent shadow-sm' 
                      : 'bg-geo-surface-1 border-geo-border hover:border-geo-border-strong hover:bg-geo-surface-2'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-geo-accent">{unit.id}</span>
                      <span className="font-semibold text-geo-text-primary truncate max-w-[140px]">{unit.unitName}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${statusBadge}`}>
                      {unit.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-geo-text-secondary mt-1 flex items-center justify-between">
                    <span className="truncate max-w-[170px]">{unit.destination}</span>
                    <span className="font-mono font-semibold text-geo-text-primary shrink-0">{unit.distance}</span>
                  </div>

                  {/* Segmented Progress Bar */}
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-geo-text-tertiary">
                      <span>{unit.eta}</span>
                      <span>{unit.progress}% Transit</span>
                    </div>
                    <div className="h-2 w-full rounded bg-geo-surface-2 overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          unit.status === 'DELAYED' ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                        }`} 
                        style={{ width: `${unit.progress}%` }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Live Tactical HUD & Map Corridor View (5 cols) */}
        <div className="lg:col-span-5 p-4 rounded-xl border border-geo-border bg-slate-950 text-white shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[460px]">
          
          {/* Map Header Overlay */}
          <div className="flex items-center justify-between z-10 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-mono">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="font-bold uppercase tracking-wider text-slate-200">Active Rescue Corridor Navigation</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Live Simulation GPS
            </span>
          </div>

          {/* Tactical 3D-Style Map Graphics Canvas (Matching Image 4 Maestro Cockpit) */}
          <div className="relative flex-1 my-3 rounded-lg overflow-hidden border border-white/10 bg-slate-900 flex items-center justify-center">
            
            {/* Grid Mesh Background */}
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />

            {/* Glowing Street Corridor Line SVG */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 240">
              {/* City block buildings wireframe */}
              <rect x="30" y="40" width="40" height="35" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              <rect x="85" y="30" width="55" height="45" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              <rect x="155" y="45" width="50" height="30" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              
              <rect x="25" y="110" width="50" height="50" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              <rect x="170" y="105" width="60" height="55" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              
              <rect x="35" y="180" width="65" height="40" fill="#1e293b" stroke="#334155" strokeWidth="1" />
              <rect x="130" y="180" width="70" height="40" fill="#1e293b" stroke="#334155" strokeWidth="1" />

              {/* Submerged flood wash zone (Red) */}
              <polygon points="120,60 165,55 170,120 110,125" fill="rgba(239,68,68,0.25)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="140" y="90" fill="#ef4444" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">FLOOD WASH</text>

              {/* Glowing Safe Corridor (Neon Cyan to Emerald) */}
              <path 
                d="M 50 200 L 50 150 L 105 150 L 105 40 L 150 40 L 220 40 L 220 180" 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                filter="drop-shadow(0 0 8px #06b6d4)" 
              />

              {/* Start Staging Marker */}
              <circle cx="50" cy="200" r="5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              <text x="50" y="215" fill="#10b981" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">STAGING BASE</text>

              {/* Vehicle Icon on Route */}
              <circle cx="105" cy="110" r="7" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
              <circle cx="105" cy="110" r="14" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.6">
                <animate attributeName="r" values="7;18" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.8;0" dur="1.5s" repeatCount="indefinite" />
              </circle>

              {/* Destination Hospital Marker */}
              <circle cx="220" cy="180" r="6" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
              <text x="220" y="195" fill="#f43f5e" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">HOSPITAL</text>
            </svg>

            {/* Live Telemetry Floating Card HUD */}
            <div className="absolute bottom-3 left-3 right-3 p-3 rounded-lg bg-slate-950/90 backdrop-blur border border-cyan-500/40 text-xs font-mono space-y-1.5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400">{activeAsset.id} • {activeAsset.driver}</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  EN ROUTE (VIABLE)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 text-[11px] pt-1">
                <div>Next Waypoint: <strong className="text-white">Jalan Semenyih</strong></div>
                <div>Transit Speed: <strong className="text-emerald-400">{activeAsset.speed}</strong></div>
                <div>Water Depth: <strong className="text-cyan-400">{activeAsset.wading}</strong></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-400">Tactical Navigation: NetworkX Least-Cost Graph</span>
            <button 
              onClick={() => onNavigateView('routing')}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 text-xs"
            >
              Route Planner View <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Convoy Asset Schematics & Load Planning (3 cols) */}
        <div className="lg:col-span-3 p-4 rounded-xl border border-geo-border bg-geo-panel shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-geo-border">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-geo-text-primary">
                Asset Telemetry & Load
              </h2>
            </div>
            <span className="font-mono text-xs font-bold text-geo-accent">{activeAsset.id}</span>
          </div>

          {/* Vector Schematic Graphic of the Heavy Amphibious Convoy (Matching Image 4 Truck Blueprint) */}
          <div className="h-28 rounded-lg bg-geo-surface-1 border border-geo-border p-2 flex items-center justify-center relative overflow-hidden">
            <svg className="w-full h-full text-geo-accent opacity-90" viewBox="0 0 160 80">
              {/* Truck Cabin & Chassis Wireframe */}
              <rect x="20" y="35" width="50" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" rx="2" />
              <path d="M 50 35 L 70 45 L 70 63 L 50 63 Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <rect x="70" y="25" width="75" height="38" fill="none" stroke="currentColor" strokeWidth="1.8" rx="2" />
              {/* Snorkel Exhaust */}
              <line x1="26" y1="35" x2="26" y2="18" stroke="#06b6d4" strokeWidth="2.5" />
              <circle cx="26" cy="18" r="2" fill="#06b6d4" />
              {/* Wheels */}
              <circle cx="45" cy="65" r="9" fill="#1e293b" stroke="currentColor" strokeWidth="2" />
              <circle cx="100" cy="65" r="9" fill="#1e293b" stroke="currentColor" strokeWidth="2" />
              <circle cx="125" cy="65" r="9" fill="#1e293b" stroke="currentColor" strokeWidth="2" />
              {/* Wading Waterline */}
              <line x1="10" y1="60" x2="150" y2="60" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
              <text x="145" y="58" fill="#06b6d4" fontSize="7" fontFamily="monospace" textAnchor="end">0.70m MAX</text>
            </svg>
            <span className="absolute top-2 left-2 text-[9px] font-mono text-geo-text-tertiary">
              4x4 AMPHIBIOUS UNIMOG
            </span>
          </div>

          {/* Asset Specs List */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-geo-border">
              <span className="text-geo-text-secondary">Wading Clearance</span>
              <span className="font-mono font-bold text-geo-accent">0.70m Snorkel</span>
            </div>
            <div className="flex justify-between py-1 border-b border-geo-border">
              <span className="text-geo-text-secondary">Battery / Fuel</span>
              <span className="font-mono font-bold text-emerald-600">{activeAsset.fuel}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-geo-border">
              <span className="text-geo-text-secondary">Radio Frequency</span>
              <span className="font-mono text-geo-text-primary">{activeAsset.channel}</span>
            </div>
          </div>

          {/* Load Planning Slots (Matching Image 4 Load Planning) */}
          <div className="space-y-2 pt-1">
            <span className="text-[10px] font-mono uppercase font-bold text-geo-text-tertiary block">
              Relief Payload Manifest
            </span>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-1.5 rounded bg-geo-surface-1 border border-geo-border flex justify-between">
                <span>Trauma Emergency Kits</span>
                <span className="font-mono font-bold text-emerald-600">LOADED</span>
              </div>
              <div className="p-1.5 rounded bg-geo-surface-1 border border-geo-border flex justify-between">
                <span>Inflatable Rafts (x4)</span>
                <span className="font-mono font-bold text-cyan-600">ACTIVE</span>
              </div>
              <div className="p-1.5 rounded bg-geo-surface-1 border border-geo-border flex justify-between">
                <span>Portable Water Pumps</span>
                <span className="font-mono font-bold text-amber-600">ASSIGNED</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. Horizontal Mission Operational Gantt Timeline (Matching Image 4 Bottom Strip) */}
      <div className="p-4 rounded-xl border border-geo-border bg-geo-panel shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-geo-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-geo-accent" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-geo-text-primary">
              Operational Fleet Schedule & Mission Gantt Timeline
            </h2>
          </div>
          <span className="text-[10px] font-mono text-geo-text-tertiary">
            EOC Shift #02 Active
          </span>
        </div>

        {/* Horizontal Timeline Gantt Grid */}
        <div className="space-y-2.5 overflow-x-auto text-xs pt-1">
          {/* Hour markers */}
          <div className="grid grid-cols-8 text-[10px] font-mono text-geo-text-tertiary border-b border-geo-border pb-1">
            <span>08:00</span>
            <span>10:00</span>
            <span>12:00</span>
            <span>14:00 (NOW)</span>
            <span>16:00</span>
            <span>18:00</span>
            <span>20:00</span>
            <span>22:00</span>
          </div>

          {/* Unit 1 Gantt */}
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold w-16 text-[11px] text-geo-accent shrink-0">TRK-01</span>
            <div className="flex-1 h-6 rounded bg-geo-surface-1 relative flex items-center">
              <div className="absolute left-[15%] w-[45%] h-5 rounded bg-cyan-500/30 border border-cyan-500 text-cyan-700 dark:text-cyan-300 text-[10px] font-mono font-bold flex items-center px-2">
                HOSPITAL CONVOY ALPHA
              </div>
              <div className="absolute left-[65%] w-[25%] h-5 rounded bg-emerald-500/25 border border-emerald-500 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold flex items-center px-2">
                RETURN TO BASE
              </div>
            </div>
          </div>

          {/* Unit 2 Gantt */}
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold w-16 text-[11px] text-geo-accent shrink-0">RIB-02</span>
            <div className="flex-1 h-6 rounded bg-geo-surface-1 relative flex items-center">
              <div className="absolute left-[25%] w-[50%] h-5 rounded bg-rose-500/30 border border-rose-500 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-bold flex items-center px-2">
                SWIFT RESCUE RESIDENTIAL POCKET
              </div>
            </div>
          </div>

          {/* Unit 3 Gantt */}
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold w-16 text-[11px] text-geo-accent shrink-0">AMB-04</span>
            <div className="flex-1 h-6 rounded bg-geo-surface-1 relative flex items-center">
              <div className="absolute left-[40%] w-[35%] h-5 rounded bg-amber-500/30 border border-amber-500 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold flex items-center px-2">
                CASUALTY PICKUP STANDBY
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
