import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';

export function EmergencyAlertBanner() {
  const { floodPhase } = useApp();
  const navigate = useNavigate();

  if (floodPhase !== 'DANGER' && floodPhase !== 'WARNING') return null;

  return (
    <div className="bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2 max-w-[85%] truncate">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-200 animate-pulse" />
        <span className="font-bold">CRITICAL WARNING:</span>
        <span className="truncate">
          River water depth exceeded safe threshold (1.20m). Evacuation advised for low-lying zones.
        </span>
      </div>
      <button
        onClick={() => navigate('/map')}
        className="flex items-center gap-1 font-bold text-xs bg-white text-[#DC2626] px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
      >
        <span>Evacuate</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
