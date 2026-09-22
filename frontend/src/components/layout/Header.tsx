import React, { useState } from 'react';
import { MapPin, Bell, Radio, ChevronDown, CheckCircle2, User as UserIcon } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { IoTHeaderPopover } from '../dashboard/IoTHeaderPopover';

export function Header() {
  const { selectedLocation, setSelectedLocation } = useApp();
  const { user } = useAuth();
  const [showLocationMenu, setShowLocationMenu] = useState(false);

  const locations = [
    'Kampung Baru, Kuala Lumpur',
    'Taman Sri Muda, Shah Alam',
    'Jalan Kuching, Segambut',
    'Pantai Dalam, Kuala Lumpur'
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Location Selector & Telemetry Pill */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowLocationMenu(!showLocationMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 transition-colors text-xs md:text-sm font-semibold text-slate-800 border border-slate-200"
          >
            <MapPin className="w-3.5 h-3.5 text-[#1677FF] shrink-0" />
            <span className="truncate max-w-[160px] md:max-w-[240px]">{selectedLocation}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {showLocationMenu && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400 border-b border-slate-100">
                Monitored River Basins
              </div>
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    setSelectedLocation(loc);
                    setShowLocationMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    selectedLocation === loc ? 'text-[#1677FF] font-semibold bg-blue-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{loc}</span>
                  {selectedLocation === loc && <CheckCircle2 className="w-3.5 h-3.5 text-[#1677FF]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Live operational badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Live Telemetry · 14 Sensors Active</span>
        </div>
      </div>

      {/* Right Actions: Compact IoT Header Button, Notifications & Profile Avatar */}
      <div className="flex items-center gap-2.5">
        <IoTHeaderPopover />

        <button className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-600 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0958D9] flex items-center justify-center text-white text-xs font-bold shadow-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'LN'}
          </div>
          <div className="hidden xl:flex flex-col">
            <span className="text-xs font-semibold text-slate-800 leading-tight">{user?.name || 'Luqman Nurhakim'}</span>
            <span className="text-[10px] text-slate-400 font-medium">Citizen Responder</span>
          </div>
        </div>
      </div>
    </header>
  );
}
