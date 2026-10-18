import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle, Video } from 'lucide-react';

export function InPageActionDock() {
  const navigate = useNavigate();

  // Desktop only: on phones the bottom nav already links to these pages (the dock used to sit invisibly under the tab strip).
  return (
    <div className="absolute top-4 right-4 z-20 hidden md:flex items-center gap-2 p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg">
      <button
        onClick={() => navigate('/home')}
        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
        title="Return to Home Dashboard"
      >
        <Home className="w-3.5 h-3.5 text-[#0E7C7B]" />
        <span>Home</span>
      </button>

      <button
        onClick={() => navigate('/reports')}
        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
        title="Report Flooding Incident"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
        <span>Report Flood</span>
      </button>

      <button
        onClick={() => navigate('/live')}
        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
        title="Open Live Vision CCTV"
      >
        <Video className="w-3.5 h-3.5 text-teal-600" />
        <span>Live Vision</span>
      </button>
    </div>
  );
}
