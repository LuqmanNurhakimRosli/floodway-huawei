// Contracts for Live Vision. Field names are snake_case on purpose: they mirror the backend JSON exactly,
// so there is no mapping layer to get wrong.

export type Level = 'NORMAL' | 'ADVISORY' | 'WARNING' | 'DANGER';
export type Provider = 'public' | 'city' | 'mine';
export type SourceType = 'snapshot' | 'stream' | 'synthetic' | 'file' | 'upload';
export type Trend = 'rising' | 'steady' | 'falling';

export type Point = [number, number]; // normalised 0..1, (x, y), y = 0 is the top of the frame

export interface Lines {
  normal: number;
  warning: number;
  danger: number; // danger < warning < normal (smaller y = higher water)
}

export interface Calibration {
  roi: Point[];
  lines: Lines;
}

export interface Reading {
  camera_id: string;
  timestamp: string;
  window_seconds: number;
  frames_analyzed: number;
  water_ratio: number;
  waterline_y: number | null;
  level: Level;
  observed_level: Level;
  confidence: number;
  low_confidence: boolean;
  lines_crossed: string[];
  trend: Trend;
  model: string;
  latency_ms: number;
  action: 'none' | 'show_on_map';
  /** false when the fault filter held this reading as an implausible jump (shown, but the level did not move on it). */
  accepted?: boolean;
  fault?: string | null;
}

export interface Camera {
  id: string;
  name: string;
  provider: Provider;
  lat: number;
  lon: number;
  source_type: SourceType;
  is_playback: boolean;
  online: boolean;
  interval_s: number;
  feed_refresh_s: number;
  last_frame_at: string | null;
  calibration: Calibration;
  reading: Reading | null;
}

export interface AlertEvent {
  id: string;
  camera_id: string;
  camera_name: string;
  level: Level;
  water_ratio: number;
  timestamp: string;
  message: string;
  /** When the reading first crossed this level, and how long confirmation took (lead-time log). */
  first_crossed_at?: string | null;
  detection_delay_s?: number | null;
}

export interface LeadTimeEntry {
  camera_id: string;
  camera_name: string;
  level: Level;
  crossed_at: string;
  alerted_at: string;
  detection_delay_s: number;
  source: 'live' | 'storm-lab';
}

/** A SIMULATED underpass barrier. No real road barrier is connected. */
export interface Barrier {
  id: string;
  name: string;
  lat: number;
  lon: number;
  radius_m: number;
  trigger: string; // "camera:<id>" or "node:<device id>"
  trigger_name: string;
  mode: 'auto' | 'manual';
  state: 'OPEN' | 'CLOSED';
  changed_at: string | null;
  reason: string;
  last_level: Level | null;
  is_simulated: boolean;
}

export interface BarrierEvent {
  id: string;
  barrier_id: string;
  barrier_name: string;
  state: 'OPEN' | 'CLOSED';
  cause: 'auto' | 'manual' | 'resume';
  reason: string;
  timestamp: string;
  trigger: string;
  level: Level | null;
  value: number | null;
}

export type BarrierAction = 'close' | 'open' | 'auto';

// ───────── storm lab (synthetic replay) ─────────
export interface StormScenario {
  id: string;
  title: string;
  description: string;
  duration_s: number;
}

export interface StormTimelinePoint {
  t: number;
  truth: number;
  measured: number | null;
  level: Level;
  held: boolean;
}

export interface StormLevelTiming {
  level: Level;
  truth_crossed_at: number | null;
  alert_at: number | null;
  detection_delay_s: number | null;
}

export interface StormResult {
  fault_filter: boolean;
  timeline: StormTimelinePoint[];
  alerts: { t: number; level: Level; truth: number; false_alert: boolean }[];
  barrier_events: { t: number; state: 'OPEN' | 'CLOSED'; reason: string }[];
  metrics: {
    timings: StormLevelTiming[];
    warning_lead_s: number | null;
    held_readings: number;
    false_alerts: number;
    barrier_closed_at: number | null;
    barrier_close_delay_s: number | null;
  };
}

export interface StormRun {
  id: string;
  scenario: string;
  title: string;
  description: string;
  created_at: string;
  interval_s: number;
  analyzer: string;
  with_filter: StormResult;
  without_filter: StormResult;
  note: string;
}

export interface CameraDraft {
  name: string;
  provider: Provider;
  lat: number;
  lon: number;
  source_type: 'snapshot' | 'stream' | 'upload';
  source_url: string;
  username?: string;
  password?: string;
  interval_s: number;
  feed_refresh_s: number;
  calibration: Calibration;
}

export type ServerMessage =
  | { type: 'snapshot'; cameras: Camera[] }
  | { type: 'reading'; reading: Reading }
  | { type: 'alert'; alert: AlertEvent }
  | { type: 'status'; camera_id: string; online: boolean }
  | { type: 'camera'; camera: Camera }
  | { type: 'camera_removed'; camera_id: string }
  | { type: 'barrier'; barrier: Barrier; event: BarrierEvent }
  | { type: 'ping' };
