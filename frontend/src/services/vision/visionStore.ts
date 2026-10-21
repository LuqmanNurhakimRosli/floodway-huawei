// Single source of truth for Live Vision. Module-level so the Live page AND the Map page share one connection.
// React reads it through hooks/vision/useVisionStore (useSyncExternalStore).
import type { AlertEvent, Barrier, BarrierEvent, Camera, CameraDraft, Reading, ServerMessage } from '../../types/vision';
import { evaluateBarrier, SEED_BARRIERS } from '../../lib/vision/barriers';
import { FORCE_MOCK } from './config';
import { mockCameras, startMockFeed } from './mockVision';
import * as api from './visionApi';
import { openVisionSocket } from './visionSocket';

export interface VisionState {
  cameras: Camera[];
  history: Record<string, Reading[]>;
  alerts: AlertEvent[];
  unseen: AlertEvent[]; // alerts not yet shown as a toast
  /** Simulated underpass barriers and their change log (newest first). */
  barriers: Barrier[];
  barrierEvents: BarrierEvent[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  usingMock: boolean;
  connected: boolean;
  error: string | null;
}

const HISTORY_MAX = 60;
const POLL_MS = 5000;
const PROBE_MS = 8000; // while on sample data, keep checking whether the server came up

const BARRIER_LOG_MAX = 50;

let state: VisionState = {
  cameras: [], history: {}, alerts: [], unseen: [], barriers: [], barrierEvents: [], status: 'idle', usingMock: false, connected: false, error: null,
};
const listeners = new Set<() => void>();

let refs = 0;
let closeSocket: (() => void) | null = null;
let stopMock: (() => void) | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let probeTimer: ReturnType<typeof setInterval> | null = null;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;

export const getState = (): VisionState => state;

/** True when the server cannot be reached at all: no live socket AND the last REST refresh failed. A dropped socket
 *  alone is not "down" (polling still brings readings in), which is why both are required. */
export const isServerDown = (s: VisionState): boolean => s.status === 'ready' && !s.usingMock && !s.connected && s.error !== null;
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function setState(patch: Partial<VisionState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

// ───────── applying server messages ─────────
function pushHistory(history: Record<string, Reading[]>, r: Reading): Record<string, Reading[]> {
  const list = history[r.camera_id] ?? [];
  if (list.length && list[list.length - 1].timestamp === r.timestamp) return history;
  return { ...history, [r.camera_id]: [...list, r].slice(-HISTORY_MAX) };
}

function upsertCamera(cameras: Camera[], cam: Camera): Camera[] {
  return cameras.some((c) => c.id === cam.id) ? cameras.map((c) => (c.id === cam.id ? cam : c)) : [...cameras, cam];
}

export function applyMessage(msg: ServerMessage): void {
  switch (msg.type) {
    case 'snapshot': {
      let history = state.history;
      msg.cameras.forEach((c) => {
        if (c.reading) history = pushHistory(history, c.reading);
      });
      setState({ cameras: msg.cameras, history, status: 'ready' });
      break;
    }
    case 'reading': {
      const r = msg.reading;
      setState({
        cameras: state.cameras.map((c) => (c.id === r.camera_id ? { ...c, reading: r, online: true, last_frame_at: r.timestamp } : c)),
        history: pushHistory(state.history, r),
      });
      // On sample data there is no server to decide, so run the same barrier rule here.
      if (state.usingMock && r.accepted !== false) {
        const events: BarrierEvent[] = [];
        const barriers = state.barriers.map((b) => {
          const out = evaluateBarrier(b, `camera:${r.camera_id}`, r.level, r.water_ratio, r.timestamp);
          if (out.event) events.push(out.event);
          return out.barrier;
        });
        setState({ barriers, barrierEvents: events.length ? [...events, ...state.barrierEvents].slice(0, BARRIER_LOG_MAX) : state.barrierEvents });
      }
      break;
    }
    case 'barrier':
      setState({
        barriers: state.barriers.some((b) => b.id === msg.barrier.id)
          ? state.barriers.map((b) => (b.id === msg.barrier.id ? msg.barrier : b))
          : [...state.barriers, msg.barrier],
        barrierEvents: state.barrierEvents.some((e) => e.id === msg.event.id)
          ? state.barrierEvents
          : [msg.event, ...state.barrierEvents].slice(0, BARRIER_LOG_MAX),
      });
      break;
    case 'alert':
      if (!state.alerts.some((a) => a.id === msg.alert.id)) {
        setState({ alerts: [msg.alert, ...state.alerts].slice(0, 50), unseen: [msg.alert, ...state.unseen] });
      }
      break;
    case 'status':
      setState({ cameras: state.cameras.map((c) => (c.id === msg.camera_id ? { ...c, online: msg.online } : c)) });
      break;
    case 'camera':
      setState({ cameras: upsertCamera(state.cameras, msg.camera) });
      break;
    case 'camera_removed':
      setState({ cameras: state.cameras.filter((c) => c.id !== msg.camera_id) });
      break;
    default:
      break;
  }
}

// ───────── connection lifecycle ─────────
function startPolling(): void {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (!state.connected && !state.usingMock) void refresh();
  }, POLL_MS);
}

