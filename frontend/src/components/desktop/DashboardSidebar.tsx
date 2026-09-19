import React from 'react';
import { 
  ShieldAlert, 
  Map, 
  Eye, 
  Route, 
  BarChart3, 
  FileText, 
  Compass, 
  ClipboardList, 
  Radio, 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon
} from 'lucide-react';
import { DisasterScenario } from '../../types';

export type MainAppView = 
  | 'executive' 
  | 'map' 
  | 'satellite-ai' 
  | 'routing' 
  | 'analytics' 
  | 'sitrep' 
  | 'navigator' 
  | 'registry' 
  | 'alerts';

interface DashboardSidebarProps {
  activeView: MainAppView;
  onSelectView: (view: MainAppView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  scenario: DisasterScenario;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeView,
  onSelectView,
  collapsed,
  onToggleCollapse,
  scenario,
  theme,
  onToggleTheme,
}) => {
  const coreOperations = [
    {
      id: 'executive' as MainAppView,
      name: 'Executive Command',
      subtitle: 'Situational Overview',
      icon: ShieldAlert,
      badge: 'Home',
      badgeColor: 'bg-geo-accent/15 text-geo-accent border-geo-accent/30',
    },
    {
      id: 'map' as MainAppView,
      name: 'Tactical Disaster Map',
      subtitle: '100% GIS Canvas',
      icon: Map,
      badge: 'GIS Live',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'satellite-ai' as MainAppView,
      name: 'Satellite AI Damage',
      subtitle: 'Siamese Change Det',
      icon: Eye,
      badge: 'Bi-Temporal',
      badgeColor: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30',
    },
    {
      id: 'routing' as MainAppView,
      name: 'Emergency Route Planner',
      subtitle: 'NetworkX Safe Corridors',
      icon: Route,
      badge: 'Safest',
      badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'analytics' as MainAppView,
      name: 'Government Analytics',
      subtitle: 'Macro Trends & Shelters',
      icon: BarChart3,
      badge: 'Charts',
      badgeColor: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    },
    {
      id: 'sitrep' as MainAppView,
      name: 'Incidents & SITREP',
      subtitle: 'Audit Log & PDF Export',
      icon: FileText,
      badge: 'Report',
      badgeColor: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    },
  ];

  const fieldOperations = [
    {
      id: 'navigator' as MainAppView,
      name: 'Field Evacuation GPS',
      subtitle: 'Turn-by-turn guidance',
      icon: Compass,
      badge: 'Mobile UX',
    },
    {
      id: 'registry' as MainAppView,
      name: 'Damage Registry',
      subtitle: 'Searchable infrastructure',
      icon: ClipboardList,
      badge: `${scenario.stats.damagedStructuresCount}`,
    },
    {
      id: 'alerts' as MainAppView,
      name: 'Alert & Dispatch',
      subtitle: 'Geofenced broadcasts',
      icon: Radio,
      badge: 'CAP v1.2',
    },
  ];

  return (
    <aside
      className={`relative h-full flex flex-col border-r border-geo-border bg-geo-panel backdrop-blur-[16px] transition-all duration-300 select-none z-30 ${
        collapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-[52px] px-3 border-b border-geo-border flex items-center justify-between">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-geo-accent text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-geo-text-primary">GEO-RESQ</span>
                <span className="text-[9px] font-mono px-1 rounded bg-geo-surface-2 text-geo-text-tertiary border border-geo-border">
                  v0.3
                </span>
              </div>
              <div className="text-[10px] text-geo-text-tertiary truncate">Post-Disaster Intelligence</div>
            </div>
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-geo-accent text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Collapse Toggle Button */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className="w-6 h-6 rounded flex items-center justify-center text-geo-text-tertiary hover:text-geo-text-primary hover:bg-geo-surface-1 border border-transparent hover:border-geo-border transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Operational State Indicator */}
      {!collapsed && (
        <div className="mx-3 mt-3 p-2.5 rounded-md bg-geo-surface-1 border border-geo-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-semibold text-geo-text-primary">System Operational</span>
          </div>
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-bold">
            SIMULATION
          </span>
        </div>
      )}

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* Group 1: Core Operations */}
        <div>
          {!collapsed && (
            <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-geo-text-tertiary">
              Core Operations
            </div>
          )}
          <div className="space-y-1">
            {coreOperations.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  title={collapsed ? item.name : undefined}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-xs transition-colors text-left border ${
                    isActive
                      ? 'bg-geo-accent text-white font-semibold border-geo-accent shadow-xs'
                      : 'text-geo-text-secondary hover:text-geo-text-primary hover:bg-geo-surface-1 border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-geo-text-secondary'}`} />
                  {!collapsed && (
                    <div className="flex-1 truncate flex items-center justify-between">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white border-white/30 font-bold'
                              : item.badgeColor || 'bg-geo-surface-2 text-geo-text-tertiary border-geo-border'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Group 2: Field & Specialized Operations */}
        <div>
          {!collapsed && (
            <div className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-geo-text-tertiary">
              Field & Specialized
            </div>
          )}
          <div className="space-y-1">
            {fieldOperations.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  title={collapsed ? item.name : undefined}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-xs transition-colors text-left border ${
                    isActive
                      ? 'bg-geo-accent text-white font-semibold border-geo-accent shadow-xs'
                      : 'text-geo-text-secondary hover:text-geo-text-primary hover:bg-geo-surface-1 border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-geo-text-secondary'}`} />
                  {!collapsed && (
                    <div className="flex-1 truncate flex items-center justify-between">
                      <span className="truncate">{item.name}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white border-white/30 font-bold'
                              : 'bg-geo-surface-2 text-geo-text-tertiary border-geo-border'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar Footer: Theme Switcher & Simulation Provenance */}
      <div className="p-2 border-t border-geo-border space-y-1.5">
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Switch to Daylight Mode" : "Switch to Dark Mode"}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-2 rounded-md bg-geo-surface-1 hover:bg-geo-surface-2 border border-geo-border text-geo-text-secondary hover:text-geo-text-primary text-xs transition-colors"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              {!collapsed && <span className="text-[11px] font-medium">Daylight Mode</span>}
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-geo-accent" />
              {!collapsed && <span className="text-[11px] font-medium">Tactical Dark</span>}
            </>
          )}
        </button>

        {!collapsed && (
          <div className="text-[9px] font-mono text-center text-geo-text-tertiary px-1">
            GEO-RESQ Platform • UiTM / Huawei
          </div>
        )}
      </div>
    </aside>
  );
};
