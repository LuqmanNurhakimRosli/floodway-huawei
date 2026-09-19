import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="absolute bottom-3 right-3 z-20 bg-geo-panel backdrop-blur-[16px] border border-geo-border-strong rounded-lg shadow-tactical text-xs select-none p-2.5 w-56 transition-all duration-200">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-1.5 text-geo-text-primary font-semibold text-[11px] tracking-wider uppercase">
          <Layers className="w-3.5 h-3.5 text-geo-accent" />
          <span>Map Legend</span>
        </div>
        <button className="text-geo-text-tertiary hover:text-geo-text-primary transition-colors">
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {!collapsed && (
        <div className="space-y-2 mt-2 pt-2 border-t border-geo-divider text-[11px]">
          {/* Hazards & Inundation */}
          <div>
            <div className="text-[10px] text-geo-text-tertiary font-semibold uppercase mb-1">
              Hazard
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-geo-accent/25 border border-geo-accent"></span>
              <span className="text-geo-text-secondary">Flood Inundation Extent</span>
            </div>
          </div>

          {/* Damage Severity */}
          <div>
            <div className="text-[10px] text-geo-text-tertiary font-semibold uppercase mb-1">
              Damage
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-geo-critical"></span>
                <span className="text-geo-text-secondary">Destroyed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-geo-warning"></span>
                <span className="text-geo-text-secondary">Damaged</span>
              </div>
            </div>
          </div>

          {/* Transportation Corridors */}
          <div>
            <div className="text-[10px] text-geo-text-tertiary font-semibold uppercase mb-1">
              Roads & Corridors
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 rounded-sm bg-geo-success"></span>
                <span className="text-geo-text-secondary">Rescue Corridor</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 rounded-sm bg-geo-warning"></span>
                <span className="text-geo-text-secondary">Marginal Road</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 rounded-sm bg-geo-critical"></span>
                <span className="text-geo-text-secondary">Impassable / Blocked</span>
              </div>
            </div>
          </div>

          {/* Critical Facilities */}
          <div>
            <div className="text-[10px] text-geo-text-tertiary font-semibold uppercase mb-1">
              Facilities
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-geo-success"></span>
                <span className="text-geo-text-secondary">Hospital</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-geo-info"></span>
                <span className="text-geo-text-secondary">Staging Base</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
