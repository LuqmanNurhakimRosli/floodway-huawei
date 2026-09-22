import React from 'react';
import { useParams } from 'react-router-dom';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { TurnByTurnEvacuation } from '../components/navigation/TurnByTurnEvacuation';

export function NavigationPage() {
  const { shelterId } = useParams<{ shelterId: string }>();

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header />
        <div className="flex-1 p-4 md:p-6">
          <TurnByTurnEvacuation shelterId={shelterId || 'shelter-01'} />
        </div>
        <BottomNav />
      </div>
    </div>
  );
}
