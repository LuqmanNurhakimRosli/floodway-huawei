import { useState, useEffect, useCallback } from 'react';

export interface LocationState {
  coords: [number, number] | null; // [lat, lng]
  accuracy: number | null; // meters
  heading: number | null;
  speed: number | null;
  status: 'idle' | 'locating' | 'active' | 'denied' | 'unavailable' | 'timeout';
  error: string | null;
  timestamp: number | null;
}

export function useUserLocation(defaultFallbackCoords: [number, number] = [2.9935, 101.7895]) {
  const [location, setLocation] = useState<LocationState>({
    coords: null,
    accuracy: null,
    heading: null,
    speed: null,
    status: 'idle',
    error: null,
    timestamp: null,
  });

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocation((prev) => ({
        ...prev,
        status: 'unavailable',
        error: 'Geolocation API is not supported by your browser',
        coords: defaultFallbackCoords,
      }));
      return;
    }

    setLocation((prev) => ({ ...prev, status: 'locating', error: null }));

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          coords: [position.coords.latitude, position.coords.longitude],
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          status: 'active',
          error: null,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let statusText: LocationState['status'] = 'unavailable';
        if (error.code === error.PERMISSION_DENIED) statusText = 'denied';
        else if (error.code === error.TIMEOUT) statusText = 'timeout';

        setLocation((prev) => ({
          ...prev,
          status: statusText,
          error: error.message || 'Unable to retrieve location',
          coords: prev.coords || defaultFallbackCoords, // Graceful fallback
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [defaultFallbackCoords]);

  useEffect(() => {
    const cleanup = requestLocation();
    return () => {
      if (cleanup) cleanup();
    };
  }, [requestLocation]);

  return { ...location, refetch: requestLocation };
}
