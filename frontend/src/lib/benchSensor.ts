// Nadi's bench node (firmware/floodway_bench_node.ino): an ESP32 over a demo cup that prints one line per reading,
// "pct,STATUS,distance_cm" (e.g. "57,WARNING,4.0"), on USB Serial and Bluetooth. Same parsing as
// scripts/bench_bridge.py, and the same cup and thresholds as DEVICES["fw-bench-01"] in backend/app/config.py.
import type { Level } from '../types/vision';
import { levelRank } from './vision/levelRules';

export const BENCH_DEVICE_ID = 'fw-bench-01';
export const MOUNT_HEIGHT_CM = 8;   // sensor to cup bottom
export const FULL_DISTANCE_CM = 1;
export const WARNING_WATER_CM = 3;  // warning_threshold_m 0.03
export const DANGER_WATER_CM = 5;   // danger_threshold_m 0.05
// The backend's phase machine calls ADVISORY from 75% of the warning level.
export const ADVISORY_WATER_CM = WARNING_WATER_CM * 0.75;

export interface BenchReading {
  distanceCm: number;
  waterCm: number;
  /** Share of the usable cup depth, 0-100. */
  pct: number;
  level: Level;
  /** What the ESP32 itself shows on its LEDs (SAFE, WARNING, DANGER), when the line carries it. */
  deviceStatus: string | null;
}

export function levelForWater(waterCm: number): Level {
  if (waterCm >= DANGER_WATER_CM) return 'DANGER';
  if (waterCm >= WARNING_WATER_CM) return 'WARNING';
  if (waterCm >= ADVISORY_WATER_CM) return 'ADVISORY';
  return 'NORMAL';
}

const toNum = (s: string | undefined): number => (s == null || s.trim() === '' ? NaN : Number(s));

/** One ESP32 line to a reading, or null for debug lines ("# ..."), boot noise and anything unparseable.
 *  Accepts "57,WARNING,4.0", the older "57,WARNING" (distance worked back from the percentage), "dist: 3.5" and "3.5". */
export function parseBenchLine(raw: string): BenchReading | null {
  const line = raw.trim();
  if (!line || line.startsWith('#')) return null;
  let distance: number | null = null;
  let deviceStatus: string | null = null;

  if (line.includes(',')) {
    const parts = line.split(',').map((p) => p.trim());
    deviceStatus = /^[A-Z]+$/.test(parts[1] ?? '') ? parts[1] : null;
    if (parts.length >= 3) distance = toNum(parts[2]);
    else distance = MOUNT_HEIGHT_CM - (toNum(parts[0]) / 100) * (MOUNT_HEIGHT_CM - FULL_DISTANCE_CM);
  } else if (/dist/i.test(line)) {
    distance = toNum(line.split(':')[1]?.replace(/cm/i, ''));
  } else {
    distance = toNum(line);
    if (distance > MOUNT_HEIGHT_CM) return null;
  }
  // The firmware never sends under 1 cm, so a smaller value is a cut-off line (the "0" of "4.0"), not a full cup.
  if (distance == null || !Number.isFinite(distance) || distance < FULL_DISTANCE_CM) return null;

  const distanceCm = Math.round(Math.min(MOUNT_HEIGHT_CM, Math.max(FULL_DISTANCE_CM, distance)) * 10) / 10;
  const waterCm = Math.round((MOUNT_HEIGHT_CM - distanceCm) * 10) / 10;
  const pct = Math.round((waterCm / (MOUNT_HEIGHT_CM - FULL_DISTANCE_CM)) * 100);
  return { distanceCm, waterCm, pct, level: levelForWater(waterCm), deviceStatus };
}

/** What deserves a toast when the steady level moves from `before` to `now`. Only the changes that matter:
 *  rising into WARNING or DANGER, and getting back to NORMAL after one. ADVISORY comes and goes quietly. */
export function benchAlertFor(before: Level, now: Level): { level: Level; title: string } | null {
  if (levelRank(now) > levelRank(before) && levelRank(now) >= levelRank('WARNING')) {
    return { level: now, title: now === 'DANGER' ? 'DANGER: water rising fast' : 'WARNING: water rising' };
  }
  if (now === 'NORMAL' && levelRank(before) >= levelRank('WARNING')) return { level: 'NORMAL', title: 'Water back to normal' };
  return null;
}
