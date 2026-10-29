import { useEffect, useSyncExternalStore } from 'react';
import type { RefObject } from 'react';

// Which header dropdown is open. One at a time, and every toast (camera alerts, storm notices, IoT node) stays
// hidden while one is open: the toasts sit top/bottom right, right where the dropdowns open.
export type HeaderPanel = 'iot' | 'alerts' | null;

let open: HeaderPanel = null;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export function setHeaderPanel(next: HeaderPanel) {
  open = next;
  listeners.forEach((l) => l());
}

export function useHeaderPanel(): HeaderPanel {
  return useSyncExternalStore(subscribe, () => open, () => open);
}

/** Close `panel` on a click outside `ref` or on Escape. */
export function useCloseOnOutside(panel: Exclude<HeaderPanel, null>, ref: RefObject<HTMLElement | null>) {
  const current = useHeaderPanel();
  useEffect(() => {
    if (current !== panel) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setHeaderPanel(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHeaderPanel(null);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [current, panel, ref]);
}
