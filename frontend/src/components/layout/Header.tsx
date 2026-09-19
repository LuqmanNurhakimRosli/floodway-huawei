import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  FileText, 
  RefreshCw, 
  Search, 
  Sun, 
  Moon, 
  Building2, 
  Route, 
  X,
  SlidersHorizontal,
  BarChart3
} from 'lucide-react';
import { DisasterScenario, CriticalFacility, RouteAnalysis } from '../../types';
import { InspectableFeature } from './FeatureDetailDrawer';
import { MainAppView } from '../desktop/DashboardSidebar';

interface HeaderProps {
  scenarios: DisasterScenario[];
  activeScenario: DisasterScenario;
  onSelectScenario: (scenario: DisasterScenario) => void;
  onResetView: () => void;
  onOpenSitRepModal: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onSelectSearchResult?: (item: InspectableFeature) => void;
  activeView: MainAppView;
  // Optional layer panel toggles for when map view is active
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
  leftPanelOpen?: boolean;
  rightPanelOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  scenarios,
  activeScenario,
  onResetView,
  onSelectScenario,
  onOpenSitRepModal,
  theme,
  onToggleTheme,
  onSelectSearchResult,
  activeView,
  onToggleLeftPanel,
  onToggleRightPanel,
  leftPanelOpen,
  rightPanelOpen,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter search items from active scenario
  const matchingFacilities = activeScenario.criticalFacilities.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const matchingRoutes = activeScenario.candidateRoutes.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasResults = matchingFacilities.length > 0 || matchingRoutes.length > 0;

  const handleSelectFacility = (fac: CriticalFacility) => {
    if (onSelectSearchResult) {
      onSelectSearchResult({ type: 'facility', data: fac });
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  const handleSelectRoute = (rt: RouteAnalysis) => {
    if (onSelectSearchResult) {
      onSelectSearchResult({ type: 'route', data: rt });
    }
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="h-[52px] bg-geo-panel-header border-b border-geo-border px-4 flex items-center justify-between z-30 shadow-subtle-header select-none">
      {/* Left: Incident Scenario Switcher & Layer Toggles (When in Map View) */}
      <div className="flex items-center gap-3">
        {activeView === 'map' && onToggleLeftPanel && (
          <button 
            onClick={onToggleLeftPanel}
            title={leftPanelOpen ? "Close Map Layers" : "Open Map Layers"}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors border ${
              leftPanelOpen 
                ? 'bg-geo-accent-muted text-geo-accent border-geo-border-accent' 
                : 'bg-geo-surface-1 text-geo-text-tertiary border-geo-border hover:text-geo-text-primary hover:bg-geo-surface-2'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}

        {/* Scenario Selector */}
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-geo-accent shrink-0" />
          <select
            value={activeScenario.id}
            onChange={(e) => {
              const selected = scenarios.find((s) => s.id === e.target.value);
              if (selected) onSelectScenario(selected);
            }}
            className="bg-geo-surface-1 hover:bg-geo-surface-2 border border-geo-border hover:border-geo-border-strong text-geo-text-primary text-xs rounded-md px-2.5 py-1 font-medium focus:outline-none focus:ring-1 focus:ring-geo-accent transition-colors cursor-pointer max-w-[280px] truncate"
          >
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id} className="bg-geo-canvas text-geo-text-primary">
                {scenario.name} ({scenario.country})
              </option>
            ))}
          </select>
          <span className="hidden xl:inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase">
            Simulation
          </span>
        </div>
      </div>

      {/* Center: Global Search Omnibar */}
      <div ref={searchRef} className="relative hidden md:block w-72 lg:w-96">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-geo-text-tertiary absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search facility, road link, rescue corridor..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            className="w-full h-8 pl-8 pr-7 bg-geo-surface-1 hover:bg-geo-surface-2 focus:bg-geo-surface-2 border border-geo-border focus:border-geo-border-accent rounded-md text-xs text-geo-text-primary placeholder:text-geo-text-tertiary focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              className="absolute right-2 text-geo-text-tertiary hover:text-geo-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {searchOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-9 left-0 right-0 max-h-60 overflow-y-auto bg-geo-panel border border-geo-border-strong rounded-md shadow-tactical z-50 p-1 space-y-1">
            {hasResults ? (
              <>
                {matchingFacilities.map(fac => (
                  <div
                    key={fac.id}
                    onClick={() => handleSelectFacility(fac)}
                    className="p-2 rounded hover:bg-geo-surface-2 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className="w-3.5 h-3.5 text-geo-info shrink-0" />
                      <span className="font-medium text-geo-text-primary truncate">{fac.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-geo-surface-1 text-geo-text-tertiary shrink-0 uppercase">
                      {fac.type}
                    </span>
                  </div>
                ))}
                {matchingRoutes.map(rt => (
                  <div
                    key={rt.id}
                    onClick={() => handleSelectRoute(rt)}
                    className="p-2 rounded hover:bg-geo-surface-2 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Route className="w-3.5 h-3.5 text-geo-success shrink-0" />
                      <span className="font-medium text-geo-text-primary truncate">{rt.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-geo-text-tertiary shrink-0">
                      {rt.distanceKm} km
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <div className="p-3 text-center text-xs text-geo-text-tertiary">
                No matching facility or corridor found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Operational Clock, Camera Reset, SITREP Launcher */}
      <div className="flex items-center gap-2">
        <div className="hidden 2xl:flex items-center font-mono text-[11px] text-geo-text-secondary pr-1">
          <span>{utcTime}</span>
        </div>

        {/* Reset Camera View Button */}
        <button
          onClick={onResetView}
          title="Reset map camera to AOI center"
          className="h-8 px-2.5 text-xs font-medium rounded-md bg-geo-surface-1 hover:bg-geo-surface-2 text-geo-text-secondary hover:text-geo-text-primary border border-geo-border transition-colors flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Reset</span>
        </button>

        {/* Theme Switcher Button */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Switch to Daylight Mode" : "Switch to Tactical Dark"}
          className="w-8 h-8 rounded-md flex items-center justify-center bg-geo-surface-1 hover:bg-geo-surface-2 text-geo-text-secondary hover:text-geo-text-primary border border-geo-border transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-geo-accent" />
          )}
        </button>

        {/* SitRep Modal Trigger */}
        <button
          onClick={onOpenSitRepModal}
          title="Generate Situation Report"
          className="h-8 px-3 text-xs font-semibold rounded-md bg-geo-accent hover:bg-geo-accent-hover text-white flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98]"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SITREP</span>
        </button>

        {activeView === 'map' && onToggleRightPanel && (
          <button 
            onClick={onToggleRightPanel}
            title={rightPanelOpen ? "Close Incident Intelligence Drawer" : "Open Incident Intelligence Drawer"}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors border ${
              rightPanelOpen 
                ? 'bg-geo-accent-muted text-geo-accent border-geo-border-accent' 
                : 'bg-geo-surface-1 text-geo-text-tertiary border-geo-border hover:text-geo-text-primary hover:bg-geo-surface-2'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
