import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useApp } from '../contexts/AppContext';
import { originForLocation } from '../data/klDemo';
import { floodedZones } from '../components/map/FloodProneLayer';
import { useVisionHazards } from './vision/useVisionHazards';
import * as store from '../services/family/familyStore';
import type { FamilyState } from '../services/family/familyStore';
import type { Zone } from '../lib/routing';

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

/** Flood zones for the current scenario plus any sample-camera zones at WARNING or DANGER: the same set routes avoid. */
export function useFloodZones(): Zone[] {
  const { floodScenario } = useApp();
  const cameraHazards = useVisionHazards();
  return useMemo(
    () => [...floodedZones(floodScenario), ...cameraHazards.map((h) => ({ id: `cam-${h.cameraId}`, lat: h.lat, lon: h.lon, radiusM: h.radiusM }))],
    [floodScenario, cameraHazards],
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
