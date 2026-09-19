import React, { useState } from 'react';
import { 
  TrendingUp, 
  Building2, 
  Home, 
  Truck, 
  Download, 
  Layers,
  Zap
} from 'lucide-react';
import { DisasterScenario } from '../../types';

interface GovernmentAnalyticsViewProps {
  scenario: DisasterScenario;
  onReturnToCommandMap?: () => void;
}

export const GovernmentAnalyticsView: React.FC<GovernmentAnalyticsViewProps> = ({
  scenario,
  onReturnToCommandMap,
}) => {
  const [selectedStation, setSelectedStation] = useState<'station1' | 'station2' | 'station3'>('station1');
  const [selectedPeriod, setSelectedPeriod] = useState<'24h' | '48h' | '7d'>('24h');
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const isKajang = scenario.id === 'kajang_river_surge';

  // Scenario-calibrated telemetry datasets
  const stationData = isKajang ? {
    station1: {
      name: "Sungai Langat Station #RB-042 (Kajang Core)",
      baseline: 1.5,
      caution: 2.8,
      danger: 3.8,
      peak: "4.38m (+0.48 m/hr)",
      points: [
        { time: '00:00', depth: 1.8, rainfall: 12, rate: '+0.05' },
        { time: '03:00', depth: 2.2, rainfall: 28, rate: '+0.12' },
        { time: '06:00', depth: 2.7, rainfall: 45, rate: '+0.19' },
        { time: '09:00', depth: 3.3, rainfall: 62, rate: '+0.26' },
        { time: '12:00', depth: 3.9, rainfall: 54, rate: '+0.34' },
        { time: '15:00', depth: 4.3, rainfall: 35, rate: '+0.44' },
        { time: '18:00', depth: 4.38, rainfall: 20, rate: '+0.48' },
        { time: '21:00', depth: 4.22, rainfall: 8, rate: '-0.06' },
        { time: '24:00', depth: 3.95, rainfall: 2, rate: '-0.12' },
      ]
    },
    station2: {
      name: "Sungai Chua Confluence Gauge #SC-018",
      baseline: 1.2,
      caution: 2.4,
      danger: 3.4,
      peak: "3.75m (+0.32 m/hr)",
      points: [
        { time: '00:00', depth: 1.4, rainfall: 10, rate: '+0.04' },
        { time: '03:00', depth: 1.8, rainfall: 22, rate: '+0.09' },
        { time: '06:00', depth: 2.3, rainfall: 38, rate: '+0.15' },
        { time: '09:00', depth: 2.9, rainfall: 51, rate: '+0.22' },
        { time: '12:00', depth: 3.4, rainfall: 46, rate: '+0.29' },
        { time: '15:00', depth: 3.75, rainfall: 28, rate: '+0.32' },
        { time: '18:00', depth: 3.70, rainfall: 15, rate: '-0.02' },
        { time: '21:00', depth: 3.45, rainfall: 6, rate: '-0.08' },
        { time: '24:00', depth: 3.20, rainfall: 1, rate: '-0.10' },
      ]
    },
    station3: {
      name: "Semenyih Dam Tailwater Inflow #SM-09",
      baseline: 2.0,
      caution: 3.5,
      danger: 4.8,
      peak: "5.10m (+0.60 m/hr)",
      points: [
        { time: '00:00', depth: 2.2, rainfall: 15, rate: '+0.06' },
        { time: '03:00', depth: 2.8, rainfall: 35, rate: '+0.18' },
        { time: '06:00', depth: 3.5, rainfall: 65, rate: '+0.30' },
        { time: '09:00', depth: 4.2, rainfall: 80, rate: '+0.42' },
        { time: '12:00', depth: 4.8, rainfall: 60, rate: '+0.52' },
        { time: '15:00', depth: 5.10, rainfall: 30, rate: '+0.60' },
        { time: '18:00', depth: 4.95, rainfall: 18, rate: '-0.05' },
        { time: '21:00', depth: 4.60, rainfall: 7, rate: '-0.15' },
        { time: '24:00', depth: 4.20, rainfall: 2, rate: '-0.20' },
      ]
    }
  } : {
    station1: {
      name: "Rambla del Poyo Hydrological Gauge #R-01",
      baseline: 0.8,
      caution: 2.5,
      danger: 4.2,
      peak: "5.80m (+1.20 m/hr)",
      points: [
        { time: '00:00', depth: 1.0, rainfall: 30, rate: '+0.10' },
        { time: '03:00', depth: 1.6, rainfall: 60, rate: '+0.30' },
        { time: '06:00', depth: 2.8, rainfall: 110, rate: '+0.65' },
        { time: '09:00', depth: 4.4, rainfall: 160, rate: '+0.95' },
        { time: '12:00', depth: 5.8, rainfall: 120, rate: '+1.20' },
        { time: '15:00', depth: 5.6, rainfall: 50, rate: '-0.10' },
        { time: '18:00', depth: 4.8, rainfall: 20, rate: '-0.30' },
        { time: '21:00', depth: 3.9, rainfall: 5, rate: '-0.40' },
        { time: '24:00', depth: 3.1, rainfall: 1, rate: '-0.45' },
      ]
    },
    station2: {
      name: "Turia South Diversion Channel #TS-04",
      baseline: 1.5,
      caution: 3.0,
      danger: 5.0,
      peak: "4.90m (+0.80 m/hr)",
      points: [
        { time: '00:00', depth: 1.6, rainfall: 25, rate: '+0.08' },
        { time: '03:00', depth: 2.1, rainfall: 50, rate: '+0.25' },
        { time: '06:00', depth: 3.2, rainfall: 90, rate: '+0.50' },
        { time: '09:00', depth: 4.3, rainfall: 130, rate: '+0.75' },
        { time: '12:00', depth: 4.9, rainfall: 95, rate: '+0.80' },
        { time: '15:00', depth: 4.7, rainfall: 40, rate: '-0.10' },
        { time: '18:00', depth: 4.1, rainfall: 15, rate: '-0.25' },
        { time: '21:00', depth: 3.5, rainfall: 4, rate: '-0.30' },
        { time: '24:00', depth: 2.8, rainfall: 0, rate: '-0.35' },
      ]
    },
    station3: {
      name: "Paiporta Ravine Bridge Monitor #PB-12",
      baseline: 0.5,
      caution: 2.0,
      danger: 3.8,
      peak: "5.40m (+1.10 m/hr)",
      points: [
        { time: '00:00', depth: 0.7, rainfall: 35, rate: '+0.12' },
        { time: '03:00', depth: 1.5, rainfall: 70, rate: '+0.40' },
        { time: '06:00', depth: 2.9, rainfall: 120, rate: '+0.75' },
        { time: '09:00', depth: 4.6, rainfall: 150, rate: '+1.05' },
        { time: '12:00', depth: 5.4, rainfall: 100, rate: '+1.10' },
        { time: '15:00', depth: 5.1, rainfall: 45, rate: '-0.15' },
        { time: '18:00', depth: 4.3, rainfall: 18, rate: '-0.35' },
        { time: '21:00', depth: 3.4, rainfall: 5, rate: '-0.40' },
        { time: '24:00', depth: 2.5, rainfall: 1, rate: '-0.45' },
      ]
    }
  };

  const activeStation = stationData[selectedStation];

  // Shelters
  const shelters = isKajang ? [
    { name: 'Dewan Seri Cempaka Relief Shelter', current: 410, max: 600, percent: 68, status: 'NORMAL', medical: 'Active (2 Docs)', foodRations: '4 Days Stock' },
    { name: 'Stadium Kajang Relief Complex', current: 520, max: 550, percent: 95, status: 'CRITICAL', medical: 'Heavy Triage', foodRations: '1.5 Days Stock' },
    { name: 'SMK Convent Kajang Auxiliary Base', current: 180, max: 400, percent: 45, status: 'NORMAL', medical: 'First Aid Only', foodRations: '5 Days Stock' },
    { name: 'Dewan Orang Ramai Sungai Chua', current: 290, max: 300, percent: 97, status: 'CRITICAL', medical: 'Overburdened', foodRations: 'Emergency Drops Reqd' },
  ] : [
    { name: 'Hospital La Fe Disaster Triage Hub', current: 840, max: 900, percent: 93, status: 'CRITICAL', medical: 'Full ICU & Trauma', foodRations: '3 Days Stock' },
    { name: 'Paiporta Sports Pavilion (Polideportivo)', current: 420, max: 450, percent: 93, status: 'CRITICAL', medical: 'Urgent Evac Req', foodRations: 'Critically Low' },
    { name: 'Feria Valencia Emergency Shelter', current: 1120, max: 2000, percent: 56, status: 'NORMAL', medical: 'Active Red Cross', foodRations: '6 Days Stock' },
    { name: 'Sedaví Municipal Center', current: 360, max: 380, percent: 95, status: 'CRITICAL', medical: 'Limited Triage', foodRations: '1 Day Stock' },
  ];

  // District comparison data
  const districts = isKajang ? [
    { name: "Bandar Kajang Core", floodKm2: 1.42, damagedBldgs: 64, evacuees: 720, severity: "HIGH" },
    { name: "Taman Sri Jelok", floodKm2: 0.95, damagedBldgs: 48, evacuees: 540, severity: "CRITICAL" },
    { name: "Sungai Chua Sector", floodKm2: 0.72, damagedBldgs: 22, evacuees: 380, severity: "MODERATE" },
    { name: "Hulu Langat Riparian", floodKm2: 0.33, damagedBldgs: 8, evacuees: 200, severity: "LOW" },
  ] : [
    { name: "Paiporta Center", floodKm2: 14.8, damagedBldgs: 680, evacuees: 3400, severity: "CRITICAL" },
    { name: "Sedaví Arterial", floodKm2: 11.2, damagedBldgs: 410, evacuees: 2100, severity: "CRITICAL" },
    { name: "Alfafar Lowland", floodKm2: 8.9, damagedBldgs: 260, evacuees: 1650, severity: "HIGH" },
    { name: "Catarroja Basin", floodKm2: 6.3, damagedBldgs: 100, evacuees: 920, severity: "HIGH" },
  ];

  // SVG Chart Geometry Calculations
  const chartWidth = 720;
  const chartHeight = 220;
  const paddingX = 45;
  const paddingY = 25;
  const maxDepthVal = isKajang ? 5.5 : 6.5;

  const pointsSvg = activeStation.points.map((pt, i) => {
    const x = paddingX + (i / (activeStation.points.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (pt.depth / maxDepthVal) * (chartHeight - paddingY * 2);
    return { x, y, pt };
  });

  // Construct SVG Bezier Path
  let svgPathD = `M ${pointsSvg[0].x} ${pointsSvg[0].y}`;
  for (let i = 0; i < pointsSvg.length - 1; i++) {
    const current = pointsSvg[i];
    const next = pointsSvg[i + 1];
    const controlX = (current.x + next.x) / 2;
    svgPathD += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  const svgAreaD = `${svgPathD} L ${pointsSvg[pointsSvg.length - 1].x} ${chartHeight - paddingY} L ${pointsSvg[0].x} ${chartHeight - paddingY} Z`;

  // Caution & Danger Y coords
  const cautionY = chartHeight - paddingY - (activeStation.caution / maxDepthVal) * (chartHeight - paddingY * 2);
  const dangerY = chartHeight - paddingY - (activeStation.danger / maxDepthVal) * (chartHeight - paddingY * 2);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-geo-canvas text-geo-text-primary p-3 sm:p-6 space-y-6 select-none pb-28 md:pb-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-geo-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-geo-surface-2 text-geo-text-tertiary border border-geo-border uppercase">
              Module 5 • Government Macro Intelligence
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 uppercase flex items-center gap-1">
              <Zap className="w-3 h-3 text-blue-600" />
              Live Telemetry & Inundation Model
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold uppercase">
              15-Min IoT Stream
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-geo-text-primary mt-1.5">
            Disaster Analytics & Relief Logistics Hub
          </h1>
          <p className="text-xs text-geo-text-secondary mt-0.5">
            Comprehensive flood wave velocity hydrographs, damage breakdown, evacuation shelter saturation, and fleet readiness.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {onReturnToCommandMap && (
            <button
              onClick={onReturnToCommandMap}
              className="h-8 px-3 text-xs font-semibold rounded-md bg-geo-surface-1 hover:bg-geo-surface-2 border border-geo-border text-geo-text-primary transition-colors flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              View on Map
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="h-8 px-3 text-xs font-semibold rounded-md bg-geo-accent hover:bg-geo-accent-hover text-white flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Briefing SITREP
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Strip with Visual Sparklines (Inspired by Nexus Global / Maestro Cockpit) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Peak Flood Wave Height */}
        <div className="p-4 rounded-xl border border-geo-border bg-geo-panel shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-geo-text-tertiary uppercase tracking-wider">
              Peak River Surge
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 border border-rose-500/30">
              BREACH +18%
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">{activeStation.peak.split(' ')[0]}</span>
            <span className="text-xs font-mono text-geo-text-secondary">({activeStation.points[activeStation.points.length - 3].rate} m/h)</span>
          </div>
          {/* Mini Sparkline SVG */}
          <div className="h-8 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 20 Q 25 18, 50 10 T 80 4 T 100 8" fill="none" stroke="#ef4444" strokeWidth="2.5" />
              <path d="M 0 20 Q 25 18, 50 10 T 80 4 T 100 8 L 100 25 L 0 25 Z" fill="rgba(239,68,68,0.15)" />
            </svg>
          </div>
        </div>

        {/* Metric 2: Estimated Inundation Volume */}
        <div className="p-4 rounded-xl border border-geo-border bg-geo-panel shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-geo-text-tertiary uppercase tracking-wider">
              Discharge Inundation
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-600 border border-cyan-500/30">
              EO DETECTED
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
              {isKajang ? '12.8M' : '148M'}
            </span>
            <span className="text-xs font-mono text-geo-text-secondary">m³ runoff</span>
          </div>
          <div className="h-8 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 18 Q 30 15, 60 8 T 100 5" fill="none" stroke="#06b6d4" strokeWidth="2.5" />
              <path d="M 0 18 Q 30 15, 60 8 T 100 5 L 100 25 L 0 25 Z" fill="rgba(6,182,212,0.15)" />
            </svg>
          </div>
        </div>

        {/* Metric 3: Evacuated Citizens Safe */}
        <div className="p-4 rounded-xl border border-geo-border bg-geo-panel shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-geo-text-tertiary uppercase tracking-wider">
              Evacuated Safe
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              98.4% SAFE
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {isKajang ? '1,400' : '8,070'}
            </span>
            <span className="text-xs font-mono text-geo-text-secondary">in shelters</span>
          </div>
          <div className="h-8 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 22 Q 40 18, 70 8 T 100 4" fill="none" stroke="#10b981" strokeWidth="2.5" />
              <path d="M 0 22 Q 40 18, 70 8 T 100 4 L 100 25 L 0 25 Z" fill="rgba(16,185,129,0.15)" />
            </svg>
          </div>
        </div>

        {/* Metric 4: Projected Economic Damage */}
        <div className="p-4 rounded-xl border border-geo-border bg-geo-panel shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-geo-text-tertiary uppercase tracking-wider">
              Projected Asset Loss
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/30">
              INSURANCE CAT
            </span>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {isKajang ? 'RM 124M' : '€ 850M'}
            </span>
            <span className="text-xs font-mono text-geo-text-secondary">impact</span>
          </div>
          <div className="h-8 w-full">
            <svg className="w-full h-full" viewBox="0 0 100 25" preserveAspectRatio="none">
              <path d="M 0 20 Q 30 16, 60 10 T 100 6" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
              <path d="M 0 20 Q 30 16, 60 10 T 100 6 L 100 25 L 0 25 Z" fill="rgba(245,158,11,0.15)" />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Big Visual Hydrograph Chart (Full Width & Interactive) */}
      <div className="p-5 rounded-xl border border-geo-border bg-geo-panel shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-geo-border">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-500" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-geo-text-primary">
                River Catchment Flood Wave Propagation & Hydrograph (dh/dt)
              </h2>
            </div>
            <p className="text-xs text-geo-text-secondary mt-0.5">
              Continuous 15-minute telemetry curve fused with upstream radar precipitation hyetograph.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Station Selector */}
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value as any)}
              className="h-8 px-2.5 rounded bg-geo-surface-1 border border-geo-border text-geo-text-primary text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-geo-accent"
            >
              <option value="station1">{isKajang ? 'Sungai Langat #RB-042 (Kajang Core)' : 'Rambla del Poyo Gauge #R-01'}</option>
              <option value="station2">{isKajang ? 'Sungai Chua Confluence #SC-018' : 'Turia South Diversion #TS-04'}</option>
              <option value="station3">{isKajang ? 'Semenyih Dam Inflow #SM-09' : 'Paiporta Ravine Bridge #PB-12'}</option>
            </select>

            {/* Time Window */}
            <div className="flex rounded-md border border-geo-border p-0.5 bg-geo-surface-1">
              {(['24h', '48h', '7d'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded transition-colors ${
                    selectedPeriod === p ? 'bg-geo-accent text-white' : 'text-geo-text-secondary hover:text-geo-text-primary'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Large Visual Hydrograph SVG Canvas */}
        <div className="relative w-full h-72 sm:h-80 bg-geo-surface-1 rounded-xl border border-geo-border p-2 overflow-hidden flex flex-col justify-between">
          
          {/* Top Rainfall Hyetograph Bar Legend */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-geo-text-tertiary z-20">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                <span>River Water Depth (m)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-400/40" />
                <span>Hourly Precipitation (mm)</span>
              </span>
            </div>
            <div className="font-bold text-geo-text-primary">
              Station: <span className="text-cyan-500">{activeStation.name}</span>
            </div>
          </div>

          <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="hydroFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#06b6d4" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
            {[1, 2, 3, 4, 5].map((level) => {
              const y = chartHeight - paddingY - (level / maxDepthVal) * (chartHeight - paddingY * 2);
              return (
                <g key={level}>
                  <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 3" />
                  <text x={paddingX - 8} y={y + 4} fill="currentColor" opacity="0.4" fontSize="9" fontFamily="monospace" textAnchor="end">
                    {level}m
                  </text>
                </g>
              );
            })}

            {/* Caution Threshold Line */}
            <line x1={paddingX} y1={cautionY} x2={chartWidth - paddingX} y2={cautionY} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.7" />
            <text x={chartWidth - paddingX - 4} y={cautionY - 5} fill="#f59e0b" fontSize="9" fontFamily="monospace" textAnchor="end" fontWeight="bold">
              Caution Level ({activeStation.caution}m)
            </text>

            {/* Danger / Overtopping Threshold Line */}
            <line x1={paddingX} y1={dangerY} x2={chartWidth - paddingX} y2={dangerY} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.85" />
            <text x={chartWidth - paddingX - 4} y={dangerY - 5} fill="#ef4444" fontSize="9" fontFamily="monospace" textAnchor="end" fontWeight="bold">
              Danger Breach Level ({activeStation.danger}m)
            </text>

            {/* Rainfall Bars (Hyetograph on top) */}
            {pointsSvg.map((p, i) => {
              const barH = (p.pt.rainfall / 160) * 55;
              return (
                <rect
                  key={`rain-${i}`}
                  x={p.x - 7}
                  y={paddingY + 8}
                  width="14"
                  height={barH}
                  fill="#38bdf8"
                  opacity="0.25"
                  rx="1"
                />
              );
            })}

            {/* Area Fill */}
            <path d={svgAreaD} fill="url(#hydroFill)" />

            {/* Bezier Stroke Curve */}
            <path d={svgPathD} fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />

            {/* Data Points with Hover Interaction */}
            {pointsSvg.map((p, i) => (
              <g key={`pt-${i}`} className="cursor-pointer" onMouseEnter={() => setHoveredPointIndex(i)} onMouseLeave={() => setHoveredPointIndex(null)}>
                <circle cx={p.x} cy={p.y} r={hoveredPointIndex === i ? "6" : "4"} fill="#0b0f19" stroke={p.pt.depth >= activeStation.danger ? "#ef4444" : p.pt.depth >= activeStation.caution ? "#f59e0b" : "#06b6d4"} strokeWidth="2.5" />
                {/* Time labels along X axis */}
                <text x={p.x} y={chartHeight - paddingY + 14} fill="currentColor" opacity="0.5" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  {p.pt.time}
                </text>
              </g>
            ))}
          </svg>

          {/* Interactive Hover Tooltip */}
          {hoveredPointIndex !== null && (
            <div 
              className="absolute pointer-events-none p-2.5 rounded-lg bg-slate-900 text-white shadow-tactical border border-cyan-500/40 text-xs font-mono z-30"
              style={{
                left: `${(pointsSvg[hoveredPointIndex].x / chartWidth) * 90}%`,
                top: `${pointsSvg[hoveredPointIndex].y - 30}px`
              }}
            >
              <div className="font-bold text-cyan-400">{pointsSvg[hoveredPointIndex].pt.time} UTC</div>
              <div>Water Depth: <strong>{pointsSvg[hoveredPointIndex].pt.depth}m</strong></div>
              <div>Precipitation: <strong>{pointsSvg[hoveredPointIndex].pt.rainfall} mm/h</strong></div>
              <div>Rate: <span className={pointsSvg[hoveredPointIndex].pt.rate.startsWith('+') ? 'text-rose-400' : 'text-emerald-400'}>{pointsSvg[hoveredPointIndex].pt.rate} m/hr</span></div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Structural Damage Donut & Comparative District Bar Graph (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Structural Damage Donut Breakdown (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-geo-border bg-geo-panel shadow-sm space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-geo-border">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-geo-text-primary">
                Structural Damage Severity Donut
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold text-rose-600">
              {scenario.stats.damagedStructuresCount} Impacted
            </span>
          </div>

          {/* Large Visual Donut / Pie Representation */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative w-40 h-40 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path className="text-geo-surface-2" strokeWidth="4.5" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                {/* Segment 1: Destroyed (Rose) */}
                <path strokeWidth="4.5" strokeDasharray="18, 100" stroke="#ef4444" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                {/* Segment 2: Major Damage (Amber) */}
                <path strokeWidth="4.5" strokeDasharray="34, 100" strokeDashoffset="-18" stroke="#f59e0b" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                {/* Segment 3: Minor Inundation (Cyan) */}
                <path strokeWidth="4.5" strokeDasharray="48, 100" strokeDashoffset="-52" stroke="#06b6d4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold font-mono text-geo-text-primary">
                  {scenario.stats.damagedStructuresCount}
                </span>
                <span className="text-[9px] font-mono uppercase text-geo-text-tertiary">Buildings</span>
              </div>
            </div>

            {/* Donut Legend with Metrics */}
            <div className="space-y-2 text-xs w-full">
              <div className="flex items-center justify-between p-2 rounded bg-geo-surface-1 border border-geo-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-semibold text-geo-text-primary">Destroyed / Collapsed</span>
                </div>
                <span className="font-mono font-bold text-rose-600">
                  {isKajang ? '18 (18%)' : '320 (22%)'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-geo-surface-1 border border-geo-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-semibold text-geo-text-primary">Major Structural Strain</span>
                </div>
                <span className="font-mono font-bold text-amber-600">
                  {isKajang ? '34 (34%)' : '410 (28%)'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-geo-surface-1 border border-geo-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span className="font-semibold text-geo-text-primary">Minor Inundation Encroach</span>
                </div>
                <span className="font-mono font-bold text-cyan-600">
                  {isKajang ? '90 (48%)' : '720 (50%)'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-geo-text-tertiary pt-2 border-t border-geo-border">
            Bi-temporal Siamese U-Net building mask overlay evaluated on <strong>Huawei ModelArts Ascend 910</strong>.
          </div>
        </div>

        {/* Right: Comparative District Impact Bar Graph (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-geo-border bg-geo-panel shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-geo-border">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-geo-accent" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-geo-text-primary">
                District Sector Inundation & Population Impact
              </h2>
            </div>
            <span className="text-[10px] font-mono text-geo-text-tertiary">
              Spatial Graph Ranking
            </span>
          </div>

          {/* Bar Chart comparing 4 zones */}
          <div className="space-y-4">
            {districts.map((d, i) => {
              const floodPct = (d.floodKm2 / (isKajang ? 2.0 : 20.0)) * 100;
              return (
                <div key={i} className="p-3 rounded-lg bg-geo-surface-1 border border-geo-border space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-geo-text-primary text-sm">{d.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      d.severity === 'CRITICAL' ? 'bg-rose-500/15 text-rose-600 border-rose-500/30' :
                      d.severity === 'HIGH' ? 'bg-amber-500/15 text-amber-600 border-amber-500/30' :
                      'bg-cyan-500/15 text-cyan-600 border-cyan-500/30'
                    }`}>
                      {d.severity} IMPACT
                    </span>
                  </div>

                  {/* Dual Bar Progress */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] font-mono text-geo-text-secondary">
                      <span>Inundation Area: <strong className="text-cyan-500">{d.floodKm2} km²</strong></span>
                      <span>Damaged: <strong className="text-rose-500">{d.damagedBldgs} bldgs</strong> • Evacuated: <strong className="text-emerald-500">{d.evacuees} pax</strong></span>
                    </div>
                    <div className="h-3 w-full rounded-md bg-geo-surface-2 overflow-hidden flex">
                      <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${Math.min(100, floodPct)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* 5. Shelter Saturation Meters & Fleet Logistics Circular Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Evacuation Shelter Saturation Bars (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-xl border border-geo-border bg-geo-panel shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-geo-border">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-geo-text-primary">
                Evacuation Shelter Capacity & Relief Stockpile Saturation
              </h2>
            </div>
            <span className="text-[10px] font-mono text-geo-text-tertiary">
              4 Designated Safe Havens
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            {shelters.map((sh, idx) => (
              <div key={idx} className="p-3.5 rounded-lg bg-geo-surface-1 border border-geo-border space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-geo-text-primary text-xs">{sh.name}</span>
                    <div className="text-[10px] text-geo-text-secondary mt-0.5">
                      Medical: <strong className="text-geo-text-primary">{sh.medical}</strong> • Supplies: <strong className="text-geo-text-primary">{sh.foodRations}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-geo-text-primary text-sm">
                      {sh.current} / {sh.max}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      sh.status === 'CRITICAL'
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    }`}>
                      {sh.percent}% FULL
                    </span>
                  </div>
                </div>

                <div className="h-2.5 w-full rounded-full bg-geo-surface-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      sh.percent >= 90 ? 'bg-rose-500' : sh.percent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${sh.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Response Fleet Readiness Circular Radial Gauges (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-geo-border bg-geo-panel shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-geo-border">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-geo-accent" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-geo-text-primary">
                Tactical Convoy & Equipment Readiness
              </h2>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-600">
              88% MOBILIZED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Gauge 1: Heavy Amphibious 4x4 */}
            <div className="p-3 rounded-lg bg-geo-surface-1 border border-geo-border flex flex-col items-center text-center space-y-1">
              <div className="relative w-14 h-14">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-geo-surface-2" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path strokeWidth="4" strokeDasharray="80, 100" stroke="#06b6d4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs">80%</span>
              </div>
              <span className="font-semibold text-xs text-geo-text-primary">Amphibious 4x4</span>
              <span className="text-[10px] font-mono text-geo-text-tertiary">12/15 Available</span>
            </div>

            {/* Gauge 2: Swift Water Boats */}
            <div className="p-3 rounded-lg bg-geo-surface-1 border border-geo-border flex flex-col items-center text-center space-y-1">
              <div className="relative w-14 h-14">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-geo-surface-2" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path strokeWidth="4" strokeDasharray="88, 100" stroke="#10b981" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs">88%</span>
              </div>
              <span className="font-semibold text-xs text-geo-text-primary">Rescue RIB Boats</span>
              <span className="text-[10px] font-mono text-geo-text-tertiary">8/9 In River Pockets</span>
            </div>

            {/* Gauge 3: Dewatering Pumps */}
            <div className="p-3 rounded-lg bg-geo-surface-1 border border-geo-border flex flex-col items-center text-center space-y-1">
              <div className="relative w-14 h-14">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-geo-surface-2" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path strokeWidth="4" strokeDasharray="65, 100" stroke="#f59e0b" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs">65%</span>
              </div>
              <span className="font-semibold text-xs text-geo-text-primary">Dewatering Pumps</span>
              <span className="text-[10px] font-mono text-geo-text-tertiary">6/9 Deployed</span>
            </div>

            {/* Gauge 4: Medical Convoys */}
            <div className="p-3 rounded-lg bg-geo-surface-1 border border-geo-border flex flex-col items-center text-center space-y-1">
              <div className="relative w-14 h-14">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path className="text-geo-surface-2" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path strokeWidth="4" strokeDasharray="100, 100" stroke="#10b981" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono font-bold text-xs">100%</span>
              </div>
              <span className="font-semibold text-xs text-geo-text-primary">Ambulance Hub</span>
              <span className="text-[10px] font-mono text-geo-text-tertiary">4/4 On Viable Bypass</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-geo-surface-1 border border-geo-border text-xs text-geo-text-secondary leading-relaxed">
            <strong>Forward Command Post:</strong> Stadium Kajang staging area is maintaining direct DMR radio trunking with SMART tactical units.
          </div>
        </div>

      </div>
    </div>
  );
};
