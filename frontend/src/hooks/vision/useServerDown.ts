import { useSyncExternalStore } from 'react';
import * as store from '../../services/vision/visionStore';

/** Whether the Live Vision server is unreachable. Reads the shared store without holding a connection open. */
export function useServerDown(): boolean {
  return useSyncExternalStore(store.subscribe, () => store.isServerDown(store.getState()), () => false);
}
