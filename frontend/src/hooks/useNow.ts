import { useEffect, useState } from 'react';

/** The current time in ms, refreshed every `everyMs`. Used for "updated 12 s ago" labels. */
export function useNow(everyMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(t);
  }, [everyMs]);
  return now;
}
