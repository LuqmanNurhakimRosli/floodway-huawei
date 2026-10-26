import { useCallback, useEffect, useRef, useState } from 'react';
import { STORM_DURATION_S } from '../lib/stormScenario';

export type StormPhase = 'idle' | 'running' | 'done';

/** Clock for the scripted storm: elapsed seconds while running, frozen at the end until reset. */
export function useStormScenario(autoStart = false) {
  const [phase, setPhase] = useState<StormPhase>(autoStart ? 'running' : 'idle');
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (phase !== 'running') return;
    const id = setInterval(() => {
      const t = (Date.now() - startedAt.current) / 1000;
      if (t >= STORM_DURATION_S) {
        setElapsed(STORM_DURATION_S);
        setPhase('done');
      } else setElapsed(t);
    }, 250);
    return () => clearInterval(id);
  }, [phase]);

  const start = useCallback(() => {
    startedAt.current = Date.now();
    setElapsed(0);
    setPhase('running');
  }, []);
  const reset = useCallback(() => {
    setElapsed(0);
    setPhase('idle');
  }, []);

  return { phase, elapsed, start, reset };
}
