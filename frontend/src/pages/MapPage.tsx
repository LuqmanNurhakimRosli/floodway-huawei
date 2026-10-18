import React from 'react';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { ShelterMapView } from '../components/map/ShelterMapView';

export function MapPage() {
  return (
    <div className="min-h-screen flex bg-[#F3F6F5]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-[var(--nav-h)] md:pb-0">
        <Header />
        <ShelterMapView />
        <BottomNav />
      </div>
    </div>
  );
}