export async function refresh(): Promise<void> {
  try {
    const cameras = await api.listCameras();
    let history = state.history;
    cameras.forEach((c) => {
      if (c.reading) history = pushHistory(history, c.reading);
    });
    setState({ cameras, history, status: 'ready', error: null });
  } catch (err) {
    setState({ error: err instanceof Error ? err.message : 'Cannot reach the server' });
  }
}

function startMockMode(reason: string | null): void {
  const cameras = mockCameras();
  let history: Record<string, Reading[]> = {};
  cameras.forEach((c) => {
    if (c.reading) history = pushHistory(history, c.reading);
  });
  setState({
    cameras, history, alerts: [], unseen: [], barriers: SEED_BARRIERS.map((b) => ({ ...b })), barrierEvents: [],
    usingMock: true, status: 'ready', connected: false, error: reason,
  });
  stopMock = startMockFeed(applyMessage, (id) => state.cameras.find((c) => c.id === id)?.reading?.level);
  // Sample data is a fallback, not a mode to get stuck in: switch to the real server as soon as it answers.
  if (!FORCE_MOCK && !probeTimer) probeTimer = setInterval(() => void connectLive().catch(() => undefined), PROBE_MS);
}

/** Load from the server and open the push channel. Throws when the server cannot be reached. */
async function connectLive(): Promise<void> {
  const [cameras, alerts, barriers, barrierEvents] = await Promise.all([
    api.listCameras(),
    api.listAlerts().catch(() => [] as AlertEvent[]),
    api.listBarriers().catch(() => [] as Barrier[]), // an older server has no barriers: the page simply shows none
    api.listBarrierEvents().catch(() => [] as BarrierEvent[]),
  ]);
  if (probeTimer) clearInterval(probeTimer);
  probeTimer = null;
  stopMock?.();
  stopMock = null;
  let history: Record<string, Reading[]> = {};
  cameras.forEach((c) => {
    if (c.reading) history = pushHistory(history, c.reading);
  });
  setState({ cameras, alerts, unseen: [], history, barriers, barrierEvents, status: 'ready', usingMock: false, error: null });
  closeSocket?.();
  closeSocket = openVisionSocket({
    onMessage: applyMessage,
    onOpen: () => setState({ connected: true }),
    // A dropped socket triggers an immediate REST check, so a dead server is noticed now, not at the next 5 s poll.
    onClose: () => {
      setState({ connected: false });
      void refresh();
    },
  });
  startPolling();
}

async function start(): Promise<void> {
  setState({ status: 'loading' });
  if (FORCE_MOCK) return startMockMode(null);
  try {
    await connectLive();
  } catch (err) {
    startMockMode(err instanceof Error ? err.message : 'Cannot reach the server');
  }
}

function stop(): void {
  closeSocket?.();
  closeSocket = null;
  stopMock?.();
  stopMock = null;
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  if (probeTimer) clearInterval(probeTimer);
  probeTimer = null;
  setState({ status: 'idle', connected: false });
}

export function acquire(): void {
  refs += 1;
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  if (refs === 1 && state.status === 'idle') void start();
}

export function release(): void {
  refs = Math.max(0, refs - 1);
  if (refs === 0) releaseTimer = setTimeout(stop, 3000); // survive quick route changes (Live <-> Map)
}

// ───────── actions ─────────
export async function loadHistory(cameraId: string): Promise<void> {
  if (state.usingMock || (state.history[cameraId]?.length ?? 0) >= 10) return;
  try {
    const readings = await api.getReadings(cameraId, 30);
    if (readings.length) setState({ history: { ...state.history, [cameraId]: readings } });
  } catch {
    /* the sparkline just stays short */
  }
}

export async function analyzeNow(cameraId: string): Promise<void> {
  if (state.usingMock) return;
  applyMessage({ type: 'reading', reading: await api.analyzeNow(cameraId) });
}

export async function addCamera(draft: CameraDraft): Promise<Camera> {
  if (state.usingMock) {
    const cam: Camera = {
      id: `local-${Date.now()}`, name: draft.name, provider: draft.provider, lat: draft.lat, lon: draft.lon,
      source_type: draft.source_type, is_playback: false, online: false, interval_s: draft.interval_s,
      feed_refresh_s: draft.feed_refresh_s, last_frame_at: null, calibration: draft.calibration, reading: null,
    };
    setState({ cameras: [...state.cameras, cam] });
    return cam;
  }
  const cam = await api.createCamera(draft);
  setState({ cameras: upsertCamera(state.cameras, cam) });
  return cam;
}

export async function removeCamera(cameraId: string): Promise<void> {
  if (!state.usingMock) await api.deleteCamera(cameraId);
  setState({ cameras: state.cameras.filter((c) => c.id !== cameraId) });
}

export function ackAlert(alertId: string): void {
  setState({ unseen: state.unseen.filter((a) => a.id !== alertId) });
}
