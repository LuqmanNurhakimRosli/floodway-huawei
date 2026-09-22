import { useEffect, useRef, useState } from "react";

export type Phase = "NORMAL" | "WARNING" | "DANGER";
export interface Forecast { horizons_min: number[]; p10: number[]; p50: number[]; p90: number[]; model_version: string }
export interface TwinState {
  level_m: number; phase: Phase; stale: boolean; sensor_age_s: number | null;
  forecast: Forecast | null; forecast_source: "modelarts" | "local"; degraded: boolean; degraded_reasons: string[];
  shelter: { name: string; lat: number; lon: number; distance_m: number } | null; disclaimer: string;
}
const CACHE_KEY = "fw.twin.last.v1";

/** Polls the backend; keeps the last good state so the screen still works in a dead zone (and says so). */
export function useTwinState(opts: { deviceId: string; lat: number; lon: number; profile: string; base?: string; everyMs?: number }) {
  const { deviceId, lat, lon, profile, base = "", everyMs = 10_000 } = opts;
  const [state, setState] = useState<TwinState | null>(() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "null"); } catch { return null; }
  });
  const [lastOkAt, setLastOkAt] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);
  const timer = useRef<number>();

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      if (document.hidden) return schedule();
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 6000);
      try {
        const q = new URLSearchParams({ device_id: deviceId, lat: String(lat), lon: String(lon), profile });
        const r = await fetch(`${base}/api/v1/twin/state?${q}`, { signal: ctl.signal });
        if (!r.ok) throw new Error(String(r.status));
        const s: TwinState = await r.json();
        if (!alive) return;
        setState(s); setLastOkAt(Date.now()); setOffline(false);
        localStorage.setItem(CACHE_KEY, JSON.stringify(s));
      } catch { if (alive) setOffline(true); }
      finally { clearTimeout(to); schedule(); }
    };
    const schedule = () => { if (alive) timer.current = window.setTimeout(tick, everyMs); };
    tick();
    return () => { alive = false; clearTimeout(timer.current); };
  }, [deviceId, lat, lon, profile, base, everyMs]);

  return { state, offline, lastOkAt };
}
