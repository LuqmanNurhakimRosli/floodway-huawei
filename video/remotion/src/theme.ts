import timeline from './data/timeline.json';
import edit from './data/edit.json';

export const FPS = timeline.fps;
export const C = {
  navy: '#0f172a',
  night: '#0b1220',
  slate: '#475569',
  mist: '#cbd5e1',
  teal: '#4d96a9',
  tealDark: '#445c61',
  cyan: '#4dd0e1',
  huawei: '#c7000b',
  kicker: '#ef4444',
  alert: '#dc2626',
  warn: '#f59e0b',
  safe: '#16a34a',
  white: '#ffffff',
};
export const HEAD = 'Outfit, Inter, sans-serif';
export const BODY = 'Inter, sans-serif';

export type Scene = (typeof timeline.scenes)[number];
export type Cue = (typeof timeline.cues)[number];
export type Segment = (typeof edit.segments)[number] & { badge?: string; phone?: boolean; audio?: boolean; hold_last?: boolean };

export const scene = (n: number): Scene => timeline.scenes.find((s) => s.scene === n)!;
/** Seconds -> frames, rounded. */
export const f = (s: number) => Math.round(s * FPS);
/** A cue's start in frames relative to its scene. */
export const cueAt = (id: string) => {
  const c = timeline.cues.find((x) => x.id === id)!;
  return f(c.start - scene(c.scene).start);
};
export const marker = (name: string) => {
  const m = timeline.markers.find((x) => x.name === name)!;
  return f(m.at - scene(m.scene).start);
};
export const segmentsOf = (n: number) => (edit.segments as Segment[]).filter((s) => s.scene === n);
export { timeline, edit };
