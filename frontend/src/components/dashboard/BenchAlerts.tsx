import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useBenchSensor } from '../../hooks/useBenchSensor';
import { useHeaderPanel } from '../../hooks/useHeaderPanel';
import { LEVEL_META } from '../../lib/vision/levels';
import type { BenchEvent } from '../../services/benchSensorStore';

const SHOW_MS = 6000;

/** A toast for each new IoT node alert (the store decides which level changes count, see benchAlertFor). Hidden
 *  while a header dropdown is open; bottom right on laptops so it never sits where the dropdowns open. */
export function BenchAlerts() {
  const { events } = useBenchSensor();
  const panel = useHeaderPanel();
  const [toast, setToast] = useState<BenchEvent | null>(null);
  const lastId = useRef(events[0]?.id ?? 0);

  useEffect(() => {
    const newest = events[0];
    if (!newest || newest.id === lastId.current) return;
    lastId.current = newest.id;
    setToast(newest);
    if (newest.level !== 'NORMAL' && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`FloodWay ${newest.level}`, { body: newest.body, tag: 'floodway-iot-node' });
      } catch {
        /* some browsers only allow notifications through a service worker */
      }
    }
  }, [events]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), SHOW_MS);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast || panel) return null;
  const meta = LEVEL_META[toast.level];
  const Icon = meta.icon;
  return (
    <div aria-live="polite" className="fixed inset-x-3 bottom-[calc(var(--nav-h,0px)+5rem)] z-50 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[340px]">
      <div key={toast.id} role={toast.level === 'DANGER' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-2xl border bg-white p-3 shadow-lg shadow-slate-900/15 motion-safe:animate-[live-toast-in_220ms_ease-out] ${meta.border}`}>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.solid}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm/5 font-semibold text-slate-900">
            <span className="rounded border border-emerald-300 bg-emerald-50 px-1 text-xs/4 font-bold tracking-wide text-emerald-800">LIVE</span>
            <span className="truncate">{toast.title}</span>
          </p>
          <p className="mt-0.5 text-sm/5 text-slate-600">{toast.body}</p>
        </div>
        <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
