import React from 'react';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { ProfileSettings } from '../components/profile/ProfileSettings';

export function ProfilePage() {
  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        <Header />
        <ProfileSettings />
        <BottomNav />
      </div>
    </div>
  );
}
