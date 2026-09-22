import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  Eye,
  Camera,
  Layers,
  Sparkles,
  Cpu
} from 'lucide-react';

interface SimulationResultStripProps {
  waterLevelM: number;
  cameraPreset: 'iso' | 'top' | 'front';
  onSelectCameraPreset: (preset: 'iso' | 'top' | 'front') => void;
  onOpenFullForecast?: () => void;
}

export function SimulationResultStrip({
  waterLevelM,
  cameraPreset,
  onSelectCameraPreset,
  onOpenFullForecast,
}: SimulationResultStripProps) {
  // Determine dynamic risk status
  const riskStatus = React.useMemo(() => {
    if (waterLevelM >= 1.0) {
      return {
        badge: 'Severe Flooding',
        color: 'bg-red-500/20 text-red-400 border-red-500/40',
        text: `At ${waterLevelM.toFixed(2)} m water level, this house is expected to be severely inundated. Living room breached, electrical mains compromised.`,
        timeToImpact: '~ 15 min',
      };
    }
    if (waterLevelM >= 0.6) {
      return {
        badge: 'High Risk',
        color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
        text: `At ${waterLevelM.toFixed(2)} m water level, driveway submerged. Car porch water ingress, immediate evacuation advisory in effect.`,
        timeToImpact: '~ 28 min',
      };
    }
    if (waterLevelM >= 0.3) {
      return {
        badge: 'Caution Stage',
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        text: `At ${waterLevelM.toFixed(2)} m water level, road runoff exceeds drainage threshold. Prepare emergency go-bag and monitor alerts.`,
        timeToImpact: '~ 45 min',
      };
    }
    return {
      badge: 'Normal / Safe',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      text: `Water level is within baseline curbs. No immediate threat to residence foundation or living quarters.`,
      timeToImpact: '> 2 hours',
    };
  }, [waterLevelM]);

  return (
    <div className="w-full bg-[#050B14] border-t border-[#18273d] p-3 md:p-4 text-white z-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
        {/* Card 1: Simulation Result (5 cols) */}
        <div className="lg:col-span-4 xl:col-span-4 bg-[#071426]/90 border border-[#1b2f4a] rounded-2xl p-3.5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                <span>Simulation Result</span>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${riskStatus.color}`}
              >
                ⚠ {riskStatus.badge}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
              {riskStatus.text}
            </p>
          </div>

          {/* 3 Metric Badges */}
          <div className="grid grid-cols-3 gap-2 pt-3 mt-2 border-t border-[#132237]">
            <div className="bg-[#0b1b30] p-2 rounded-xl border border-[#172d4b]">
              <div className="font-mono text-base md:text-lg font-black text-[#38BDF8]">
                {waterLevelM.toFixed(2)} m
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Water Level (est.)</div>
            </div>
            <div className="bg-[#0b1b30] p-2 rounded-xl border border-[#172d4b]">
              <div className="font-mono text-base md:text-lg font-black text-slate-200">
                0.35 m
              </div>
              <div className="text-[10px] text-slate-400 font-medium">House Elevation</div>
            </div>
            <div className="bg-[#0b1b30] p-2 rounded-xl border border-[#172d4b]">
              <div className="font-mono text-base md:text-lg font-black text-amber-400">
                {riskStatus.timeToImpact}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Time to Impact</div>
            </div>
          </div>
        </div>

        {/* Card 2: 3D View Modes (3 cols) */}
        <div className="lg:col-span-3 xl:col-span-3 bg-[#071426]/90 border border-[#1b2f4a] rounded-2xl p-3.5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Camera className="w-4 h-4 text-blue-400" />
              <span>3D View Modes</span>
            </div>
            <span className="text-[10px] text-slate-400">Interactive</span>
          </div>

          {/* 3 Thumbnail View Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => onSelectCameraPreset('iso')}
              className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border ${
                cameraPreset === 'iso'
                  ? 'border-[#1677FF] bg-[#1677FF]/20 text-white ring-2 ring-[#1677FF]/50 shadow-md shadow-blue-500/20'
                  : 'border-[#1b2e47] bg-[#0b1a2d] text-slate-400 hover:text-white hover:border-[#254266]'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-blue-400">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold">Detailed View</span>
            </button>

            <button
              onClick={() => onSelectCameraPreset('top')}
              className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border ${
                cameraPreset === 'top'
                  ? 'border-[#1677FF] bg-[#1677FF]/20 text-white ring-2 ring-[#1677FF]/50 shadow-md shadow-blue-500/20'
                  : 'border-[#1b2e47] bg-[#0b1a2d] text-slate-400 hover:text-white hover:border-[#254266]'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-emerald-400">
                <Eye className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold">Top View</span>
            </button>

            <button
              onClick={() => onSelectCameraPreset('front')}
              className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border ${
                cameraPreset === 'front'
                  ? 'border-[#1677FF] bg-[#1677FF]/20 text-white ring-2 ring-[#1677FF]/50 shadow-md shadow-blue-500/20'
                  : 'border-[#1b2e47] bg-[#0b1a2d] text-slate-400 hover:text-white hover:border-[#254266]'
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-slate-800/80 flex items-center justify-center text-amber-400">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold">Street View</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-2">
            Click thumbnail or use on-canvas controls to pivot
          </div>
        </div>

        {/* Card 3: Flood Timeline (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-5 bg-[#071426]/90 border border-[#1b2f4a] rounded-2xl p-3.5 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Flood Timeline</span>
            </div>
            <button
              onClick={onOpenFullForecast}
              className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Forecast</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Timeline Bar with Progression Points */}
          <div className="py-2.5 px-2">
            <div className="relative flex items-center justify-between">
              {/* Connector line */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-blue-500 via-amber-500 to-red-500 -z-0" />

              {/* Point 1: NOW */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-[#1677FF] ring-4 ring-[#071426]" />
                <span className="text-[10px] font-bold text-slate-300 mt-1">Now</span>
                <span className="font-mono text-[11px] font-extrabold text-[#38BDF8]">
                  {waterLevelM.toFixed(2)} m
                </span>
              </div>

              {/* Point 2: +30 min */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-amber-400 ring-4 ring-[#071426]" />
                <span className="text-[10px] font-bold text-slate-300 mt-1">+30 min</span>
                <span className="font-mono text-[11px] font-extrabold text-amber-300">
                  {Math.min(2.0, waterLevelM + 0.30).toFixed(2)} m
                </span>
              </div>

              {/* Point 3: +60 min */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500 ring-4 ring-[#071426]" />
                <span className="text-[10px] font-bold text-slate-300 mt-1">+60 min</span>
                <span className="font-mono text-[11px] font-extrabold text-rose-300">
                  {Math.min(2.2, waterLevelM + 0.75).toFixed(2)} m
                </span>
              </div>

              {/* Point 4: +120 min */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-red-600 ring-4 ring-[#071426]" />
                <span className="text-[10px] font-bold text-slate-300 mt-1">+120 min</span>
                <span className="font-mono text-[11px] font-extrabold text-red-400">
                  {Math.min(2.5, waterLevelM + 1.01).toFixed(2)} m
                </span>
              </div>
            </div>
          </div>

          {/* Subtext: ModelArts GRU Forecast Confidence */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-[#132237]">
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>AI Prediction: Huawei ModelArts (Ascend 910 GRU)</span>
            </div>
            <span className="text-emerald-400 font-bold">87% confidence</span>
          </div>
        </div>
      </div>
    </div>
  );
}
