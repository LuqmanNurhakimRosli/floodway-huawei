import { useState } from 'react';
import { Plus, ShieldAlert, UserCheck } from 'lucide-react';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { countReports } from '../lib/reportStatus';
import { ReportFeed } from '../components/reports/ReportFeed';
import { ReportModal } from '../components/reports/ReportModal';
import { useApp } from '../contexts/AppContext';

export function ReportPage() {
  const { reports } = useApp();
  const [filter, setFilter] = useState<'all' | 'nearby' | 'verified' | 'active'>('all');
  const [viewMode, setViewMode] = useState<'public' | 'authority'>('public');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const counts = countReports(reports);
  const officialCount = counts.published;
  const pendingCount = counts.awaitingReview;
  const activeCount = reports.filter((r) => r.waterDepthCm >= 30).length;

  return (
    <div className="min-h-screen flex bg-[#F4F7FB]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-[calc(var(--nav-h)+1rem)] md:pb-6">
        <Header />

        <main className="flex-1 space-y-5 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 max-w-2xl">
              <h1 className="font-heading text-[28px]/9 font-extrabold tracking-tight text-slate-900 md:text-[32px]/10">Flood reports</h1>
              <p className="mt-1 text-sm/6 text-slate-600">
                Photos and water depth from people nearby. Unverified unless marked; the starter reports are demo examples, not real incidents.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsReportModalOpen(true)}
              className="flex min-h-12 items-center gap-2 rounded-full bg-[#DC2626] px-5 text-sm font-bold text-white shadow-md shadow-red-500/25 transition-[background-color,transform] duration-150 hover:bg-[#B91C1C] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Report a flood
            </button>
          </div>

          <dl className="grid grid-cols-3 gap-2 sm:max-w-lg">
            {[
              { label: 'Reports', value: counts.total, tone: 'text-slate-900' },
              { label: 'Published', value: officialCount, tone: 'text-emerald-700' },
              { label: 'Awaiting review', value: pendingCount, tone: 'text-amber-700' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-[0_8px_24px_-20px_rgba(7,20,38,0.5)]">
                <dt className="text-xs font-semibold text-slate-600">{s.label}</dt>
                <dd className={`font-heading text-2xl/8 font-extrabold tabular-nums ${s.tone}`}>{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {viewMode === 'public' ? (
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0" role="group" aria-label="Show">
                {[
                  { id: 'all', label: `All (${reports.length})` },
                  { id: 'verified', label: `Published (${officialCount})` },
                  { id: 'active', label: `Deep water (${activeCount})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={filter === tab.id}
                    onClick={() => setFilter(tab.id as typeof filter)}
                    className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] motion-reduce:transition-none ${
                      filter === tab.id ? 'border-[#0958D9] bg-[#0958D9] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm font-bold text-amber-900">Review desk (demo)</p>
            )}
            <button
              type="button"
              aria-pressed={viewMode === 'authority'}
              onClick={() => setViewMode(viewMode === 'public' ? 'authority' : 'public')}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]"
            >
              <UserCheck className="h-4 w-4" aria-hidden="true" />
              {viewMode === 'public' ? `Review desk (${pendingCount})` : 'Back to reports'}
            </button>
          </div>

          {/* Authority Desk Explanation Notice */}
          {viewMode === 'authority' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Review desk (demo screen)</span>
                <span>
                  This is a demo of how a review step could work. No agency uses it. Reports here are <b>unverified</b> until you press <b>Approve</b> or <b>Reject</b>; Approve only moves a report to the published list in this demo.
                </span>
              </div>
            </div>
          )}

          {/* Incident Reports Feed */}
          <ReportFeed filter={filter} viewMode={viewMode} />
        </main>

        <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
        <BottomNav />
      </div>
    </div>
  );
}
