// Offline sample feed. Used only when the backend is unreachable (or VITE_VISION_MOCK=1), so the page can still
// be designed, reviewed and demoed. It self-runs like the backend's sample cameras. It is NOT real data and the
// UI labels these cameras "Sample".
import type { AlertEvent, Camera, Level, Reading, ServerMessage } from '../../types/vision';
import { levelRank, ratioToLevel } from '../../lib/vision/levels';

const CAL = {
  roi: [[0.25, 0.3], [0.75, 0.3], [0.75, 0.92], [0.25, 0.92]] as [number, number][],
  lines: { normal: 0.806, warning: 0.639, danger: 0.361 },
};

interface Spec { id: string; name: string; provider: Camera['provider']; lat: number; lon: number; lo: number; hi: number; period: number; phase: number; offline?: boolean }

const SPECS: Spec[] = [
  { id: 'sample-klang-jamek', name: 'Sg. Klang @ Masjid Jamek', provider: 'city', lat: 3.149, lon: 101.696, lo: 0.4, hi: 1.1, period: 240, phase: 0 },
  { id: 'sample-gombak-tun-razak', name: 'Sg. Gombak @ Jln Tun Razak', provider: 'city', lat: 3.162, lon: 101.72, lo: 0.12, hi: 0.5, period: 300, phase: 0.3 },
  { id: 'sample-smart-tunnel', name: 'SMART Tunnel entrance', provider: 'public', lat: 3.138, lon: 101.703, lo: 0.03, hi: 0.18, period: 360, phase: 0.55 },
  { id: 'sample-batu-sentul', name: 'Sg. Batu @ Sentul', provider: 'public', lat: 3.184, lon: 101.693, lo: 0.05, hi: 0.3, period: 330, phase: 0.8 },
  { id: 'sample-kampung-baru-drain', name: 'Kampung Baru Drain', provider: 'mine', lat: 3.1642, lon: 101.7031, lo: 0.18, hi: 0.55, period: 270, phase: 0.15 },
  { id: 'sample-backyard-stream', name: 'Backyard Stream', provider: 'mine', lat: 3.17, lon: 101.71, lo: 0.1, hi: 0.2, period: 300, phase: 0, offline: true },
];

const ratioAt = (s: Spec, tSec: number) => (s.lo + s.hi) / 2 + ((s.hi - s.lo) / 2) * Math.sin(2 * Math.PI * (tSec / s.period + s.phase));

function makeReading(s: Spec, previous: Reading | null): Reading {
  const ratio = Math.max(0, ratioAt(s, Date.now() / 1000));
  const level = ratioToLevel(ratio);
  const delta = previous ? ratio - previous.water_ratio : 0;
  const lines: string[] = [];
  if (ratio >= 0.2) lines.push('normal');
  if (ratio >= 0.5) lines.push('warning');
  if (ratio >= 0.97) lines.push('danger');
  return {
    camera_id: s.id, timestamp: new Date().toISOString(), window_seconds: 2.1, frames_analyzed: 5,
    water_ratio: Number(ratio.toFixed(3)),
    waterline_y: Number((0.92 - ratio * 0.56).toFixed(4)),
    level, observed_level: level, confidence: 0.93, low_confidence: false, lines_crossed: lines,
    trend: delta > 0.004 ? 'rising' : delta < -0.004 ? 'falling' : 'steady',
    model: 'sample-data', latency_ms: 780, action: levelRank(level) >= 1 ? 'show_on_map' : 'none',
  };
}

export function mockCameras(): Camera[] {
  return SPECS.map((s) => ({
    id: s.id, name: s.name, provider: s.provider, lat: s.lat, lon: s.lon, source_type: 'synthetic', is_playback: true,
    online: !s.offline, interval_s: 8, feed_refresh_s: 0, last_frame_at: s.offline ? null : new Date().toISOString(),
    calibration: CAL, reading: s.offline ? null : makeReading(s, null),
  }));
}

/** Emits a 'reading' (and 'alert' on escalation) for every online sample camera each cycle. */
export function startMockFeed(onMessage: (m: ServerMessage) => void, getLevel: (id: string) => Level | undefined): () => void {
  const last = new Map<string, Reading>();
  const timer = setInterval(() => {
    for (const s of SPECS) {
      if (s.offline) continue;
      const reading = makeReading(s, last.get(s.id) ?? null);
      const before = getLevel(s.id) ?? 'NORMAL';
      last.set(s.id, reading);
      onMessage({ type: 'reading', reading });
      if (levelRank(reading.level) >= 2 && levelRank(reading.level) > levelRank(before)) {
        const alert: AlertEvent = {
          id: `mock-${s.id}-${Date.now()}`, camera_id: s.id, camera_name: s.name, level: reading.level,
          water_ratio: reading.water_ratio, timestamp: reading.timestamp,
          message: `${s.name} reached ${reading.level} (${Math.round(reading.water_ratio * 100)}% of bank height)`,
        };
        onMessage({ type: 'alert', alert });
      }
    }
  }, 8000);
  return () => clearInterval(timer);
}
