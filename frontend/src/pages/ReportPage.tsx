import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Video, Waves, ShieldCheck, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { ReportFeed } from '../components/reports/ReportFeed';
import { ReportModal } from '../components/reports/ReportModal';
import { LiveCCTVModal } from '../components/reports/LiveCCTVModal';
import { useApp } from '../contexts/AppContext';

export function ReportPage() {
  const navigate = useNavigate();
  const { reports } = useApp();
  const [filter, setFilter] = useState<'all' | 'nearby' | 'verified' | 'active'>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCctvModalOpen, setIsCctvModalOpen] = useState(false);

  const verifiedCount = reports.filter((r) => r.status === 'VERIFIED').length;
  const activeCount = reports.filter((r) => r.waterDepthCm >= 30).length;

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        <Header />

        <main className="flex-1 p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Top Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1677FF] to-[#0958D9] flex items-center justify-center text-white shadow-lg shadow-blue-500/25 shrink-0">
                <Waves className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight flex items-center gap-2">
                  FloodWay 2.0
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-[#1677FF]">
                    Community Sentinel
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Citizen Flood Intelligence · Verified by Huawei ModelArts PanGu-CV & Ascend AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCctvModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Video className="w-4 h-4 text-[#1677FF]" />
                <span>Live CCTV</span>
              </button>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-500/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>🚨 Report Flood</span>
              </button>
            </div>
          </div>

          {/* Live Statistics Counter Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="font-heading font-extrabold text-2xl text-slate-900 block">{reports.length}</span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Reports</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <span className="font-heading font-extrabold text-2xl text-emerald-700 block">{verifiedCount}</span>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase">ModelArts Verified</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <span className="font-heading font-extrabold text-2xl text-amber-700 block">1</span>
              <span className="text-[11px] font-semibold text-amber-800 uppercase">Under Review</span>
            </div>
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-center">
              <span className="font-heading font-extrabold text-2xl text-red-700 block">{activeCount}</span>
              <span className="text-[11px] font-semibold text-red-800 uppercase">Active Hazards</span>
            </div>
          </div>

          {/* Segmented Filter Control Tabs */}
          <div className="flex p-1 bg-slate-200/80 rounded-2xl max-w-lg mx-auto text-xs font-bold">
            {[
              { id: 'all', label: `All (${reports.length})` },
              { id: 'nearby', label: 'Nearby (<25km)' },
              { id: 'verified', label: `Verified (${verifiedCount})` },
              { id: 'active', label: `High Risk (${activeCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`flex-1 py-2 px-3 rounded-xl transition-all ${
                  filter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 3-Column Responsive Grid Feed */}
          <ReportFeed filter={filter} />
        </main>

        <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
        <LiveCCTVModal isOpen={isCctvModalOpen} onClose={() => setIsCctvModalOpen(false)} />
        <BottomNav />
      </div>
    </div>
  );
}
