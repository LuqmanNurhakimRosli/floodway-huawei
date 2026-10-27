import { useSyncExternalStore } from 'react';
import * as store from '../services/benchSensorStore';
import type { BenchState } from '../services/benchSensorStore';

/** The live link to the bench ESP32 (shared by the header popover and the /live fusion tile). */
export function useBenchSensor(): BenchState {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

export const benchActions = { connect: store.connect, disconnect: store.disconnect, supported: store.webSerialSupported };
