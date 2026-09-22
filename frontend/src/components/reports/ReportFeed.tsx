import React, { useState } from 'react';
import { CheckCircle2, ThumbsUp, MapPin, Clock, ShieldCheck, AlertTriangle, MessageSquare, Share2, Eye } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface Props {
  filter: 'all' | 'nearby' | 'verified' | 'active';
}

export function ReportFeed({ filter }: Props) {
  const { reports, upvoteReport } = useApp();

  const filteredReports = reports.filter((r) => {
    if (filter === 'verified') return r.status === 'VERIFIED';
    if (filter === 'active') return r.waterDepthCm >= 30;
    return true;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {filteredReports.map((report, idx) => {
        const isHighRisk = report.waterDepthCm >= 35;
        const confidence = 96 - (idx * 3);

        return (
          <article
            key={report.id}
            className={`rounded-3xl bg-white border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden flex flex-col justify-between ${
              isHighRisk ? 'border-red-300 ring-1 ring-red-400/20' : 'border-slate-200'
            }`}
          >
            <div>
              {/* Card Header: User row & Badge */}
              <div className="p-4 pb-3 flex items-start justify-between gap-2 border-b border-slate-100 bg-slate-50/50">
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

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                    report.status === 'VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {report.status}
                </span>
              </div>

              {/* Location & Category Bar */}
              <div className="px-4 py-2 bg-blue-50/40 border-b border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 truncate max-w-[70%]">
                  <MapPin className="w-3.5 h-3.5 text-[#1677FF] shrink-0" />
                  <span className="truncate font-semibold">{report.location}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                  {isHighRisk ? '🚨 Flash Flood' : '🌊 Rising Level'}
                </span>
              </div>

              {/* Report Body & Image */}
              <div className="p-4 space-y-3">
                <h3 className="font-heading font-extrabold text-sm text-slate-900 leading-snug">
                  {report.title}
                </h3>

                {report.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 relative group">
                    <img
                      src={report.imageUrl}
                      alt={report.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Image badging overlays */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wide shadow-md">
                        🌊 Flood Detected
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-slate-200 text-[10px] font-medium border border-white/20">
                        📷 Evidence
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-white font-bold">
                      <span>Water Depth: {report.waterDepthCm} cm</span>
                      <span className="text-emerald-400">GPS Acc: ±8m</span>
                    </div>
                  </div>
                )}

                {/* ModelArts AI Confidence Meter */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#1677FF]" />
                      ModelArts PanGu-CV
                    </span>
                    <span className="font-extrabold text-emerald-700">{confidence}% Match</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1677FF] to-emerald-500"
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Verified by Huawei ModelArts Ascend 910 NPU
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/40">
              <button
                onClick={() => upvoteReport(report.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-2xs transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5 text-[#1677FF]" />
                <span>{report.upvotes}</span>
              </button>

              <div className="flex items-center gap-1">
                <button className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors">
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
