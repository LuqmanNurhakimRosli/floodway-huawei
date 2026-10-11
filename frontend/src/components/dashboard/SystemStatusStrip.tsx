import React from 'react';
import { Activity, Cloud, Video } from 'lucide-react';
import { useBackendHealth } from '../../hooks/useBackendHealth';
import { useVisionStore } from '../../hooks/vision/useVisionStore';

const dot = (cls: string) => <span className={`w-2 h-2 rounded-full shrink-0 ${cls}`} aria-hidden="true" />;

/** Only states the app can measure. Anything simulated says so; nothing claims a government or sensor feed. */
export function SystemStatusStrip() {
  const { status } = useBackendHealth();
  const vision = useVisionStore();
  const online = vision.cameras.filter((c) => c.online).length;

  const backend = status === 'up' ? { c: 'bg-emerald-500', t: 'Backend online' } : status === 'down' ? { c: 'bg-red-500', t: 'Backend unreachable' } : { c: 'bg-slate-400', t: 'Checking backend…' };
  const cams = vision.status !== 'ready'
    ? { c: 'bg-slate-400', t: 'Live Vision: loading' }
    : vision.usingMock
      ? { c: 'bg-amber-500', t: 'Live Vision: sample data (server unreachable)' }
      : { c: 'bg-emerald-500', t: `Live Vision: ${online}/${vision.cameras.length} sample cameras online` };

  return (
    <div className="rounded-xl bg-slate-100/80 border border-slate-200/60 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs font-medium text-slate-700 gap-x-4 gap-y-1.5" role="status">
      <div className="flex items-center gap-1.5">{dot(backend.c)}<Activity className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" /><span>{backend.t}</span></div>
      <div className="flex items-center gap-1.5">{dot(cams.c)}<Video className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" /><span>{cams.t}</span></div>
      <div className="flex items-center gap-1.5"><Cloud className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" /><span>Forecast: simulated input</span></div>
    </div>
  );
}
