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
  Cpu,
  UserCheck,
  Award,
  Sparkles,
  AlertOctagon
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
    // Public view: show OFFICIAL_VERIFIED, AI_VERIFIED, and legacy VERIFIED
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
            ? 'All Submitted Reports Fully Gazetted!'
            : 'No Incident Reports in this Category'}
        </h3>
        <p className="text-xs text-slate-500">
          {viewMode === 'authority'
            ? 'There are no pending citizen reports awaiting civil defense approval. All records are up to date.'
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

        return (
          <article
            key={report.id}
            className={`rounded-3xl bg-white border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col justify-between ${
              isOfficial
                ? 'border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
                : isAiVerified
                ? 'border-blue-300 ring-2 ring-blue-500/15'
                : 'border-slate-200'
            }`}
          >
            <div>
              {/* Card Header: Author info & Verification Badges */}
              <div className="p-4 pb-3 flex items-start justify-between gap-2 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#1677FF] to-[#0958D9] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    {report.author.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-heading font-bold text-xs text-slate-900 block leading-tight">
                      {report.author}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      @{report.author.toLowerCase().replace(/\s+/g, '_')} · {report.timestampStr}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                {isOfficial ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center gap-1 shadow-xs">
                    <Award className="w-3 h-3 text-amber-300" />
                    <span>OFFICIAL VERIFIED</span>
                  </span>
                ) : isAiVerified ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide bg-blue-100 text-blue-800 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-[#1677FF]" />
                    <span>AI VERIFIED</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>UNDER REVIEW</span>
                  </span>
                )}
              </div>

              {/* Location & Hazard Banner */}
              <div className="px-4 py-2 bg-blue-50/40 border-b border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-700 truncate max-w-[70%]">
                  <MapPin className="w-3.5 h-3.5 text-[#1677FF] shrink-0" />
                  <span className="truncate font-semibold">{report.location}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                  {isHighRisk ? '🚨 Flash Flood' : '🌊 Rising Water'}
                </span>
              </div>

              {/* Body Content */}
              <div className="p-4 space-y-3">
                <h3 className="font-heading font-extrabold text-sm text-slate-900 leading-snug">
                  {report.title}
                </h3>

                {report.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>
                )}

                {/* Image Preview */}
                {report.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 relative group">
                    <img
                      src={report.imageUrl}
                      alt={report.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wide shadow-md">
                        🌊 Flood Detected
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white font-bold">
                      <span>Water Depth: {report.waterDepthCm} cm</span>
                      <span className="text-emerald-400">GPS Acc: ±8m</span>
                    </div>
                  </div>
                )}

                {/* TWO-LAYER VERIFICATION BREAKDOWN CARD */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  {/* Layer 1: AI Verification Evidence */}
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-md bg-blue-100 text-[#1677FF] flex items-center justify-center shrink-0 mt-0.5">
                      <Cpu className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-[11px]">Layer 1: Multimodal AI</span>
                        <span className="font-extrabold text-blue-600 text-[10px]">
                          {Math.round((report.aiVerification?.confidenceScore || 0.974) * 100)}% Match
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        {report.aiVerification?.engine || 'Huawei ModelArts PanGu-CV'}
                      </p>
                      {report.aiVerification?.detectedHazards && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {report.aiVerification.detectedHazards.map((h, i) => (
                            <span key={i} className="px-1.5 py-0.2 rounded bg-blue-50 border border-blue-200 text-[9px] text-blue-700 font-semibold">
                              {h}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Layer 2: Human Authority Gazette */}
                  {report.humanVerification ? (
                    <div className="pt-2 border-t border-slate-200/80 flex items-start gap-2">
                      <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-800 text-[11px]">Layer 2: Authority Gazetted</span>
                          <span className="font-extrabold text-emerald-600 text-[10px]">APPROVED</span>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-tight mt-0.5">
                          Verified by <b>{report.humanVerification.verifiedBy}</b> ({report.humanVerification.role})
                        </p>
                        {report.humanVerification.officialNotes && (
                          <p className="text-[10px] text-slate-500 italic mt-0.5">
                            "{report.humanVerification.officialNotes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-1.5 border-t border-slate-200/80 text-[10px] text-amber-700 flex items-center gap-1 font-semibold">
                      <Clock className="w-3 h-3" />
                      <span>Layer 2: Pending Civil Defense Authority Gazette</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer: Actions */}
            <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
              {viewMode === 'authority' && !report.humanVerification ? (
                /* Authority Review Action Buttons */
                <div className="flex items-center gap-2 w-full">
                  <button
                    onClick={() => approveReport(report.id, 'Captain Roslan (APM)', 'Civil Defense Officer')}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Gazette</span>
                  </button>
                  <button
                    onClick={() => rejectReport(report.id, 'Inconclusive flood evidence on ground survey')}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                /* Public Engagement Buttons */
                <>
                  <button
                    onClick={() => upvoteReport(report.id)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1677FF] transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{report.upvotes} Confirmations</span>
                  </button>

                  <div className="flex items-center gap-2 text-slate-400">
                    <button className="p-1 rounded-lg hover:bg-slate-100 hover:text-slate-600 cursor-pointer" title="Comments">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
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
