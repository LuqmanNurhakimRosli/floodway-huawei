import React from 'react';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { EmergencyAlertBanner } from '../components/layout/EmergencyAlertBanner';
import { EmergencyCommandBar } from '../components/dashboard/EmergencyCommandBar';
import { FloodRiskMiniMap } from '../components/dashboard/FloodRiskMiniMap';
import { NearestShelterCard } from '../components/dashboard/NearestShelterCard';
import { AiForecastChart } from '../components/dashboard/AiForecastChart';
import { FamilySafetyBanner } from '../components/dashboard/FamilySafetyBanner';
import { SystemStatusStrip } from '../components/dashboard/SystemStatusStrip';

export function HomePage() {
  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Collapsible Desktop Sidebar (260px expanded ↔ 76px compact rail) */}
      <DashboardSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        <Header />
        <EmergencyAlertBanner />

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Family Safety Notification Banner (shows if SOS active or safe arrival confirmed) */}
          <FamilySafetyBanner />

          {/* 1. Life-Safety Emergency Command Bar */}
          <EmergencyCommandBar />

          {/* 2. Middle Row: Geospatial Mini-Map & Nearest Safe Shelter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <FloodRiskMiniMap />
            </div>
            <div className="lg:col-span-5">
              <NearestShelterCard />
            </div>
          </div>

          {/* 3. Bottom Row: Huawei ModelArts AI Forecast Chart & Operational Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <AiForecastChart />
            </div>
            <div className="lg:col-span-4 flex flex-col justify-between gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#071426] to-[#0B1E38] text-white border border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block mb-1">
                  Community Sentinel
                </span>
                <h4 className="font-heading font-bold text-base text-white">4 Citizen Flood Reports</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Jalan Raja Muda Musa road spillover verified with 97.4% ModelArts CV confidence score.
                </p>
              </div>
              <SystemStatusStrip />
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
