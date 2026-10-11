import { useMemo } from 'react';
import { haversineKm } from '../../lib/vision/geo';
import { levelRank } from '../../lib/vision/levels';
import type { Camera } from '../../types/vision';

export type CameraTab = 'nearby' | 'city' | 'mine';
export interface CameraWithDistance {
  camera: Camera;
  distanceKm: number;
}
interface Options {
  origin: { lat: number; lon: number };
  radiusKm: number;
  tab: CameraTab;
  query: string;
}

/** Filter by tab/radius/search, then sort: highest alert level first (it is pinned to the top), then nearest. */
export function useNearbyCameras(cameras: Camera[], { origin, radiusKm, tab, query }: Options): CameraWithDistance[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    return cameras
      .map((camera) => ({ camera, distanceKm: haversineKm(origin.lat, origin.lon, camera.lat, camera.lon) }))
      .filter(({ camera, distanceKm }) => {
        if (q && !camera.name.toLowerCase().includes(q)) return false;
        if (tab === 'mine') return camera.provider === 'mine';
        if (tab === 'city' && camera.provider === 'mine') return false;
        return distanceKm <= radiusKm;
      })
      .sort((a, b) => {
        const la = a.camera.online && a.camera.reading ? levelRank(a.camera.reading.level) : -1;
        const lb = b.camera.online && b.camera.reading ? levelRank(b.camera.reading.level) : -1;
        return lb - la || a.distanceKm - b.distanceKm;
      });
  }, [cameras, origin.lat, origin.lon, radiusKm, tab, query]);
}
