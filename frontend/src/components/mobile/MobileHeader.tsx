import React from 'react';
import { 
  ShieldAlert, 
  Crosshair, 
  Sun, 
  Moon, 
  Menu
} from 'lucide-react';
import { DisasterScenario } from '../../types';

interface MobileHeaderProps {
  scenarios: DisasterScenario[];
  activeScenario: DisasterScenario;
  onSelectScenario: (scenario: DisasterScenario) => void;
  onLocateMe: () => void;
  isLocating?: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenMenuDrawer?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  scenarios,
  activeScenario,
  onSelectScenario,
  onLocateMe,
  isLocating,
  theme,
  onToggleTheme,
  onOpenMenuDrawer,
}) => {
  return (
    <header 
      className="md:hidden h-[50px] bg-geo-panel-header border-b border-geo-border px-3 flex items-center justify-between z-30 shadow-subtle-header select-none"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center gap-2">
        {onOpenMenuDrawer && (
          <button
            onClick={onOpenMenuDrawer}
            className="w-8 h-8 rounded flex items-center justify-center text-geo-text-secondary hover:bg-geo-surface-1"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded bg-geo-accent text-white flex items-center justify-center text-xs font-bold shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs tracking-tight text-geo-text-primary">GEO-RESQ</span>
          <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">
            SIM
          </span>
        </div>
      </div>

      {/* Scenario Dropdown */}
      <div className="flex-1 max-w-[170px] mx-2">
        <select
          value={activeScenario.id}
          onChange={(e) => {
            const selected = scenarios.find((s) => s.id === e.target.value);
            if (selected) onSelectScenario(selected);
          }}
          className="w-full text-[11px] font-medium bg-geo-surface-1 border border-geo-border rounded px-1.5 py-1 text-geo-text-primary truncate focus:outline-none"
        >
          {scenarios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        {/* GPS Locate Button */}
        <button
          onClick={onLocateMe}
          title="Locate my position on map"
          className="w-8 h-8 rounded flex items-center justify-center bg-geo-surface-1 border border-geo-border text-geo-accent active:scale-95 transition-transform"
        >
          <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          title="Toggle Light/Dark Theme"
          className="w-8 h-8 rounded flex items-center justify-center bg-geo-surface-1 border border-geo-border text-geo-text-secondary"
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-geo-accent" />
          )}
        </button>
      </div>
    </header>
  );
};
