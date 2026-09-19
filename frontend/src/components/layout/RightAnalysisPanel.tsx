import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Building, 
  Warehouse, 
  Route, 
  X
} from 'lucide-react';
import { DisasterScenario, CriticalFacility, RouteAnalysis } from '../../types';

interface RightAnalysisPanelProps {
  scenario: DisasterScenario;
  onSelectFacility: (facility: CriticalFacility) => void;
  onSelectRoute: (route: RouteAnalysis) => void;
  selectedRouteId: string | null;
  selectedFacilityId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RightAnalysisPanel: React.FC<RightAnalysisPanelProps> = ({
  scenario,
  onSelectFacility,
  onSelectRoute,
  selectedRouteId,
  selectedFacilityId,
  isOpen,
  onClose,
}) => {
  const [facilityFilter, setFacilityFilter] = useState<'ALL' | 'CRITICAL' | 'OPERATIONAL'>('ALL');

  if (!isOpen) return null;

  const totalDamage = scenario.stats.damagedStructuresCount;

  const filteredFacilities = scenario.criticalFacilities.filter(f => {
    if (facilityFilter === 'CRITICAL') return f.status === 'submerged' || f.status === 'compromised';
    if (facilityFilter === 'OPERATIONAL') return f.status === 'operational';
    return true;
  });

  return (
    <aside className="absolute top-3 right-3 z-30 w-[320px] max-h-[calc(100vh-130px)] bg-geo-panel backdrop-blur-[16px] border border-geo-border-strong rounded-lg shadow-tactical flex flex-col select-none overflow-hidden animate-in fade-in slide-in-from-right-2 duration-200">
      {/* Panel Header */}
      <div className="h-10 px-3 border-b border-geo-divider flex items-center justify-between bg-geo-surface-1">
        <div className="flex items-center gap-2 text-geo-text-primary font-semibold text-xs tracking-wider uppercase">
          <AlertTriangle className="w-3.5 h-3.5 text-geo-warning" />
          <span>Incident Intelligence</span>
        </div>
        <button 
          onClick={onClose}
          className="text-geo-text-tertiary hover:text-geo-text-primary p-1 rounded hover:bg-geo-surface-2 transition-colors"
          title="Close Intelligence"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
        {/* Restrained Critical Severity Card (Section 17) */}
        <div className="p-2.5 rounded-md bg-geo-critical-bg border border-geo-critical/20 border-l-[3px] border-l-geo-critical">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-geo-critical text-[11px] flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-geo-critical"></span>
              Road Access Disrupted
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-geo-critical/20 text-geo-critical font-semibold uppercase">
              {scenario.stats.impassableRoadsCount} Impassable
            </span>
          </div>
          <p className="text-[11px] text-geo-text-secondary leading-relaxed">
            Flood extent covers <strong className="font-mono text-geo-text-primary">{scenario.stats.floodAreaKm2} km²</strong>. Multi-criteria routing calculated bypass corridors.
          </p>
        </div>

        {/* Damage Assessment (Clean & Compact) */}
        <div className="p-2.5 rounded-md bg-geo-surface-1 border border-geo-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-geo-text-primary font-semibold flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-geo-critical" />
              <span>Damage Assessment</span>
            </span>
            <span className="font-mono text-geo-text-primary font-semibold text-xs">
              {totalDamage} Total
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px] pt-1">
            <div className="p-1.5 rounded bg-geo-surface-2 border border-geo-border">
              <div className="text-geo-text-tertiary">Destroyed</div>
              <div className="text-geo-critical font-semibold text-xs mt-0.5">{scenario.stats.destroyedCount}</div>
            </div>
            <div className="p-1.5 rounded bg-geo-surface-2 border border-geo-border">
              <div className="text-geo-text-tertiary">Major</div>
              <div className="text-geo-warning font-semibold text-xs mt-0.5">{scenario.stats.majorDamageCount}</div>
            </div>
            <div className="p-1.5 rounded bg-geo-surface-2 border border-geo-border">
              <div className="text-geo-text-tertiary">Minor</div>
              <div className="text-geo-caution font-semibold text-xs mt-0.5">{scenario.stats.minorDamageCount}</div>
            </div>
          </div>
        </div>

        {/* Critical Facilities (With Filter & Two-line wrapping - No truncation ellipses!) */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <div className="flex items-center gap-1 text-geo-text-primary font-semibold text-xs">
              <Warehouse className="w-3.5 h-3.5 text-geo-info" />
              <span>Critical Facilities</span>
            </div>
            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-[9px] font-mono">
              {(['ALL', 'CRITICAL', 'OPERATIONAL'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFacilityFilter(f)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    facilityFilter === f
                      ? 'bg-geo-surface-3 text-geo-text-primary font-semibold'
                      : 'text-geo-text-tertiary hover:text-geo-text-secondary'
                  }`}
                >
                  {f === 'ALL' ? 'All' : f === 'CRITICAL' ? 'Alert' : 'Op'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            {filteredFacilities.map((fac) => {
              const isSelected = selectedFacilityId === fac.id;
              return (
                <div
                  key={fac.id}
                  onClick={() => onSelectFacility(fac)}
                  className={`p-2 rounded-md border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-geo-accent-muted border-geo-border-accent shadow-sm'
                      : 'bg-geo-surface-1 border-geo-border hover:border-geo-border-strong hover:bg-geo-surface-2'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="font-medium text-xs text-geo-text-primary line-clamp-2 leading-snug">
                      {fac.name}
                    </span>
                    <span className={`text-[9px] font-mono font-semibold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                      fac.status === 'operational' ? 'bg-geo-success-bg text-geo-success border border-geo-success/30' :
                      fac.status === 'compromised' ? 'bg-geo-warning-bg text-geo-warning border border-geo-warning/30' :
                      'bg-geo-critical-bg text-geo-critical border border-geo-critical/30'
                    }`}>
                      {fac.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-geo-text-secondary line-clamp-1">
                    {fac.details}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Candidate Rescue Corridors (Section 26) */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-geo-text-primary font-semibold text-xs flex items-center gap-1.5">
              <Route className="w-3.5 h-3.5 text-geo-success" />
              <span>Rescue Corridors</span>
            </span>
            <span className="text-[10px] font-mono text-geo-text-tertiary">
              {scenario.candidateRoutes.filter(r => r.status === 'viable').length}/{scenario.candidateRoutes.length} Viable
            </span>
          </div>

          <div className="space-y-1.5">
            {scenario.candidateRoutes.map((route) => {
              const isSelected = selectedRouteId === route.id;
              const isViable = route.status === 'viable';
              return (
                <div
                  key={route.id}
                  onClick={() => onSelectRoute(route)}
                  className={`p-2.5 rounded-md border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-geo-accent-muted border-geo-border-accent'
                      : isViable
                        ? 'bg-geo-surface-1 border-geo-border hover:border-geo-border-strong hover:bg-geo-surface-2'
                        : 'bg-geo-surface-1 border-geo-border opacity-70 hover:opacity-100 hover:bg-geo-surface-2'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-geo-text-primary truncate">
                      {route.title}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase ${
                      isViable 
                        ? 'bg-geo-success-bg text-geo-success border border-geo-success/30'
                        : 'bg-geo-critical-bg text-geo-critical border border-geo-critical/30'
                    }`}>
                      {route.status}
                    </span>
                  </div>

                  {/* Route Specs (Honest Demo ETA Label) */}
                  <div className="flex items-center gap-3 font-mono text-[10px] text-geo-text-secondary">
                    <span>{route.distanceKm} km</span>
                    <span>•</span>
                    <span>{route.estTimeMin > 0 ? `~${route.estTimeMin} min (demo)` : 'BLOCKED'}</span>
                    <span>•</span>
                    <span className={route.riskLevel === 'LOW' ? 'text-geo-success' : 'text-geo-warning'}>
                      {route.riskLevel} RISK
                    </span>
                  </div>

                  <p className="text-[10px] text-geo-text-tertiary mt-1 line-clamp-1">
                    {route.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
