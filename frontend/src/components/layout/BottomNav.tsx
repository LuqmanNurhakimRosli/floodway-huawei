import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, FileText, Box, User } from 'lucide-react';

export function BottomNav() {
  const tabs = [
    { label: 'Home', icon: LayoutDashboard, path: '/home' },
    { label: 'Map', icon: Map, path: '/map' },
    { label: 'Reports', icon: FileText, path: '/reports' },
    { label: '3D Twin', icon: Box, path: '/simulation' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 flex items-center justify-around z-40 shadow-lg">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 rounded-xl transition-all ${
              isActive
                ? 'text-[#1677FF] font-semibold scale-105'
                : 'text-slate-500 hover:text-slate-800'
            }`
          }
        >
          <tab.icon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
