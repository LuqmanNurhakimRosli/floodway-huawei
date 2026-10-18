import type { Camera, Level, Reading, StormResult, StormRun } from '../../types/vision';

/** 12.3 -> "12 s", 67.1 -> "1 min 7 s", null -> "–". */
export function formatSeconds(s: number | null | undefined): string {
  if (s === null || s === undefined || !Number.isFinite(s)) return '–';
  const v = Math.round(Math.abs(s));
  const sign = s < 0 ? '−' : '';
  if (v < 60) return `${sign}${v} s`;
  const m = Math.floor(v / 60);
  const r = v % 60;
  return `${sign}${m} min${r ? ` ${r} s` : ''}`;
}

export const timingFor = (r: StormResult, level: Level) => r.metrics.timings.find((t) => t.level === level) ?? null;

/** One plain sentence on what the replay showed, written from the numbers, never from a template of claims. */
export function describeRun(run: StormRun): string {
  const on = run.with_filter.metrics;
  const off = run.without_filter.metrics;
  if (run.scenario === 'sensor-glitch' || (timingFor(run.with_filter, 'WARNING')?.truth_crossed_at ?? null) === null) {
    if (on.false_alerts === 0 && off.false_alerts > 0) {
      return `The filter held ${on.held_readings} fooled reading${on.held_readings === 1 ? '' : 's'} and sent no alert. Without it, the same storm sent ${off.false_alerts} false alert${off.false_alerts === 1 ? '' : 's'}${off.barrier_closed_at !== null ? ' and closed the barrier for nothing' : ''}.`;
    }
    return `No alert was sent with the filter (${on.false_alerts} false) and ${off.false_alerts} without it.`;
  }
  const warn = timingFor(run.with_filter, 'WARNING');
  const danger = timingFor(run.with_filter, 'DANGER');
  const dangerOff = timingFor(run.without_filter, 'DANGER');
  const parts: string[] = [];
  if (warn?.detection_delay_s !== null && warn?.detection_delay_s !== undefined) parts.push(`WARNING went out ${formatSeconds(warn.detection_delay_s)} after the water crossed its line`);
  if (danger?.detection_delay_s !== null && danger?.detection_delay_s !== undefined) parts.push(`DANGER ${formatSeconds(danger.detection_delay_s)} after`);
  let s = parts.length ? `${parts.join(', and ')}.` : 'No alert was sent.';
  if (on.warning_lead_s !== null) {
    s += on.warning_lead_s > 0
      ? ` Residents had ${formatSeconds(on.warning_lead_s)} between the WARNING alert and the water reaching DANGER.`
      : ' The water reached DANGER before any WARNING could go out, so there was no lead time.';
  }
  const cost = (danger?.detection_delay_s ?? 0) - (dangerOff?.detection_delay_s ?? 0);
  if (cost > 0.5) s += ` The fault filter cost ${formatSeconds(cost)} here, one camera cycle to confirm the jump.`;
  return s;
}

export interface SensorHealthRow {
  cameraId: string;
  name: string;
  held: number;
  total: number;
  lastFault: string | null;
  lastFaultAt: string | null;
}

/** Per camera: how many recent readings the fault filter held, and the latest reason. Sorted, worst first. */
export function sensorHealth(cameras: Camera[], history: Record<string, Reading[]>): SensorHealthRow[] {
  return cameras
    .map((c) => {
      const list = history[c.id] ?? [];
      const held = list.filter((r) => r.accepted === false);
      const last = held[held.length - 1];
      return { cameraId: c.id, name: c.name, held: held.length, total: list.length, lastFault: last?.fault ?? null, lastFaultAt: last?.timestamp ?? null };
    })
    .sort((a, b) => b.held - a.held || a.name.localeCompare(b.name));
}
