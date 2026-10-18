import React from 'react';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { ProfileSettings } from '../components/profile/ProfileSettings';
import { AboutDemo } from '../components/common/AboutDemo';

export function ProfilePage() {
  return (
    <div className="min-h-screen flex bg-[#F4F7FB]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-[calc(var(--nav-h)+1rem)] md:pb-6">
        <Header />
        <ProfileSettings />
        <div className="mx-auto w-full max-w-2xl px-4 pb-6 md:px-6">
          <AboutDemo />
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
