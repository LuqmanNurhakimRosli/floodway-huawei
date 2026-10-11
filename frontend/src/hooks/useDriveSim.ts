import { useCallback, useEffect, useRef, useState } from 'react';

/** A simulated drive along a route, sped up so it can be shown in a demo. Progress runs 0 to 1. */
export function useDriveSim(totalMs: number, onArrive: () => void) {
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const arrive = useRef(onArrive);
  arrive.current = onArrive;

  useEffect(() => {
    if (!active) return;
    const t0 = performance.now();
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / totalMs);
      setProgress(p);
      if (p >= 1) {
        clearInterval(id);
        setActive(false);
        arrive.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [active, totalMs]);

  const start = useCallback(() => {
    setProgress(0);
    setActive(true);
  }, []);
  const stop = useCallback(() => {
    setActive(false);
    setProgress(0);
  }, []);

  return { active, progress, start, stop };
}
