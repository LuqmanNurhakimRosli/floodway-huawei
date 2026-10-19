import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useApp } from '../contexts/AppContext';
import { originForLocation } from '../data/klDemo';
import { floodedZones } from '../components/map/FloodProneLayer';
import { useVisionHazards } from './vision/useVisionHazards';
import * as store from '../services/family/familyStore';
import type { FamilyState } from '../services/family/familyStore';
import type { Zone } from '../lib/routing';
import { verifiedZones } from '../lib/verifiedReports';
import { useNow } from './useNow';

/** The family circle, with the simulation running while the caller is mounted. Your demo position follows the header. */
export function useFamily(): FamilyState {
  const { selectedLocation } = useApp();
  useEffect(() => {
    store.acquire();
    return () => store.release();
  }, []);
  useEffect(() => {
    const o = originForLocation(selectedLocation);
    store.setDemoPosition(o.lat, o.lon);
  }, [selectedLocation]);
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/**
 * Every flood zone routes and safety checks avoid: the scenario's flooded areas, sample-camera zones at WARNING or
 * DANGER, and areas built from recent verified citizen reports (lib/verifiedReports.ts).
 */
export function useFloodZones(): Zone[] {
  const { floodScenario, reports } = useApp();
  const cameraHazards = useVisionHazards();
  const now = useNow(60000); // areas fade with age, so re-evaluate every minute
  return useMemo(
    () => [
      ...floodedZones(floodScenario),
      ...cameraHazards.map((h) => ({ id: `cam-${h.cameraId}`, lat: h.lat, lon: h.lon, radiusM: h.radiusM })),
      ...verifiedZones(reports, now),
    ],
    [floodScenario, cameraHazards, reports, now],
  );
}

export const familyActions = {
  setCircle: store.setCircle,
  setSharing: store.setSharing,
  togglePlaceAlerts: store.togglePlaceAlerts,
  checkIn: store.checkIn,
  startSos: store.startSos,
  markSafe: store.markSafe,
  askCheckIn: store.askCheckIn,
  sendRoute: store.sendRoute,
  clearEvents: store.clearEvents,
  startGps: store.startGps,
  stopGps: () => store.stopGps(),
};

export const circleMembers = store.circleMembers;
