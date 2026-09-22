import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Navigation, AlertTriangle, Eye, ShieldAlert } from 'lucide-react';

interface Props {
  depthCm: number;
  setDepthCm: (val: number) => void;
  cameraView: 'overview' | 'ground' | 'top';
  setCameraView: (v: 'overview' | 'ground' | 'top') => void;
  onOpenSos: () => void;
  onNavigate: () => void;
}

export function SimulationCockpit({
  depthCm,
  setDepthCm,
  cameraView,
  setCameraView,
  onOpenSos,
  onNavigate,
}: Props) {
  const [isMinimized, setIsMinimized] = useState(false);

  const phase = depthCm >= 40 ? 'DANGER' : depthCm >= 15 ? 'WARNING' : 'NORMAL';

  if (isMinimized) {
    return (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 shadow-2xl hover:bg-slate-800 transition-all text-xs font-bold"
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              phase === 'DANGER' ? 'bg-red-500 animate-ping' : phase === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
          />
          <span>{depthCm} cm Depth · {phase}</span>
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-blue-400 border border-slate-600 flex items-center gap-1">
            Controls <ChevronUp className="w-3 h-3" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-4 left-3 right-3 md:left-6 md:right-6 z-30">
      <div className="max-w-4xl mx-auto rounded-2xl bg-[#071426]/95 backdrop-blur-xl border border-slate-700/80 p-2.5 md:px-4 md:py-2 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Depth Slider & Status */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                phase === 'DANGER'
                  ? 'bg-red-600 text-white'
                  : phase === 'WARNING'
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {phase}
            </span>
            <span className="font-heading font-extrabold text-sm md:text-base text-white">
              {depthCm} <span className="text-xs font-medium text-slate-400">cm</span>
            </span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min="0"
            max="100"
            value={depthCm}
            onChange={(e) => setDepthCm(Number(e.target.value))}
            className="flex-1 accent-[#1677FF] h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Center: Camera Perspectives */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl shrink-0">
          {(['overview', 'ground', 'top'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCameraView(view)}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-colors ${
                cameraView === view
                  ? 'bg-[#1677FF] text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {view}
            </button>
          ))}
        </div>

        {/* Right Actions: Evac, SOS, and Minimize */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNavigate}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 border border-slate-700"
          >
            <Navigation className="w-3.5 h-3.5 text-[#1677FF]" />
            <span>Route</span>
          </button>

          <button
            onClick={onOpenSos}
            className="px-3.5 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-transform active:scale-95"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>1-Tap SOS</span>
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
            title="Minimize Cockpit"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
