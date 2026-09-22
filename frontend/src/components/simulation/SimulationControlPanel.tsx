import React, { useState } from 'react';
import {
  SlidersHorizontal,
  CloudRain,
  Clock,
  Play,
  RotateCcw,
  Waves,
  ChevronDown,
  Info,
  Layers,
  HelpCircle
} from 'lucide-react';

interface SimulationControlPanelProps {
  waterLevelM: number;
  onWaterLevelChange: (val: number) => void;
  rainfallMmHr: number;
  onRainfallChange: (val: number) => void;
  timeOffsetMin: number;
  onTimeOffsetChange: (val: number) => void;
  selectedScenario: string;
  onSelectScenario: (scenario: string) => void;
  isRunning: boolean;
  onToggleRun: () => void;
}

export function SimulationControlPanel({
  waterLevelM,
  onWaterLevelChange,
  rainfallMmHr,
  onRainfallChange,
  timeOffsetMin,
  onTimeOffsetChange,
  selectedScenario,
  onSelectScenario,
  isRunning,
  onToggleRun,
}: SimulationControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'flood' | 'rainfall' | 'time'>('flood');

  const presets = [
    { label: '0.5 m', sub: 'Light', value: 0.5 },
    { label: '1.0 m', sub: 'Moderate', value: 1.0 },
    { label: '1.5 m', sub: 'High', value: 1.5 },
    { label: '2.0 m', sub: 'Severe', value: 2.0 },
  ];

  return (
    <div className="w-full lg:w-[330px] xl:w-[350px] bg-[#071426]/95 border-l border-[#1b2a41] flex flex-col z-20 text-white shrink-0 overflow-y-auto">
      {/* Panel Header */}
      <div className="p-4 border-b border-[#18273d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1677FF]/20 border border-[#1677FF]/40 flex items-center justify-center text-[#38BDF8]">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <h2 className="font-heading font-extrabold text-xs tracking-wider uppercase text-slate-200">
            Simulation Controls
          </h2>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold">
          LIVE TWIN
        </span>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Segmented Control Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[#0b1a2d] p-1 rounded-xl border border-[#182d47]">
          <button
            onClick={() => setActiveTab('flood')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'flood'
                ? 'bg-[#1677FF] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Flood Level</span>
          </button>
          <button
            onClick={() => setActiveTab('rainfall')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'rainfall'
                ? 'bg-[#1677FF] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Rainfall</span>
          </button>
          <button
            onClick={() => setActiveTab('time')}
            className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
              activeTab === 'time'
                ? 'bg-[#1677FF] text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Time</span>
          </button>
        </div>

        {/* Tab 1: Flood Level Control */}
        {activeTab === 'flood' && (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-300">Water Level (m)</span>
              <span className="font-mono text-2xl font-black text-[#38BDF8] tracking-tight">
                {waterLevelM.toFixed(2)} <span className="text-sm font-medium text-slate-400">m</span>
              </span>
            </div>

            {/* Slider */}
            <div className="space-y-1.5">
              <input
                type="range"
                min="0"
                max="200"
                value={Math.round(waterLevelM * 100)}
                onChange={(e) => onWaterLevelChange(Number(e.target.value) / 100)}
                className="w-full h-2 bg-[#18314D] rounded-lg appearance-none cursor-pointer accent-[#2F8CFF]"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 px-0.5">
                <span>0.0 m</span>
                <span>0.5 m</span>
                <span>1.0 m</span>
                <span>1.5 m</span>
                <span>2.0 m</span>
              </div>
            </div>

            {/* Presets */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {presets.map((p) => {
                const isSelected = Math.abs(waterLevelM - p.value) < 0.05;
                return (
                  <button
                    key={p.value}
                    onClick={() => onWaterLevelChange(p.value)}
                    className={`py-2 px-1 rounded-xl text-center transition-all border ${
                      isSelected
                        ? 'border-[#1677FF] bg-[#1677FF]/20 text-[#38BDF8] shadow-[0_0_12px_rgba(22,119,255,0.3)] ring-1 ring-[#1677FF]'
                        : 'border-[#1b2e47] bg-[#0b1a2d]/80 text-slate-300 hover:border-[#254266]'
                    }`}
                  >
                    <div className="font-mono text-xs font-bold leading-tight">{p.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-medium">({p.sub})</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Rainfall Control */}
        {activeTab === 'rainfall' && (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-300">Precipitation Intensity</span>
              <span className="font-mono text-2xl font-black text-amber-400 tracking-tight">
                {rainfallMmHr} <span className="text-sm font-medium text-slate-400">mm/h</span>
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              value={rainfallMmHr}
              onChange={(e) => onRainfallChange(Number(e.target.value))}
              className="w-full h-2 bg-[#18314D] rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0 (Dry)</span>
              <span>60 (Moderate)</span>
              <span>120 (Heavy)</span>
              <span>180+ (Torr.)</span>
            </div>
          </div>
        )}

        {/* Tab 3: Time Control */}
        {activeTab === 'time' && (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-300">Forecast Horizon</span>
              <span className="font-mono text-2xl font-black text-emerald-400 tracking-tight">
                +{timeOffsetMin} <span className="text-sm font-medium text-slate-400">min</span>
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              step="15"
              value={timeOffsetMin}
              onChange={(e) => onTimeOffsetChange(Number(e.target.value))}
              className="w-full h-2 bg-[#18314D] rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>NOW</span>
              <span>+30 min</span>
              <span>+60 min</span>
              <span>+120 min</span>
            </div>
          </div>
        )}

        {/* Scenario Preset Dropdown */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>SCENARIO PRESET</span>
            <Info className="w-3 h-3 text-slate-500" />
          </div>
          <div className="relative">
            <select
              value={selectedScenario}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="w-full bg-[#0b1a2d] border border-[#1b2e47] text-slate-200 text-xs font-semibold py-2.5 px-3 rounded-xl appearance-none cursor-pointer focus:outline-none focus:border-[#1677FF]"
            >
              <option value="current">Current Forecast (ModelArts)</option>
              <option value="sri-muda-2021">Sri Muda 2021 Replay (Historical)</option>
              <option value="heavy-rain">Heavy Rain Scenario (120 mm/hr)</option>
              <option value="rapid-rise">Rapid Water Rise (+0.4m / 15m)</option>
              <option value="drain-failure">Drainage Failure (Blockage)</option>
              <option value="synthetic-extreme">Extreme Flood (Synthetic 2.0m)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Primary Action Button: Run Simulation */}
        <div className="pt-2">
          <button
            onClick={onToggleRun}
            className={`w-full h-11 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              isRunning
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
                : 'bg-[#1677FF] text-white hover:bg-[#2F8CFF] shadow-blue-500/30 active:scale-[0.99]'
            }`}
          >
            {isRunning ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin" />
                <span>⟳ Simulating Dynamic Surge...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>▶ Run Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Map & 3D Scene Legend Card */}
        <div className="pt-2 border-t border-[#18273d]">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            Legend
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-[#12A8FF] shrink-0" />
              <span>Flood Water</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-[#E11D48] shrink-0" />
              <span>High Risk Zone</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-[#22C55E] shrink-0" />
              <span>Safe Building</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <span className="w-3.5 h-1 bg-[#EF4444] rounded-full shrink-0" />
              <span>Road (Blocked)</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-300">
              <span className="w-3.5 h-1 bg-[#00E68A] rounded-full shrink-0" />
              <span>Evacuation Route</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
