import { useEffect, useState } from 'react';
import type { Camera } from '../../types/vision';

export type CyclePhase = 'offline' | 'stale' | 'analysing' | 'waiting';

export interface CycleState {
  phase: CyclePhase;
  secondsLeft: number;
  progress: number; // 0..1 through the current wait
}

/** Drives the "Next capture in 7s" indicator from the last reading's timestamp. The server does the capturing;
 *  this is only a visual countdown that resets whenever a new reading arrives. */
export function useCaptureCycle(camera: Camera): CycleState {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  if (!camera.online) return { phase: 'offline', secondsLeft: 0, progress: 0 };
  const reading = camera.reading;
  if (!reading) return { phase: 'analysing', secondsLeft: 0, progress: 0 };

  const cycleMs = camera.interval_s * 1000 + reading.window_seconds * 1000;
  const nextAt = Date.parse(reading.timestamp) + cycleMs;
  const remaining = nextAt - now;

  const lastFrame = camera.last_frame_at ? Date.parse(camera.last_frame_at) : null;
  const feedLimitMs = Math.max(camera.feed_refresh_s * 2000, camera.interval_s * 3000);
  const frameStale = camera.feed_refresh_s > 0 && lastFrame !== null && now - lastFrame > feedLimitMs;
  if (frameStale || remaining < -camera.interval_s * 2000) return { phase: 'stale', secondsLeft: 0, progress: 0 };

  if (remaining <= 0) return { phase: 'analysing', secondsLeft: 0, progress: 1 };
  return { phase: 'waiting', secondsLeft: Math.ceil(remaining / 1000), progress: 1 - remaining / cycleMs };
}
