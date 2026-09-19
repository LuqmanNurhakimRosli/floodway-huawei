import React, { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  Clock, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  ShieldAlert
} from 'lucide-react';
import { DisasterScenario } from '../../types';

interface BottomEventSummaryProps {
  scenario: DisasterScenario;
}

export const BottomEventSummary: React.FC<BottomEventSummaryProps> = ({ scenario }) => {
  const [expanded, setExpanded] = useState<boolean>(false);

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'ALERT':
        return <AlertCircle className="w-3 h-3 text-geo-critical shrink-0" />;
      case 'WARNING':
        return <ShieldAlert className="w-3 h-3 text-geo-warning shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-3 h-3 text-geo-success shrink-0" />;
      default:
        return <Info className="w-3 h-3 text-geo-accent shrink-0" />;
    }
  };

  return (
    <footer className="bg-geo-panel-header backdrop-blur-[16px] border-t border-geo-border z-30 select-none shadow-subtle-header transition-all duration-300">
      {/* Top Bar: Operational Metrics Strip (40px) */}
      <div className="h-10 px-4 flex items-center justify-between text-xs">
        {/* KPI Strip */}
        <div className="flex items-center gap-5 overflow-x-auto py-1 scrollbar-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase text-geo-text-tertiary font-semibold tracking-wider">AOI</span>
            <span className="font-mono font-semibold text-geo-text-primary text-[11px]">{scenario.stats.aoiAreaKm2} km²</span>
          </div>

          <div className="h-3.5 w-px bg-geo-divider" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase text-geo-text-tertiary font-semibold tracking-wider">Inundation</span>
            <span className="font-mono font-semibold text-geo-accent text-[11px]">{scenario.stats.floodAreaKm2} km²</span>
          </div>

          <div className="h-3.5 w-px bg-geo-divider" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase text-geo-text-tertiary font-semibold tracking-wider">Structures</span>
            <span className="font-mono font-semibold text-geo-critical text-[11px]">{scenario.stats.damagedStructuresCount}</span>
          </div>

          <div className="h-3.5 w-px bg-geo-divider" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase text-geo-text-tertiary font-semibold tracking-wider">Blocked Roads</span>
            <span className="font-mono font-semibold text-geo-warning text-[11px]">{scenario.stats.impassableRoadsCount}</span>
          </div>

          <div className="h-3.5 w-px bg-geo-divider" />

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase text-geo-text-tertiary font-semibold tracking-wider">Viable Routes</span>
            <span className="font-mono font-semibold text-geo-success text-[11px]">
              {scenario.candidateRoutes.filter(r => r.status === 'viable').length}/{scenario.candidateRoutes.length}
            </span>
          </div>
        </div>

        {/* Right side: Secondary Chronology Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-geo-surface-1 hover:bg-geo-surface-2 text-geo-text-secondary hover:text-geo-text-primary border border-geo-border transition-colors font-mono"
            title="Toggle Event Audit Log"
          >
            <Clock className="w-3 h-3 text-geo-accent" />
            <span>Timeline ({scenario.sitrepLogs.length})</span>
            {expanded ? <ChevronDown className="w-3 h-3 ml-0.5" /> : <ChevronUp className="w-3 h-3 ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Chronology Drawer (Collapsed by default) */}
      {expanded && (
        <div className="max-h-40 overflow-y-auto px-4 py-2 border-t border-geo-divider bg-geo-surface-1 font-mono text-[11px] space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-geo-text-tertiary font-semibold mb-1">
            System Event Chronology (UTC)
          </div>
          {scenario.sitrepLogs.map((log, index) => (
            <div key={index} className="flex items-center gap-2.5 py-0.5 text-geo-text-secondary">
              <span className="text-geo-text-tertiary w-14 shrink-0">{log.time}</span>
              {getLogIcon(log.level)}
              <span className="text-geo-text-primary truncate">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </footer>
  );
};
