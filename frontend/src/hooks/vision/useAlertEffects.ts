import { useEffect, useRef } from 'react';
import { showBrowserAlert } from '../../lib/vision/notify';
import type { AlertEvent } from '../../types/vision';

/** Fires a browser notification + vibration once for each new alert. */
export function useAlertEffects(unseen: AlertEvent[]): void {
  const notified = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const alert of unseen) {
      if (notified.current.has(alert.id)) continue;
      notified.current.add(alert.id);
      showBrowserAlert(alert);
    }
  }, [unseen]);
}
