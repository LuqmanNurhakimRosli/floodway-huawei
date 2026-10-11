import React from 'react';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { ProfileSettings } from '../components/profile/ProfileSettings';
import { AboutDemo } from '../components/common/AboutDemo';

export function ProfilePage() {
  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        <Header />
        <ProfileSettings />
        <div className="mx-auto w-full max-w-7xl px-4 pb-6 md:px-6 lg:px-8">
          <AboutDemo />
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
