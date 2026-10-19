// One shared copy of the server data for every tab: cameras, alerts, relief centres and reports, each with its time
// and whether it is live. Refreshes every minute while the app is in the foreground.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { AlertEvent, Camera, CitizenReport, Shelter } from '../shared';
import { api } from './api';
import { liveOrCached, type Fetched } from './cache';
import { notifyNewAlerts } from './notify';
import { loadServerUrl } from './settings';

interface Data {
  cameras: Fetched<Camera[]>;
  alerts: Fetched<AlertEvent[]>;
  shelters: Fetched<Shelter[]>;
  reports: Fetched<CitizenReport[]>;
  loading: boolean;
  refresh: () => Promise<void>;
}

const none = <T,>(): Fetched<T> => ({ data: null, at: null, live: false, error: null });
const Ctx = createContext<Data | null>(null);
const POLL_MS = 60000;

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [cameras, setCameras] = useState(none<Camera[]>);
  const [alerts, setAlerts] = useState(none<AlertEvent[]>);
  const [shelters, setShelters] = useState(none<Shelter[]>);
  const [reports, setReports] = useState(none<CitizenReport[]>);
  const [loading, setLoading] = useState(true);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return; // no overlapping refreshes
    busy.current = true;
    setLoading(true);
    try {
      await loadServerUrl();
      const [c, a, s, r] = await Promise.all([
        liveOrCached('cameras', api.cameras),
        liveOrCached('alerts', () => api.alerts()),
        liveOrCached('shelters', api.shelters),
        liveOrCached('reports', api.reports),
      ]);
      setCameras(c);
      setAlerts(a);
      setShelters(s);
      setReports(r);
      if (a.live && a.data) await notifyNewAlerts(a.data).catch(() => 0);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    let timer: ReturnType<typeof setInterval> | null = setInterval(refresh, POLL_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        void refresh();
        timer ??= setInterval(refresh, POLL_MS);
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    return () => {
      sub.remove();
      if (timer) clearInterval(timer);
    };
  }, [refresh]);

  return <Ctx.Provider value={{ cameras, alerts, shelters, reports, loading, refresh }}>{children}</Ctx.Provider>;
}

export function useData(): Data {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData needs DataProvider');
  return v;
}
