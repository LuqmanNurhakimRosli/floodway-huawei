import React from 'react';
import { 
  ShieldAlert, 
  Map, 
  Compass, 
  ClipboardList, 
  AlertCircle
} from 'lucide-react';
import { MainAppView } from '../desktop/DashboardSidebar';

interface MobileNavBarProps {
  activeView: MainAppView;
  onSelectView: (view: MainAppView) => void;
  onTriggerSosModal: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeView,
  onSelectView,
  onTriggerSosModal,
}) => {
  const tabs = [
    {
      id: 'executive' as MainAppView,
      label: 'Home',
      icon: ShieldAlert,
    },
    {
      id: 'map' as MainAppView,
      label: 'GIS Map',
      icon: Map,
    },
    {
      id: 'navigator' as MainAppView,
      label: 'Evacuate',
      icon: Compass,
      highlight: true,
    },
    {
      id: 'registry' as MainAppView,
      label: 'Damage',
      icon: ClipboardList,
    },
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-geo-panel border-t border-geo-border z-40 flex items-center justify-around px-2 shadow-tactical select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectView(tab.id)}
            className={`flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 transition-colors rounded-lg ${
              isActive 
                ? 'text-geo-accent font-semibold' 
                : 'text-geo-text-secondary hover:text-geo-text-primary'
            }`}
          >
            <div className={`p-1 rounded-md ${isActive && tab.highlight ? 'bg-geo-accent/15' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] leading-none tracking-tight">{tab.label}</span>
          </button>
        );
      })}

      {/* SOS Button on Mobile Nav */}
      <button
        onClick={onTriggerSosModal}
        className="flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 text-rose-600 hover:text-rose-700 transition-colors font-semibold"
      >
        <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs active:scale-95 transition-transform">
          <AlertCircle className="w-4 h-4" />
        </div>
        <span className="text-[10px] leading-none tracking-tight font-bold">SOS</span>
      </button>
    </nav>
  );
};
