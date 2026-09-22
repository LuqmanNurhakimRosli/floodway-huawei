import React, { useState } from 'react';
import { Plus, Camera, Video, Waves } from 'lucide-react';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { ReportFeed } from '../components/reports/ReportFeed';
import { ReportModal } from '../components/reports/ReportModal';
import { LiveCCTVModal } from '../components/reports/LiveCCTVModal';

export function ReportPage() {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCctvModalOpen, setIsCctvModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        <Header />

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-5xl w-full mx-auto">
          {/* Unified FloodWay 2.0 Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1677FF] to-[#0958D9] flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
                <Waves className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight flex items-center gap-2">
                  FloodWay 2.0
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-[#1677FF]">
                    Sentinel
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Community Sentinel · Powered by Huawei ModelArts & Ascend AI Vision
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCctvModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Video className="w-4 h-4 text-[#1677FF]" />
                <span>CCTV Feeds</span>
              </button>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-[#1677FF] hover:bg-[#0958D9] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-transform hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Report Flood</span>
              </button>
            </div>
          </div>

          {/* Reports Feed */}
          <ReportFeed />
        </main>

        <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
        <LiveCCTVModal isOpen={isCctvModalOpen} onClose={() => setIsCctvModalOpen(false)} />
        <BottomNav />
      </div>
    </div>
  );
}
