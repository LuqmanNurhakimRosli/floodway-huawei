import React from 'react';
import { CheckCircle2, ThumbsUp, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export function ReportFeed() {
  const { reports, upvoteReport } = useApp();

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div key={report.id} className="p-4 md:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-800">{report.author}</span>
                <span className="text-[11px] text-slate-400">· {report.timestampStr}</span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {report.status}
                </span>
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900 mt-1">{report.title}</h3>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-red-50 text-red-700 font-extrabold text-xs border border-red-200 shrink-0">
              {report.waterDepthCm} cm Depth
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
            <MapPin className="w-3.5 h-3.5 text-[#1677FF]" />
            <span>{report.location}</span>
          </div>

          {report.imageUrl && (
            <div className="mb-3 rounded-xl overflow-hidden border border-slate-200 max-h-64 bg-slate-900">
              <img src={report.imageUrl} alt={report.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1677FF]" />
              <span>{report.verifiedBy}</span>
            </div>

            <button
              onClick={() => upvoteReport(report.id)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{report.upvotes}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
