import { useEffect, useState } from 'react';
import type { Place } from '../../lib/vision/geo';

/** Browser GPS when allowed, otherwise null. The page falls back to KLCC. Never blocks rendering. */
export function useGpsPlace(): Place | null {
  const [place, setPlace] = useState<Place | null>(null);
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPlace({ id: 'gps', label: 'Your location', lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => undefined,
      { timeout: 6000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);
  return place;
}
