// The scripted storm for the four-factor demo: a 60 s timeline that raises MET, the flood-prone model, the IoT node
// and the camera in turn. The model step is real: Tisya's model scores the rain recorded before the 18 Dec 2021
// Jalan Dang Wangi flood, fed in four steps. Every other value here is SCRIPTED and labelled so on screen.
import type { Level } from '../types/vision';
import type { FactorKey, FactorSource, MetWarning } from './fusion';
import { floodProneModel, floodProneScore, fuse, MET_LEVEL, modelLevel } from './fusion';

export interface FactorState {
  level: Level | null;
  /** Big number or word on the tile. */
  value: string;
  /** One line under it; also used in the "why" list. */
  detail: string;
  source: FactorSource;
}
export type FactorStates = Record<FactorKey, FactorState>;

export interface StormNotice {
  id: string;
  title: string;
  body: string;
  level: Level;
}

export interface StormStep {
  at: number; // seconds from start
  patch: Partial<FactorStates>;
  notice?: Omit<StormNotice, 'id' | 'level'>;
}

export const STORM_DURATION_S = 60;

const site = floodProneModel.site;
const [, rainWet, rainHeavy, rainFlood] = floodProneModel.reference.map((r) => r.rain as [number, number, number]);

export function modelFactor(rain: [number, number, number], source: FactorSource = 'MODEL'): FactorState {
  const score = floodProneScore(rain);
  return {
    level: modelLevel(score),
    value: score.toFixed(2),
    detail: `Flood-prone score at ${site.place}, 7-day rain ${Math.round(rain[2])} mm`,
    source,
  };
}

const met = (w: MetWarning, detail: string): FactorState => ({ level: MET_LEVEL[w], value: w === 'none' ? 'None' : w[0].toUpperCase() + w.slice(1), detail, source: 'SCRIPTED' });
const iot = (pct: number, level: Level): FactorState => ({ level, value: `${pct}%`, detail: `Bench node fw-bench-01 at ${pct}% of its tank`, source: 'SCRIPTED' });
const cctv = (pct: number, level: Level): FactorState => ({ level, value: `${pct}%`, detail: `Kampung Baru Drain camera at ${pct}% of bank`, source: 'SCRIPTED' });

// The story: context alone only watches; the first live reading that agrees warns; the sensor at its warning line,
// with rain and flood history agreeing, says leave before the camera sees it; the camera then confirms.
export const STORM_STEPS: StormStep[] = [
  { at: 0, patch: { met: met('orange', 'MET orange warning: heavy rain, Kuala Lumpur, next 6 h'), cctv: cctv(18, 'NORMAL') },
    notice: { title: 'MET Malaysia: heavy rain warning', body: 'Orange warning for Kuala Lumpur, next 6 hours. FloodWay is watching.' } },
  { at: 8, patch: { model: modelFactor(rainWet) } },
  { at: 16, patch: { model: modelFactor(rainHeavy) },
    notice: { title: 'Flood-prone place', body: `${site.place} moved into the model's top band. No live reading agrees yet.` } },
  { at: 24, patch: { iot: iot(35, 'ADVISORY') },
    notice: { title: 'Get ready to move', body: 'Bench sensor rising (35%) while rain and flood history agree.' } },
  { at: 32, patch: { iot: iot(58, 'WARNING') },
    notice: { title: 'Leave now', body: 'Sensor at its warning line, with rain and flood history agreeing. Route to the nearest open relief centre.' } },
  { at: 40, patch: { cctv: cctv(64, 'WARNING') },
    notice: { title: 'Camera confirms rising water', body: 'Kampung Baru Drain at 64% of bank.' } },
  { at: 48, patch: { model: modelFactor(rainFlood), iot: iot(81, 'DANGER') } },
  { at: 52, patch: { cctv: cctv(97, 'DANGER') },
    notice: { title: 'All four factors agree', body: 'Water at the bank top. Stay away from Kampung Baru Drain.' } },
];

export const fuseStates = (factors: FactorStates) =>
  fuse({ model: factors.model.level, met: factors.met.level, iot: factors.iot.level, cctv: factors.cctv.level });

/** Factor states and notices after `t` seconds of the scenario, starting from the idle `base`. */
export function stormStateAt(t: number, base: FactorStates): { factors: FactorStates; notices: StormNotice[] } {
  const factors = { ...base };
  const notices: StormNotice[] = [];
  for (const step of STORM_STEPS) {
    if (step.at > t) break;
    Object.assign(factors, step.patch);
    // A notice carries the fused level at its step, so the toast matches the ring.
    if (step.notice) notices.push({ id: `storm-${step.at}`, level: fuseStates(factors).level, ...step.notice });
  }
  return { factors, notices };
}
