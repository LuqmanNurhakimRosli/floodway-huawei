import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  FileText,
  Box,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Waves,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { label: 'Home', icon: LayoutDashboard, path: '/home' },
    { label: 'Map', icon: Map, path: '/map' },
    { label: 'Reports', icon: FileText, path: '/reports' },
    { label: '3D Twin', icon: Box, path: '/simulation' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#071426] text-white border-r border-[#1E293B] transition-all duration-300 select-none z-30 shrink-0 ${
        isCollapsed ? 'w-[76px]' : 'w-[260px]'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E293B]/70">
        <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0958D9] flex items-center justify-center shadow-lg shadow-[#1677FF]/30 shrink-0">
            <Waves className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-heading font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                FloodWay <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[#1677FF]/20 text-[#60A5FA] border border-[#1677FF]/40">2.0</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Huawei ICT 2026</span>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center py-2 border-b border-[#1E293B]/40">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-[#1677FF] text-white shadow-md shadow-[#1677FF]/20 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`
            }
          >
            <item.icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110`} />
            {!isCollapsed && <span>{item.label}</span>}
            {isCollapsed && (
              <div className="absolute left-[78px] px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs font-medium whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-xl border border-slate-700">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Huawei Cloud Sustainability Footer */}
      {!isCollapsed && (
        <div className="p-4 m-3 rounded-xl bg-gradient-to-b from-slate-900 to-[#0B1E38] border border-slate-800/80">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-200">Huawei ModelArts</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Safer Communities, Stronger Tomorrow. Powered by Ascend AI & IoTDA.
          </p>
        </div>
      )}
    </aside>
  );
}
