import { X } from 'lucide-react';
import { useEffect } from 'react';
import { LEVEL_META } from '../../../lib/vision/levels';
import type { AlertEvent } from '../../../types/vision';
import { focusRing } from '../shared/ui';

interface Props {
  alert: AlertEvent | undefined;
  onOpen: (alert: AlertEvent) => void;
  onDismiss: (alert: AlertEvent) => void;
}

const AUTO_DISMISS_MS = 12000;

/** Slides in for each new WARNING/DANGER. Top-right on desktop, full width under the header on phones. */
export function AlertToast({ alert, onOpen, onDismiss }: Props) {
  useEffect(() => {
    if (!alert) return;
    const t = setTimeout(() => onDismiss(alert), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [alert, onDismiss]);

  if (!alert) return null;
  const meta = LEVEL_META[alert.level];
  const Icon = meta.icon;

  return (
    <div role="alert" className="fixed inset-x-3 top-20 z-50 sm:left-auto sm:right-4 sm:w-96">
      <div className={`flex items-start gap-3 rounded-2xl border-2 bg-white p-3 shadow-xl ${meta.border}`}>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.solid}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <button type="button" onClick={() => onOpen(alert)} className={`min-w-0 flex-1 rounded-lg text-left ${focusRing}`}>
          <p className={`text-sm font-extrabold ${meta.text}`}>{meta.label.toUpperCase()}</p>
          <p className="text-sm font-semibold text-slate-900">{alert.camera_name}</p>
          <p className="text-sm text-slate-600">Reached {Math.round(alert.water_ratio * 100)}% of bank. Tap to view evacuation routes.</p>
        </button>
        <button type="button" onClick={() => onDismiss(alert)} aria-label="Dismiss alert" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 ${focusRing}`}>
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
