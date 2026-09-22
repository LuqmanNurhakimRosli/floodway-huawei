import React from 'react';
import { CheckCircle2, Cloud, Database, Wifi } from 'lucide-react';

export function SystemStatusStrip() {
  return (
    <div className="rounded-xl bg-slate-100/80 border border-slate-200/60 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] font-semibold text-slate-600 gap-2">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span>Sensors 12/14 Online</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Cloud className="w-3.5 h-3.5 text-[#1677FF]" />
        <span>Huawei ModelArts (Kuala Lumpur Region)</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Wifi className="w-3.5 h-3.5 text-emerald-600" />
        <span>Telegram Bot Gateway Active</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Database className="w-3.5 h-3.5 text-slate-500" />
        <span>JPS River Gauging Synced 2m ago</span>
      </div>
    </div>
  );
}
