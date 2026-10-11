import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { countReports } from '../../lib/reportStatus';
import { card, cardPad, cardTitle, interactive, num } from '../../styles/tokens';

/** Citizen reports at a glance, from the same status model as the Reports page, so the numbers always agree. */
export function ReportsSummary() {
  const { reports } = useApp();
  const c = countReports(reports);
  return (
    <section className={`${card} ${cardPad}`} aria-labelledby="reports-sum-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="reports-sum-title" className={`${cardTitle} flex items-center gap-2`}>
          <FileText className="h-5 w-5 text-slate-600" aria-hidden="true" /> Citizen reports
        </h2>
        <Link to="/reports" className={`inline-flex min-h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-[#0958D9] hover:bg-blue-50 ${interactive}`}>
          Open <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      {c.total === 0 ? (
        <p className="mt-2 text-sm/5 text-slate-700">No reports yet. If you see flooding, report it with a photo.</p>
      ) : (
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[['Total', c.total], ['Published (demo)', c.published], ['Awaiting review', c.awaitingReview]].map(([k, v]) => (
            <div key={k as string} className="rounded-xl bg-slate-50 p-2.5">
              <dd className={`${num} font-heading text-2xl/8 font-bold text-slate-900`}>{v}</dd>
              <dt className="text-xs/4 text-slate-700">{k}</dt>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-3 text-xs/4 text-slate-700">Demo data and unverified citizen submissions. Nothing is checked by an agency.</p>
    </section>
  );
}
