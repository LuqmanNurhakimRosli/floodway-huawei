import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';

export interface LegendItem {
  key: string;
  swatch: React.ReactNode;
  label: string;
  /** Where the data comes from. Every layer must say, so the map never claims more than the data supports. */
  source: string;
}

/** A 24px line/shape sample for the legend. */
const Line = ({ color, dashed = false }: { color: string; dashed?: boolean }) => (
  <svg width="24" height="10" viewBox="0 0 24 10" aria-hidden="true">
    <line x1="1" y1="5" x2="23" y2="5" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={dashed ? '5 4' : undefined} />
  </svg>
);
const Box = ({ color, dashed = false }: { color: string; dashed?: boolean }) => (
  <svg width="24" height="14" viewBox="0 0 24 14" aria-hidden="true">
    <rect x="1.5" y="1.5" width="21" height="11" rx="2" fill={color} fillOpacity="0.28" stroke={color} strokeWidth="1.6" strokeDasharray={dashed ? '4 3' : undefined} />
  </svg>
);
const Dot = ({ color }: { color: string }) => (
  <svg width="24" height="14" viewBox="0 0 24 14" aria-hidden="true">
    <circle cx="12" cy="7" r="5.5" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.8" />
  </svg>
);

interface Props {
  /** Colour of the demo flood basins for the selected scenario. */
  basinColor: string;
  basinLabel: string;
}

export function MapLegend({ basinColor, basinLabel }: Props) {
  // Open by default where there is room; a button on phones so it never covers the map.
  const [open, setOpen] = useState(false);
  const items: LegendItem[] = [
    { key: 'route', swatch: <Line color="#0284C7" dashed />, label: 'Approximate route', source: 'Demo waypoints, not road-aware' },
    { key: 'basins', swatch: <Box color={basinColor} dashed />, label: `Flood basins (${basinLabel})`, source: 'Demo data, simulated' },
    { key: 'zones', swatch: <Dot color="#DC2626" />, label: 'Camera flood zone', source: 'Sample cameras, simulated' },
    { key: 'blocks', swatch: <span className="text-red-500 text-sm font-bold leading-none">✕</span>, label: 'Roadblock', source: 'Demo data, simulated' },
    { key: 'shelters', swatch: <span className="text-emerald-500 text-sm leading-none">⛨</span>, label: 'Shelter', source: 'Demo list' },
  ];

  return (
    <div className="absolute bottom-24 left-3 z-10 md:bottom-4 md:left-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="map-legend"
        onClick={() => setOpen(!open)}
        className="flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 text-xs font-semibold text-white shadow-xl backdrop-blur-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
      >
        <Info className="h-4 w-4" aria-hidden="true" /> Legend {open ? <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />}
      </button>
      <div
        id="map-legend"
        className={`${open ? 'mt-2 block' : 'hidden'} md:mt-0 md:block w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-700/80 bg-slate-900/92 p-3 text-white shadow-xl backdrop-blur-md`}
      >
        <p className="mb-2 hidden text-xs font-bold uppercase tracking-wide text-slate-300 md:block">Legend</p>
        <ul className="space-y-1.5">
          {items.map((i) => (
            <li key={i.key} className="flex items-center gap-2.5 text-xs">
              <span className="flex w-6 shrink-0 items-center justify-center">{i.swatch}</span>
              <span className="min-w-0">
                <span className="block font-semibold text-white">{i.label}</span>
                <span className="block text-slate-300">{i.source}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 border-t border-slate-700 pt-2 text-xs text-slate-300">Basemap &copy; OpenStreetMap contributors</p>
      </div>
    </div>
  );
}
