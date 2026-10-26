import { ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { StormNotice } from '../../../lib/stormScenario';
import { LEVEL_META } from '../../../lib/vision/levels';
import { notificationsSupported } from '../../../lib/vision/notify';
import { interactive } from '../shared/ui';

const SHOW_MS = 8000;

/** Demo notifications from the scripted storm: a stack of toasts (newest on top), plus a browser notification
 *  when the viewer allowed them. Every toast says DEMO. */
export function StormNotices({ notices }: { notices: StormNotice[] }) {
  const [visible, setVisible] = useState<StormNotice[]>([]);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (notices.length === 0) seen.current.clear();
    const fresh = notices.filter((n) => !seen.current.has(n.id));
    if (fresh.length === 0) return;
    fresh.forEach((n) => {
      seen.current.add(n.id);
      if (notificationsSupported() && Notification.permission === 'granted') {
        try {
          new Notification(`FloodWay DEMO: ${n.title}`, { body: n.body, tag: n.id });
        } catch {
          /* some mobile browsers only allow notifications through a service worker */
        }
      }
    });
    setVisible((v) => [...fresh.reverse(), ...v].slice(0, 3));
  }, [notices]);

  useEffect(() => {
    if (visible.length === 0) return;
    const t = setTimeout(() => setVisible((v) => v.slice(0, -1)), SHOW_MS);
    return () => clearTimeout(t);
  }, [visible]);

  if (visible.length === 0) return null;
  return (
    // Phones: the newest one only, just above the bottom action bar, so it never hides the ring or the camera alert
    // toast at the top. Wider: a stack of three under the header, top right.
    <div aria-live="polite" className="fixed inset-x-3 bottom-[calc(var(--nav-h)+5rem)] z-50 flex flex-col gap-2 [&>*:not(:first-child)]:hidden sm:bottom-auto sm:left-auto sm:right-6 sm:top-20 sm:w-[380px] sm:[&>*]:flex">
      {visible.map((n) => {
        const meta = LEVEL_META[n.level];
        const Icon = meta.icon;
        return (
          <div key={n.id} role={n.level === 'DANGER' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-2xl border bg-white p-3 shadow-lg shadow-slate-900/15 motion-safe:animate-[live-toast-in_220ms_ease-out] ${meta.border}`}>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.solid}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm/5 font-semibold text-slate-900">
                <span className="rounded border border-slate-300 bg-slate-100 px-1 text-xs/4 font-bold tracking-wide text-slate-700">DEMO</span>
                <span className="truncate">{n.title}</span>
              </p>
              <p className="mt-0.5 text-sm/5 text-slate-600">{n.body}</p>
              {n.level === 'DANGER' && (
                <Link to="/map" className={`mt-1 inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-[#0958D9] ${interactive}`}>
                  Open routes <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
            <button type="button" onClick={() => setVisible((v) => v.filter((x) => x.id !== n.id))} aria-label="Dismiss notification" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 ${interactive}`}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
