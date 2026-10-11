import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/** Rendered height of an element, kept current with a ResizeObserver. 0 until measured. */
export function useElementHeight(ref: RefObject<HTMLElement | null>): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setHeight(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return height;
}
