import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowUpRight, TrendingUp, CloudRain, Clock, Cpu } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function EmergencyCommandBar() {
  const navigate = useNavigate();
  const { waterLevelM } = useApp();

  return (
    <section className="rounded-2xl bg-[#FFF7F7] border-2 border-[#FCA5A5] p-4 md:p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-red-200/60">
        {/* Threat Title & Evacuation Countdown */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-red-100 text-[#DC2626] shrink-0 mt-0.5">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-[#DC2626] text-white text-xs font-bold tracking-wide uppercase">
                DANGER
              </span>
              <span className="text-xs font-semibold text-red-700 bg-red-100/80 px-2 py-0.5 rounded">
                Impact in ~62 mins
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-xl md:text-2xl text-[#7F1D1D] mt-1 tracking-tight">
              Evacuation Advised · Klang River Basin
            </h2>
            <p className="text-xs md:text-sm text-red-800 font-medium">
              Water levels rising rapidly across low-lying residential sectors. Move to designated safe centers.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/navigation/shelter-01')}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-sm shadow-md shadow-red-500/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>EVACUATE TO SAFE SHELTER</span>
          </button>
          <button
            onClick={() => navigate('/map')}
            className="px-4 py-3 rounded-xl bg-white hover:bg-red-50 text-red-800 border border-red-300 font-semibold text-sm transition-colors"
          >
            View Map
          </button>
        </div>
      </div>

      {/* 4 Metric Columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 pt-4">
        {/* 1. Water Level */}
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-red-600" />
            Water Level (Current)
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-heading font-extrabold text-2xl text-red-900">{waterLevelM.toFixed(2)} m</span>
            <span className="text-xs font-bold text-red-600">+0.3m/15m</span>
          </div>
          <span className="text-[11px] font-medium text-red-700">Rising rapidly</span>
        </div>

        {/* 2. Forecast Level */}
        <div className="flex flex-col border-l border-red-200/50 pl-3">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Forecast (+60 min)
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-heading font-extrabold text-2xl text-red-900">1.65 m</span>
            <span className="text-xs font-semibold text-amber-700">P50 Median</span>
          </div>
          <span className="text-[11px] font-bold text-red-600">Danger threshold</span>
        </div>

        {/* 3. Rainfall */}
        <div className="flex flex-col border-l border-red-200/50 pl-3">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <CloudRain className="w-3.5 h-3.5 text-blue-600" />
            Monsoon Rainfall
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-heading font-extrabold text-2xl text-slate-900">95 mm/h</span>
          </div>
          <span className="text-[11px] font-medium text-blue-700">Heavy downpour</span>
        </div>

        {/* 4. Model Confidence */}
        <div className="flex flex-col border-l border-red-200/50 pl-3">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            ModelArts Confidence
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="font-heading font-extrabold text-2xl text-emerald-900">87%</span>
            <span className="text-xs font-medium text-emerald-600">Ascend GRU</span>
          </div>
          <span className="text-[11px] font-medium text-slate-600">14 Active Sensors</span>
        </div>
      </div>
    </section>
  );
}
