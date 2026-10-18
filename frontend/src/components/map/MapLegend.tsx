import type React from 'react';

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
const Dot = ({ color, dashed = false }: { color: string; dashed?: boolean }) => (
  <svg width="24" height="14" viewBox="0 0 24 14" aria-hidden="true">
    <circle cx="12" cy="7" r="5.5" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.8" strokeDasharray={dashed ? '3 2' : undefined} />
  </svg>
);

/** Legend rows, shown in the map's layers sheet. Every layer says where its data comes from. */
export function LegendList({ floodColor }: { floodColor: string }) {
  const items: LegendItem[] = [
    { key: 'member', swatch: <span className="h-4 w-4 rounded-full bg-gradient-to-br from-[#4096FF] to-[#0958D9] ring-2 ring-white" />, label: 'Family member', source: 'Simulated, except you' },
    { key: 'route', swatch: <Line color="#1677FF" />, label: 'Road route', source: 'OpenStreetMap roads' },
    { key: 'alt', swatch: <Line color="#64748B" dashed />, label: 'Other route', source: 'OpenStreetMap roads' },
    { key: 'flood', swatch: <Dot color={floodColor} />, label: 'Flooded area', source: 'Simulated scenario' },
    { key: 'watch', swatch: <Dot color="#0284C7" dashed />, label: 'Low-lying, on watch', source: 'Hand-placed demo areas' },
    { key: 'cam', swatch: <Dot color="#DC2626" />, label: 'Camera zone', source: 'Sample cameras' },
    { key: 'shelters', swatch: <span className="text-sm leading-none text-emerald-600">⛨</span>, label: 'Relief centre', source: 'Demo list' },
  ];
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.key} className="flex items-center gap-3 text-sm">
          <span className="flex w-6 shrink-0 items-center justify-center">{i.swatch}</span>
          <span className="font-semibold text-slate-900">{i.label}</span>
          <span className="ml-auto text-right text-xs text-slate-500">{i.source}</span>
        </li>
      ))}
    </ul>
  );
}
