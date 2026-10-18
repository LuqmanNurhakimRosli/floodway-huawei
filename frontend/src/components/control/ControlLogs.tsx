import { Activity, History, Timer } from 'lucide-react';
import { clockTime } from '../../lib/vision/format';
import { formatSeconds, type SensorHealthRow } from '../../lib/vision/stormLab';
import type { BarrierEvent, LeadTimeEntry } from '../../types/vision';
import { StatusChip } from '../live/shared/StatusChip';
import { card, cardPad, cardTitle, num } from '../../styles/tokens';

export function BarrierLog({ events }: { events: BarrierEvent[] }) {
  return (
    <section className={`${card} ${cardPad}`} aria-labelledby="blog-title">
      <h2 id="blog-title" className={`${cardTitle} flex items-center gap-2`}>
        <History className="h-5 w-5 text-slate-600" aria-hidden="true" /> Barrier log
      </h2>
      {events.length === 0 ? (
        <p className="mt-2 text-sm/5 text-slate-600">No barrier has changed yet. A closure appears here the moment its camera or depth node reaches DANGER.</p>
      ) : (
        <ol className="mt-3 space-y-2">
          {events.slice(0, 12).map((e) => (
            <li key={e.id} className="flex gap-3 rounded-xl border border-slate-200 p-2.5">
              <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${e.state === 'CLOSED' ? 'bg-red-600' : 'bg-emerald-600'}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm/5">
                  <span className="font-semibold text-slate-900">
                    {e.barrier_id} {e.cause === 'resume' ? 'back to automatic' : e.state === 'CLOSED' ? 'closed' : 'opened'}
                    <span className="font-normal text-slate-600"> · {e.cause === 'auto' ? 'automatic' : 'operator'}</span>
                  </span>
                  <span className={`${num} text-xs/4 text-slate-600`}>{clockTime(e.timestamp)}</span>
                </p>
                <p className="text-xs/4 text-slate-700">{e.reason}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function LeadTimeLog({ entries, available }: { entries: LeadTimeEntry[]; available: boolean }) {
  return (
    <section className={`${card} ${cardPad} @container/lead min-w-0`} aria-labelledby="lead-title">
      <h2 id="lead-title" className={`${cardTitle} flex items-center gap-2`}>
        <Timer className="h-5 w-5 text-slate-600" aria-hidden="true" /> Live alert timing
      </h2>
      <p className="mt-0.5 text-sm/5 text-slate-600">For each live alert: when a reading first crossed the line, and how long the level rules took to confirm it.</p>
      {!available ? (
        <p className="mt-2 text-sm/5 text-slate-600">Needs the server. The sample data on this page does not log timing.</p>
      ) : entries.length === 0 ? (
        <p className="mt-2 text-sm/5 text-slate-600">No live alert yet. The Klang sample camera reaches WARNING within a few minutes of the server starting.</p>
      ) : (
        <>
        {/* Narrow cards: one row per alert, no sideways scrolling */}
        <ul className="mt-3 space-y-2 @min-[480px]/lead:hidden">
          {entries.slice(0, 10).map((e) => (
            <li key={`${e.camera_id}-${e.alerted_at}-${e.level}`} className="rounded-xl border border-slate-200 p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm/5 font-semibold text-slate-900">{e.camera_name}</span>
                <StatusChip level={e.level} />
              </div>
              <p className="mt-1 text-xs/4 text-slate-700">
                Crossed <span className={num}>{clockTime(e.crossed_at)}</span> · alerted <span className={num}>{clockTime(e.alerted_at)}</span> ·{' '}
                <span className={`${num} font-bold text-slate-900`}>{formatSeconds(e.detection_delay_s)}</span>
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-3 hidden overflow-x-auto @min-[480px]/lead:block">
          <table className="w-full min-w-[440px] text-left text-xs/4">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600">
                <th scope="col" className="py-2 pr-3 font-medium">Camera</th>
                <th scope="col" className="py-2 pr-3 font-medium">Level</th>
                <th scope="col" className="py-2 pr-3 font-medium">First crossed</th>
                <th scope="col" className="py-2 pr-3 font-medium">Alerted</th>
                <th scope="col" className="py-2 font-medium">Delay</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, 10).map((e) => (
                <tr key={`${e.camera_id}-${e.alerted_at}-${e.level}`} className="border-b border-slate-100 last:border-0">
                  <td className="max-w-[160px] truncate py-2 pr-3 font-semibold text-slate-900" title={e.camera_name}>{e.camera_name}</td>
                  <td className="py-2 pr-3"><StatusChip level={e.level} /></td>
                  <td className={`${num} py-2 pr-3 text-slate-700`}>{clockTime(e.crossed_at)}</td>
                  <td className={`${num} py-2 pr-3 text-slate-700`}>{clockTime(e.alerted_at)}</td>
                  <td className={`${num} py-2 font-bold text-slate-900`}>{formatSeconds(e.detection_delay_s)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}

export function SensorHealth({ rows }: { rows: SensorHealthRow[] }) {
  const flagged = rows.filter((r) => r.held > 0).length;
  return (
    <section className={`${card} ${cardPad}`} aria-labelledby="health-title">
      <h2 id="health-title" className={`${cardTitle} flex items-center gap-2`}>
        <Activity className="h-5 w-5 text-slate-600" aria-hidden="true" /> Sensor fault filter
      </h2>
      <p className="mt-0.5 text-sm/5 text-slate-600">
        A reading that jumps further than water can rise between two cycles is held until the next reading agrees. {flagged === 0 ? 'Nothing held in the recent readings.' : `${flagged} camera${flagged === 1 ? '' : 's'} had readings held recently.`}
      </p>
      <ul className="mt-3 divide-y divide-slate-100">
        {rows.map((r) => (
          <li key={r.cameraId} className="flex items-start justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm/5 font-semibold text-slate-900">{r.name}</p>
              {r.lastFault && <p className="text-xs/4 text-slate-600">Last held <span className={num}>{r.lastFaultAt ? clockTime(r.lastFaultAt) : ''}</span>: {r.lastFault}</p>}
            </div>
            <span className={`${num} shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${r.held > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>
              {r.held} / {r.total}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
