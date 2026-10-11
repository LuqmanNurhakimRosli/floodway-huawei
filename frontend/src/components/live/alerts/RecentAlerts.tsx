import { Bell, BellRing, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { timeAgo } from '../../../lib/vision/format';
import { LEVEL_META } from '../../../lib/vision/levels';
import { notificationPermission, requestNotificationPermission } from '../../../lib/vision/notify';
import type { AlertEvent } from '../../../types/vision';
import { card, focusRing, heading } from '../shared/ui';

export function RecentAlerts({ alerts }: { alerts: AlertEvent[] }) {
  const [all, setAll] = useState(false);
  const [permission, setPermission] = useState(notificationPermission());
  const shown = all ? alerts.slice(0, 10) : alerts.slice(0, 2);

  return (
    <section className={`${card} p-4`}>
      <div className="flex items-center justify-between">
        <h3 className={`${heading} flex items-center gap-2 text-base`}>
          <Bell className="h-5 w-5 text-slate-600" aria-hidden="true" /> Recent alerts
        </h3>
        {alerts.length > 2 && (
          <button type="button" onClick={() => setAll(!all)} className={`inline-flex min-h-9 items-center gap-0.5 rounded-lg px-2 text-sm font-bold text-[#0958D9] ${focusRing}`}>
            {all ? 'Show less' : 'View all'}
            <ChevronRight className={`h-4 w-4 ${all ? 'rotate-90' : ''}`} aria-hidden="true" />
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">No alerts yet. Warning and danger events will appear here.</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-100">
          {shown.map((a) => {
            const meta = LEVEL_META[a.level];
            const Icon = meta.icon;
            return (
              <li key={a.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.solid}`}>
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className={`font-extrabold ${meta.text}`}>{meta.label.toUpperCase()}</span>
                    <span className="text-slate-600"> · {timeAgo(a.timestamp)}</span>
                  </p>
                  <p className="truncate text-sm font-semibold text-slate-900">{a.camera_name}</p>
                  <p className="text-sm text-slate-600">Water level reached {Math.round(a.water_ratio * 100)}% of bank.</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {permission === 'default' && (
        <button
          type="button"
          onClick={async () => setPermission(await requestNotificationPermission())}
          className={`mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-800 hover:bg-slate-50 ${focusRing}`}
        >
          <BellRing className="h-4 w-4" aria-hidden="true" /> Enable phone notifications
        </button>
      )}
      {permission === 'denied' && <p className="mt-3 text-xs text-slate-600">Notifications are blocked in this browser. Allow them in site settings to get alerts.</p>}
    </section>
  );
}
