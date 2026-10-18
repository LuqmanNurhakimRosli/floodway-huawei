import { useEffect, useMemo, useState } from 'react';
import type { NearbySensor } from '../lib/depthFromPhoto';
import { haversineKm } from '../lib/vision/geo';
import { levelRank } from '../lib/vision/levels';
import { API_BASE } from '../services/vision/config';
import type { Level } from '../types/vision';
import { useVisionStore } from './vision/useVisionStore';

interface Device {
  id: string;
  name: string;
  lat: number;
  lon: number;
  current_level_m: number;
  status: string;
  phase: string;
  danger_threshold_m?: number;
}

const asLevel = (phase: string): Level => (['NORMAL', 'ADVISORY', 'WARNING', 'DANGER'].includes(phase) ? (phase as Level) : 'NORMAL');

/**
 * The nearest live camera and the nearest depth node to a point, for cross-checking a resident's photo.
 * Depth nodes come from /api/v1/devices; with no server, only the sample cameras are available.
 */
export function useNearbySensors(lat: number, lon: number): { camera: NearbySensor | null; node: NearbySensor | null } {
  const { cameras } = useVisionStore();
  const [devices, setDevices] = useState<Device[]>([]);

  useEffect(() => {
    let live = true;
    fetch(`${API_BASE}/api/v1/devices`, { signal: AbortSignal.timeout(3000) })
      .then((r) => (r.ok ? r.json() : { devices: [] }))
      .then((body: { devices?: Device[] }) => live && setDevices(body.devices ?? []))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  const camera = useMemo<NearbySensor | null>(() => {
    let best: NearbySensor | null = null;
    for (const c of cameras) {
      if (!c.online || !c.reading) continue;
      const d = haversineKm(lat, lon, c.lat, c.lon);
      if (!best || d < best.distanceKm) best = { kind: 'camera', name: c.name, distanceKm: d, level: c.reading.level };
    }
    return best;
  }, [cameras, lat, lon]);

  const node = useMemo<NearbySensor | null>(() => {
    let best: NearbySensor | null = null;
    for (const dev of devices) {
      if (dev.status !== 'ONLINE') continue;
      const d = haversineKm(lat, lon, dev.lat, dev.lon);
      // A node with a danger line under a metre measures street depth; anything else is a river stage station.
      const street = (dev.danger_threshold_m ?? 99) <= 1;
      const s: NearbySensor = { kind: street ? 'street-node' : 'river-node', name: dev.name, distanceKm: d, level: asLevel(dev.phase), depthM: street ? dev.current_level_m : undefined };
      if (!best || d < best.distanceKm || (d === best.distanceKm && levelRank(s.level) > levelRank(best.level))) best = s;
    }
    return best;
  }, [devices, lat, lon]);

  return { camera, node };
}
