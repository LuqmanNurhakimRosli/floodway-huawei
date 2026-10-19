// Your position, only while the app is open and only after you agree. FloodWay never asks for background location.
import * as Location from 'expo-location';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type LocationStatus = 'unknown' | 'asking' | 'granted' | 'denied' | 'unavailable';
export interface MyLocation {
  status: LocationStatus;
  lat: number | null;
  lon: number | null;
  accuracyM: number | null;
  at: number | null;
}

const EMPTY: MyLocation = { status: 'unknown', lat: null, lon: null, accuracyM: null, at: null };

function useLocationState() {
  const [loc, setLoc] = useState<MyLocation>(EMPTY);

  const read = useCallback(async () => {
    try {
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLoc({ status: 'granted', lat: p.coords.latitude, lon: p.coords.longitude, accuracyM: p.coords.accuracy ?? null, at: p.timestamp });
    } catch {
      setLoc((l) => ({ ...l, status: 'unavailable' }));
    }
  }, []);

  // Only checks whether permission was already given; it never shows the system prompt by itself.
  useEffect(() => {
    Location.getForegroundPermissionsAsync()
      .then((p) => (p.granted ? read() : setLoc((l) => ({ ...l, status: p.canAskAgain ? 'unknown' : 'denied' }))))
      .catch(() => setLoc((l) => ({ ...l, status: 'unavailable' })));
  }, [read]);

  /** Shows the system prompt. Call only from a button the user pressed after reading why. */
  const request = useCallback(async () => {
    setLoc((l) => ({ ...l, status: 'asking' }));
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.granted) await read();
      else setLoc((l) => ({ ...l, status: 'denied' }));
    } catch {
      setLoc((l) => ({ ...l, status: 'unavailable' }));
    }
  }, [read]);

  return { loc, request, refresh: read };
}

type LocationApi = ReturnType<typeof useLocationState>;
const Ctx = createContext<LocationApi | null>(null);

/** One shared position for every tab, so the app asks once and every screen agrees. */
export function LocationProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(Ctx.Provider, { value: useLocationState() }, children);
}

export function useMyLocation(): LocationApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useMyLocation needs LocationProvider');
  return v;
}
