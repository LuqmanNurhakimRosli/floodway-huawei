import { Bell, ChevronRight, Cctv, Cpu } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBenchSensor } from '../../hooks/useBenchSensor';
import { setHeaderPanel, useCloseOnOutside, useHeaderPanel } from '../../hooks/useHeaderPanel';
import { useNow } from '../../hooks/useNow';
import { useVisionStore } from '../../hooks/vision/useVisionStore';
import { LEVEL_META } from '../../lib/vision/levels';
import type { Level } from '../../types/vision';

interface Item { id: string; kind: 'iot' | 'camera'; level: Level; title: string; body: string; at: number }
const SHOW = 8;
const HOUR = 3600000;

function when(at: number, now: number): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** The bell: recent IoT node and camera alerts in one list. The dot shows when something arrived since it was
 *  last opened (camera alerts count for an hour). */
export function AlertsHeaderPopover() {
  const isOpen = useHeaderPanel() === 'alerts';
  const box = useRef<HTMLDivElement>(null);
  useCloseOnOutside('alerts', box);
  const { alerts } = useVisionStore();
  const { events } = useBenchSensor();
  const now = useNow(30000);
  const [seenAt, setSeenAt] = useState(() => Date.now() - HOUR);

  const items: Item[] = [
    ...events.map((e): Item => ({ id: `iot-${e.id}`, kind: 'iot', level: e.level, title: e.title, body: e.body, at: e.at })),
    ...alerts.map((a): Item => ({
      id: `cam-${a.id}`, kind: 'camera', level: a.level, title: `${LEVEL_META[a.level].label}: ${a.camera_name}`,
      body: `Reached ${Math.round(a.water_ratio * 100)}% of bank height`, at: Date.parse(a.timestamp),
    })),
  ].sort((a, b) => b.at - a.at);
  const unseen = items.filter((i) => i.at > seenAt).length;

  const toggle = () => {
    if (isOpen) {
      setHeaderPanel(null);
      return;
    }
    setHeaderPanel('alerts');
    setSeenAt(Date.now());
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label={unseen ? `Notifications: ${unseen} new` : 'Notifications'}
        className="relative flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]"
      >
        <Bell className="w-4 h-4" aria-hidden="true" />
        {unseen > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full ring-2 ring-white" aria-hidden="true" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="font-heading text-sm font-bold text-slate-900">Notifications</span>
            {items.length > 0 && <span className="text-xs text-slate-500">{Math.min(items.length, SHOW)} latest</span>}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">No alerts yet. Warnings from the IoT node and cameras appear here.</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
              {items.slice(0, SHOW).map((i) => {
                const meta = LEVEL_META[i.level];
                const Icon = meta.icon;
                const Source = i.kind === 'iot' ? Cpu : Cctv;
                return (
                  <li key={i.id} className="flex gap-3 px-4 py-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.solid}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{i.title}</span>
                        <span className="shrink-0 text-xs text-slate-500">{when(i.at, now)}</span>
                      </p>
                      <p className="text-xs text-slate-600">{i.body}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <Source className="h-3 w-3" aria-hidden="true" /> {i.kind === 'iot' ? 'IoT node' : 'Camera'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <Link to="/live" onClick={() => setHeaderPanel(null)} className="flex items-center justify-center gap-1 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-[#0958D9] hover:bg-slate-50 rounded-b-2xl">
            Open Live Vision <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  );
}
