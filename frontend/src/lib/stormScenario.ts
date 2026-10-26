// The scripted storm for the four-factor demo. It runs for STORM_DURATION_S seconds: change that one number to make
// the whole storm faster or slower (every step below is a fraction of it). The model step is real: Tisya's model
// scores the rain recorded before the 18 Dec 2021 Jalan Dang Wangi flood, fed in four steps. The MET and sensor
// numbers are demo values until their feeds are connected. The camera rises on its own curve (stormCameraRatio).
import type { Level } from '../types/vision';
import type { FactorKey } from './fusion';
import { floodProneModel, floodProneScore, fuse, MET_LEVEL, modelLevel } from './fusion';
import { ratioToLevel } from './vision/levelRules';

export interface FactorState {
  level: Level | null;
  /** Big number on the tile. */
  value: string;
  /** One line under it; also used in the "why" list. */
  detail: string;
}
export type FactorStates = Record<FactorKey, FactorState>;

export interface StormNotice {
  id: string;
  title: string;
  body: string;
  level: Level;
}

/** Total length of the storm scenario, in seconds. Edit this to speed it up or slow it down. */
export const STORM_DURATION_S = 15;

export interface StormStep {
  /** When the step happens, as a fraction (0 to 1) of STORM_DURATION_S. */
  at: number;
  patch: Partial<FactorStates>;
  notice?: Omit<StormNotice, 'id' | 'level'>;
}

const place = 'Kampung Baru';
const [, rainWet, rainHeavy, rainFlood] = floodProneModel.reference.map((r) => r.rain as [number, number, number]);

export function modelFactor(rain: [number, number, number]): FactorState {
  const score = floodProneScore(rain);
  return { level: modelLevel(score), value: score.toFixed(2), detail: `Flood-prone score for ${place}, 7-day rain ${Math.round(rain[2])} mm` };
}

export const idleMet = (): FactorState => ({ level: 'NORMAL', value: '6 mm/h', detail: 'Rain rate, Kuala Lumpur' });
export const idleIot = (): FactorState => ({ level: 'NORMAL', value: '18%', detail: `Water sensor, ${place}` });
export const cameraFactor = (ratio: number): FactorState => ({
  level: ratioToLevel(ratio),
  value: `${Math.round(ratio * 100)}%`,
  detail: `${place} Drain camera at ${Math.round(ratio * 100)}% of bank`,
});

const met = (mmh: number, detail: string): FactorState => ({ level: MET_LEVEL.orange, value: `${mmh} mm/h`, detail });
const iot = (pct: number, level: Level): FactorState => ({ level, value: `${pct}%`, detail: `Water sensor, ${place}, at ${pct}%` });

export const STORM_STEPS: StormStep[] = [
  { at: 0, patch: { met: met(74, 'MET orange warning: heavy rain, Kuala Lumpur, next 6 h') },
    notice: { title: 'MET Malaysia: heavy rain warning', body: 'Orange warning for Kuala Lumpur, next 6 hours. FloodWay is watching.' } },
  { at: 0.12, patch: { model: modelFactor(rainWet) } },
  { at: 0.25, patch: { model: modelFactor(rainHeavy) },
    notice: { title: 'Flood-prone place', body: `${place} is in the model's top band. No live reading agrees yet.` } },
  { at: 0.38, patch: { iot: iot(35, 'ADVISORY') } },
  { at: 0.53, patch: { iot: iot(58, 'WARNING') },
    notice: { title: 'Leave now', body: 'Water sensor at its warning line, with rain and flood history agreeing. Route to the nearest open relief centre.' } },
  { at: 0.8, patch: { model: modelFactor(rainFlood), iot: iot(81, 'DANGER') } },
  { at: 0.9, patch: {},
    notice: { title: 'All four factors agree', body: `Water at the bank top. Stay away from ${place} Drain.` } },
];

/** Water ratio of the Kampung Baru camera at `elapsed` seconds: calm until the sensor warns, then rising to the danger line. */
export function stormCameraRatio(elapsed: number, calm: number): number {
  const u = Math.min(1, Math.max(0, (elapsed / STORM_DURATION_S - 0.35) / 0.55));
  return calm + (1.02 - calm) * Math.pow(u, 1.4);
}

export const fuseStates = (factors: FactorStates) =>
  fuse({ model: factors.model.level, met: factors.met.level, iot: factors.iot.level, cctv: factors.cctv.level });

/** Factor states and notices after `t` seconds of the scenario, starting from the idle `base`. */
export function stormStateAt(t: number, base: FactorStates, cameraCalm = 0.17): { factors: FactorStates; notices: StormNotice[] } {
  const factors: FactorStates = { ...base, cctv: cameraFactor(stormCameraRatio(t, cameraCalm)) };
  const notices: StormNotice[] = [];
  for (const step of STORM_STEPS) {
    if (step.at * STORM_DURATION_S > t) break;
    Object.assign(factors, step.patch);
    // A notice carries the fused level at its step, so the toast matches the ring.
    if (step.notice) notices.push({ id: `storm-${step.at}`, level: fuseStates(factors).level, ...step.notice });
  }
  return { factors, notices };
}
