import React from 'react';
import { Cpu, AlertTriangle, TrendingUp } from 'lucide-react';

export function AiForecastChart() {
  const horizons = [
    { label: 'Now', val: 1.20, level: 'Warn' },
    { label: '+15m', val: 1.31, level: 'Warn' },
    { label: '+30m', val: 1.48, level: 'Warn' },
    { label: '+45m', val: 1.58, level: 'Danger' },
    { label: '+60m', val: 1.65, level: 'Danger' },
    { label: '+90m', val: 1.82, level: 'Danger' },
    { label: '+120m', val: 1.91, level: 'Danger' },
  ];

  const maxVal = 2.20;

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#1677FF]" />
            <h3 className="font-heading font-bold text-sm md:text-base text-slate-900">
              Huawei ModelArts Flood Forecast
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1677FF] text-[10px] font-bold border border-blue-200">
            Ascend 910 GRU
          </span>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          P50 Hydrological prediction with calibrated run-off accretion index.
        </p>

        {/* Bar Forecast Graphic */}
        <div className="h-40 flex items-end justify-between gap-2 pt-4 pb-2 border-b border-slate-100 relative">
          {/* Critical Threshold Dotted Line (1.50m) */}
          <div
            className="absolute left-0 right-0 border-b-2 border-dashed border-red-500/80 z-10 flex items-center justify-between text-[10px] text-red-600 font-bold px-1"
            style={{ bottom: `${(1.50 / maxVal) * 100}%` }}
          >
            <span>Danger Threshold (1.50m)</span>
          </div>

          {horizons.map((h, i) => {
            const barHeightPct = (h.val / maxVal) * 100;
            const isDanger = h.val >= 1.50;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5">
                  {h.val.toFixed(2)}m
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all ${
                    isDanger
                      ? 'bg-gradient-to-t from-red-600 to-red-400'
                      : 'bg-gradient-to-t from-amber-500 to-amber-300'
                  }`}
                  style={{ height: `${barHeightPct}%` }}
                />
                <span className="text-[10px] font-semibold text-slate-500">{h.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5 text-red-500" />
          Peak Projection: <b>1.91 m</b> (+120 min)
        </span>
        <span className="font-semibold text-emerald-600">87% Confidence</span>
      </div>
    </div>
  );
}
