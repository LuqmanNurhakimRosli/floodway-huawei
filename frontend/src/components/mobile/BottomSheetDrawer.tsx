import React, { useState } from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';

export type SnapPoint = 'peek' | 'half' | 'full';

interface BottomSheetDrawerProps {
  isOpen: boolean;
  onClose?: () => void;
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  initialSnap?: SnapPoint;
}

export const BottomSheetDrawer: React.FC<BottomSheetDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  initialSnap = 'half',
}) => {
  const [snap, setSnap] = useState<SnapPoint>(initialSnap);

  if (!isOpen) return null;

  const cycleSnap = () => {
    if (snap === 'peek') setSnap('half');
    else if (snap === 'half') setSnap('full');
    else setSnap('peek');
  };

  const getSnapHeightClass = () => {
    switch (snap) {
      case 'peek':
        return 'h-[92px]';
      case 'half':
        return 'h-[46vh]';
      case 'full':
        return 'h-[86vh]';
    }
  };

  return (
    <div
      className={`md:hidden fixed bottom-[60px] left-0 right-0 ${getSnapHeightClass()} bg-geo-panel border-t border-geo-border rounded-t-2xl shadow-tactical z-30 transition-all duration-300 flex flex-col overflow-hidden select-none`}
    >
      {/* Draggable Header / Handle */}
      <div 
        onClick={cycleSnap}
        className="pt-2.5 pb-2 px-4 cursor-pointer bg-geo-panel-header border-b border-geo-border flex flex-col items-center select-none"
      >
        {/* Visual Grab Handle */}
        <div className="w-10 h-1.5 rounded-full bg-geo-text-tertiary/40 mb-2" />

        <div className="w-full flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs text-geo-text-primary truncate">{title}</h3>
              {badge && (
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-geo-accent/15 text-geo-accent border border-geo-accent/30 uppercase">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[10px] text-geo-text-tertiary truncate mt-0.5">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                cycleSnap();
              }}
              className="p-1 text-geo-text-tertiary hover:text-geo-text-primary"
            >
              {snap === 'full' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            {onClose && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1 text-geo-text-tertiary hover:text-geo-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sheet Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
};
