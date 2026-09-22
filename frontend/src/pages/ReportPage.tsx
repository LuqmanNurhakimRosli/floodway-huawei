import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Video,
  Waves,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  ShieldAlert,
  Cpu,
  Layers,
  Award,
  Sparkles
} from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'public' | 'authority'>('public');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCctvModalOpen, setIsCctvModalOpen] = useState(false);

  const officialCount = reports.filter((r) => r.status === 'OFFICIAL_VERIFIED' || r.status === 'VERIFIED').length;
  const pendingCount = reports.filter((r) => r.status === 'AI_VERIFIED' || r.status === 'UNDER_REVIEW').length;
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
                <div className="flex items-center gap-2">
                  <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                    FloodWay 2.0
                  </h1>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Two-Layer Verification
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Layer 1: Huawei ModelArts / Gemini Multimodal AI · Layer 2: Civil Defense Authority Gazette
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCctvModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Video className="w-4 h-4 text-[#1677FF]" />
                <span>Live CCTV</span>
              </button>

              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-500/25 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>🚨 Report Flood Photo</span>
              </button>
            </div>
          </div>

          {/* Statistics Counter Bar (4 metrics) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
              <span className="font-heading font-extrabold text-2xl text-slate-900 block">{reports.length}</span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Submissions</span>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-center">
              <span className="font-heading font-extrabold text-2xl text-[#1677FF] block">
                {reports.filter((r) => r.status === 'AI_VERIFIED' || r.status === 'OFFICIAL_VERIFIED').length}
              </span>
              <span className="text-[11px] font-semibold text-blue-800 uppercase">Layer 1: AI Verified</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-center">
              <span className="font-heading font-extrabold text-2xl text-amber-700 block">{pendingCount}</span>
              <span className="text-[11px] font-semibold text-amber-800 uppercase">Pending Authority Gazette</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
              <span className="font-heading font-extrabold text-2xl text-emerald-700 block">{officialCount}</span>
              <span className="text-[11px] font-semibold text-emerald-800 uppercase">Layer 2: Dual Gazetted</span>
            </div>
          </div>

          {/* TWO-LAYER DESK SWITCHER BAR (Public Feed vs Authority Review Desk) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('public')}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'public'
                    ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>Public Official Feed ({officialCount})</span>
              </button>

              <button
                onClick={() => setViewMode('authority')}
                className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'authority'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'text-amber-800 hover:text-amber-950'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Authority Review Desk ({pendingCount} Pending)</span>
              </button>
            </div>

            {/* Filter Chips for Public View */}
            {viewMode === 'public' && (
              <div className="flex items-center gap-1 text-xs font-bold">
                {[
                  { id: 'all', label: `All (${reports.length})` },
                  { id: 'verified', label: `Official Only (${officialCount})` },
                  { id: 'active', label: `Flash Hazards (${activeCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id as any)}
                    className={`py-1.5 px-3 rounded-lg transition-colors cursor-pointer ${
                      filter === tab.id
                        ? 'bg-[#1677FF] text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Authority Desk Explanation Notice */}
          {viewMode === 'authority' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Civil Defense & NADMA Authority Review Queue</span>
                <span>
                  These incident photos have already passed <b>Layer 1 (AI Multimodal Vision)</b> with high confidence. As an authorized officer, inspect the ground evidence below and click <b>Approve & Gazette</b> to publish officially or <b>Reject</b> if inaccurate.
                </span>
              </div>
            </div>
          )}

          {/* Incident Reports Feed */}
          <ReportFeed filter={filter} viewMode={viewMode} />
        </main>

        <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
        <LiveCCTVModal isOpen={isCctvModalOpen} onClose={() => setIsCctvModalOpen(false)} />
        <BottomNav />
      </div>
    </div>
  );
}
