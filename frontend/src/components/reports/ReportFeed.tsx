import React from 'react';
import {
  CheckCircle2,
  ThumbsUp,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  Share2,
  Send
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { CitizenReport } from '../../types';

interface Props {
  filter: 'all' | 'nearby' | 'verified' | 'active';
  viewMode?: 'public' | 'authority';
}

export function ReportFeed({ filter, viewMode = 'public' }: Props) {
  const { reports, upvoteReport, approveReport, rejectReport } = useApp();

  const filteredReports = reports.filter((r) => {
    if (viewMode === 'authority') {
      return r.status === 'AI_VERIFIED' || r.status === 'UNDER_REVIEW';
    }
    if (r.status === 'REJECTED') return false;
    if (filter === 'verified') return r.status === 'OFFICIAL_VERIFIED' || r.status === 'VERIFIED';
    if (filter === 'active') return r.waterDepthCm >= 30;
    return true;
  });

  if (filteredReports.length === 0) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-xl mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="font-heading font-extrabold text-base text-slate-800">
          {viewMode === 'authority'
            ? 'All Submitted Reports Fully Processed'
            : 'No Incident Reports in this Category'}
        </h3>
        <p className="text-xs text-slate-500">
          {viewMode === 'authority'
            ? 'There are no pending citizen reports awaiting verification.'
            : 'Stay alert. Submit a photo report if you observe rising flood water.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {filteredReports.map((report) => {
        const isOfficial = report.status === 'OFFICIAL_VERIFIED';
        const isAiVerified = report.status === 'AI_VERIFIED';
        const isHighRisk = report.waterDepthCm >= 35;

        // Simplify location string to short readable name
        const shortLocation = report.location.split(',')[0].trim();

        return (
          <article
            key={report.id}
            className={`rounded-3xl bg-white border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col justify-between ${
              isOfficial
                ? 'border-emerald-300 ring-2 ring-emerald-500/15 shadow-sm'
                : isAiVerified
                ? 'border-blue-300 ring-2 ring-blue-500/10'
                : 'border-slate-200'
            }`}
          >
            <div>
              {/* Card Header: Author info & Verification Badges */}
              <div className="p-4 pb-3 flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1677FF] to-[#0958D9] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    {report.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-heading font-bold text-xs text-slate-900 block leading-tight">
                      {report.author}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {report.timestampStr}
                    </span>
                  </div>
                </div>

                {/* Status Pill */}
                {isOfficial ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>VERIFIED</span>
                  </span>
                ) : isAiVerified ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-[#1677FF]" />
                    <span>AI SCREENED</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span>PENDING</span>
                  </span>
                )}
              </div>

              {/* Location Bar with Clear Icon */}
              <div className="px-4 py-2 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#1677FF] shrink-0" />
                  <span className="truncate">{shortLocation}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  isHighRisk ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {report.waterDepthCm} cm
                </span>
              </div>

              {/* Photo */}
              {report.imageUrl && (
                <div className="overflow-hidden bg-slate-950 relative group">
                  <img
                    src={report.imageUrl}
                    alt={report.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
              )}

              {/* Content Headline */}
              <div className="p-4 space-y-3">
                <h3 className="font-heading font-extrabold text-sm text-slate-900 leading-snug">
                  {report.title}
                </h3>

                {/* EXACT MAXIMUM 3 FACTOR CHIPS (Clean & Readable) */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Water Depth</span>
                    <span className="font-mono text-xs font-bold text-slate-900">{report.waterDepthCm} cm</span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Road Risk</span>
                    <span className={`text-[11px] font-bold ${isHighRisk ? 'text-red-600' : 'text-amber-600'}`}>
                      {isHighRisk ? 'Submerged' : 'Cautious'}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <span className="text-[10px] font-semibold text-slate-400 block uppercase">Verification</span>
                    <span className="text-[11px] font-bold text-emerald-600">
                      {isOfficial ? 'Confirmed' : 'AI Verified'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
              {viewMode === 'authority' && !report.humanVerification ? (
                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={() => approveReport(report.id, 'Duty Operations Officer', 'Emergency Operations')}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Publish to Live Feed</span>
                  </button>
                  <button
                    onClick={() => rejectReport(report.id, 'Insufficient water depth evidence')}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => upvoteReport(report.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1677FF] transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{report.upvotes} Confirmations</span>
                  </button>

                  <div className="flex items-center gap-2 text-slate-400">
                    <button className="p-1 rounded-lg hover:bg-slate-100 hover:text-slate-600 cursor-pointer" title="Share Alert">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
