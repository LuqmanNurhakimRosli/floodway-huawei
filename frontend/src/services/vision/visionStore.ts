// Single source of truth for Live Vision. Module-level so the Live page AND the Map page share one connection.
// React reads it through hooks/vision/useVisionStore (useSyncExternalStore).
import type { AlertEvent, Camera, CameraDraft, Reading, ServerMessage } from '../../types/vision';
import { FORCE_MOCK } from './config';
import { mockCameras, startMockFeed } from './mockVision';
import * as api from './visionApi';
import { openVisionSocket } from './visionSocket';

export interface VisionState {
  cameras: Camera[];
  history: Record<string, Reading[]>;
  alerts: AlertEvent[];
  unseen: AlertEvent[]; // alerts not yet shown as a toast
  status: 'idle' | 'loading' | 'ready' | 'error';
  usingMock: boolean;
  connected: boolean;
  error: string | null;
}

const HISTORY_MAX = 60;
const POLL_MS = 5000;
const PROBE_MS = 8000; // while on sample data, keep checking whether the server came up

let state: VisionState = { cameras: [], history: {}, alerts: [], unseen: [], status: 'idle', usingMock: false, connected: false, error: null };
const listeners = new Set<() => void>();

let refs = 0;
let closeSocket: (() => void) | null = null;
let stopMock: (() => void) | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let probeTimer: ReturnType<typeof setInterval> | null = null;
let releaseTimer: ReturnType<typeof setTimeout> | null = null;

export const getState = (): VisionState => state;
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
      break;
    }
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
  setState({ cameras, history, alerts: [], unseen: [], usingMock: true, status: 'ready', connected: false, error: reason });
  stopMock = startMockFeed(applyMessage, (id) => state.cameras.find((c) => c.id === id)?.reading?.level);
  // Sample data is a fallback, not a mode to get stuck in: switch to the real server as soon as it answers.
  if (!FORCE_MOCK && !probeTimer) probeTimer = setInterval(() => void connectLive().catch(() => undefined), PROBE_MS);
}

/** Load from the server and open the push channel. Throws when the server cannot be reached. */
async function connectLive(): Promise<void> {
  const [cameras, alerts] = await Promise.all([api.listCameras(), api.listAlerts().catch(() => [] as AlertEvent[])]);
  if (probeTimer) clearInterval(probeTimer);
  probeTimer = null;
  stopMock?.();
  stopMock = null;
  let history: Record<string, Reading[]> = {};
  cameras.forEach((c) => {
    if (c.reading) history = pushHistory(history, c.reading);
  });
  setState({ cameras, alerts, unseen: [], history, status: 'ready', usingMock: false, error: null });
  closeSocket?.();
  closeSocket = openVisionSocket({
    onMessage: applyMessage,
    onOpen: () => setState({ connected: true }),
    onClose: () => setState({ connected: false }),
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
