import { useEffect, useSyncExternalStore } from 'react';
import * as store from '../../services/vision/visionStore';
import type { VisionState } from '../../services/vision/visionStore';

/** Subscribe to the shared vision store and keep its connection open while any component is mounted. */
export function useVisionStore(): VisionState {
  useEffect(() => {
    store.acquire();
    return () => store.release();
  }, []);
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

export const visionActions = {
  refresh: store.refresh,
  analyzeNow: store.analyzeNow,
  addCamera: store.addCamera,
  removeCamera: store.removeCamera,
  loadHistory: store.loadHistory,
  ackAlert: store.ackAlert,
  commandBarrier: store.commandBarrier,
};
