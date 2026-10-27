// Live link to Nadi's bench node through the browser's Web Serial API (Chrome/Edge on desktop). The ESP32's USB port
// and its Bluetooth "Standard Serial over Bluetooth link" port both show up in the port picker. Module-level so the
// header popover and the /live fusion tile share one connection; React reads it through hooks/useBenchSensor.
// Each reading is also forwarded to the backend (/api/v1/ingest) as fw-bench-01, unsigned: the device secret must
// never ship in the browser bundle, so a backend with VISION_WRITE_TOKEN set refuses it (use scripts/bench_bridge.py).
import type { BenchReading } from '../lib/benchSensor';
import { levelRank } from '../lib/vision/levelRules';
import type { Level } from '../types/vision';
import { benchAlertFor, BENCH_DEVICE_ID, parseBenchLine } from '../lib/benchSensor';
import { LEVEL_META } from '../lib/vision/levels';
import { API_BASE } from './vision/config';

export type BenchStatus = 'idle' | 'picking' | 'opening' | 'waiting' | 'live' | 'stalled' | 'error';

export interface BenchServerReply {
  ok: boolean;
  /** ACCEPTED or HELD from the backend, or a short error. */
  text: string;
  phase: string | null;
  at: number;
}

export interface BenchState {
  status: BenchStatus;
  /** Plain-language reason for the current status (errors, hints). */
  message: string | null;
  portLabel: string | null;
  reading: BenchReading | null;
  /** The level the UI and alerts use: up at once, down only after STABLE_READINGS readings agree (the sensor
   *  jitters ~0.1 cm, so water sitting on a threshold would otherwise flip it every reading). */
  level: Level | null;
  readingAt: number | null;
  count: number;
  /** Newest last; raw lines as they came off the port (for debugging). */
  lines: string[];
  server: BenchServerReply | null;
  /** Alerts worth telling someone about (see benchAlertFor), newest first. Shown as toasts and in the bell panel. */
  events: BenchEvent[];
}

export interface BenchEvent {
  id: number;
  level: Level;
  title: string;
  body: string;
  at: number;
}

const LINES_MAX = 6;
const STALL_MS = 5000;     // no line for this long while connected = stalled
const FORWARD_MS = 1000;   // forward at most one reading a second to the backend
const STABLE_READINGS = 3; // readings in a row before the level steps down
const REPEAT_MS = 30000;   // the same alert at most once every 30 s
const EVENTS_MAX = 20;

// Minimal Web Serial types (not in TypeScript's DOM lib).
interface SerialPortLike {
  open(o: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  getInfo(): { usbVendorId?: number; usbProductId?: number; bluetoothServiceClassId?: number | string };
}
interface SerialLike extends EventTarget {
  requestPort(): Promise<SerialPortLike>;
}
const serial = (): SerialLike | undefined => (navigator as unknown as { serial?: SerialLike }).serial;
export const webSerialSupported = (): boolean => typeof navigator !== 'undefined' && !!serial();

let state: BenchState = { status: 'idle', message: null, portLabel: null, reading: null, level: null, readingAt: null, count: 0, lines: [], server: null, events: [] };
const listeners = new Set<() => void>();
let port: SerialPortLike | null = null;
let reader: ReadableStreamDefaultReader<string> | null = null;
let stallTimer: ReturnType<typeof setInterval> | null = null;
let loop: Promise<void> | null = null;
let lastLineAt = 0;
let lastForward = 0;
let closing = false;
let belowCount = 0;
let lastAlertAt: Record<string, number> = {};

function set(patch: Partial<BenchState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}
export const getState = (): BenchState => state;
export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function describePort(p: SerialPortLike): string {
  const info = p.getInfo();
  return info.usbVendorId != null ? 'USB cable' : 'Bluetooth';
}

function explainOpenError(err: unknown): string {
  const e = err as { name?: string; message?: string };
  if (e?.name === 'NotFoundError') return 'No IoT node chosen.';
  if (e?.name === 'SecurityError') return 'The browser blocked serial access. Open the app from http://localhost and allow it.';
  if (e?.name === 'InvalidStateError') return 'That port is already open in this tab. Disconnect first.';
  // NetworkError: the OS refused the port. Almost always another program holds it.
  return 'Could not connect. Close any other app using the IoT node (Arduino Serial Monitor, the Python bridge, a phone), then try again. For Bluetooth, check the node is on and paired.';
}

async function forward(r: BenchReading) {
  const now = Date.now();
  if (now - lastForward < FORWARD_MS) return;
  lastForward = now;
  try {
    const res = await fetch(`${API_BASE}/api/v1/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: BENCH_DEVICE_ID, ts: Math.floor(now / 1000), distance_cm: r.distanceCm }),
      signal: AbortSignal.timeout(3000),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) set({ server: { ok: true, text: body.status ?? 'ACCEPTED', phase: body.phase ?? null, at: Date.now() } });
    else if (res.status === 401) set({ server: { ok: false, text: 'Server needs a write token', phase: null, at: Date.now() } });
    else set({ server: { ok: false, text: `HTTP ${res.status}: ${body.detail ?? 'refused'}`, phase: null, at: Date.now() } });
  } catch {
    set({ server: { ok: false, text: 'FloodWay server not reachable', phase: null, at: Date.now() } });
  }
}

// Rising shows at once: a flood alarm must never lag the water. Falling waits for STABLE_READINGS readings in a
// row below the current level, so water sitting on a threshold does not flip the level back and forth.
function stableLevel(raw: Level): Level {
  if (state.level == null || levelRank(raw) >= levelRank(state.level)) {
    belowCount = 0;
    return raw;
  }
  belowCount += 1;
  if (belowCount < STABLE_READINGS) return state.level;
  belowCount = 0;
  return raw;
}

// The first reading after connecting, then only the level changes benchAlertFor cares about.
function eventFor(before: Level | null, now: Level, r: BenchReading): BenchEvent | null {
  const alert = before == null ? { level: 'NORMAL' as Level, title: 'IoT node connected' } : before === now ? null : benchAlertFor(before, now);
  if (!alert) return null;
  const at = Date.now();
  if (at - (lastAlertAt[alert.title] ?? 0) < REPEAT_MS) return null;
  lastAlertAt[alert.title] = at;
  const body = before == null ? `Water level ${r.pct}% (${LEVEL_META[now].label}).` : `IoT node at ${r.pct}% (${r.waterCm.toFixed(1)} cm of water).`;
  return { id: at, level: alert.level, title: alert.title, body, at };
}

function onLine(raw: string) {
  const line = raw.trim();
  if (!line) return;
  lastLineAt = Date.now();
  const lines = [...state.lines, line].slice(-LINES_MAX);
  const reading = parseBenchLine(line);
  if (!reading) {
    set({ lines, status: state.status === 'stalled' ? 'waiting' : state.status });
    return;
  }
  const level = stableLevel(reading.level);
  const event = eventFor(state.level, level, reading);
  const events = event ? [event, ...state.events].slice(0, EVENTS_MAX) : state.events;
  set({ lines, reading, level, events, readingAt: lastLineAt, count: state.count + 1, status: 'live', message: null });
  void forward(reading);
}

async function readLoop() {
  if (!port?.readable) return;
  const decoded = port.readable.pipeThrough(new TextDecoderStream() as unknown as ReadableWritablePair<string, Uint8Array>);
  reader = decoded.getReader();
  let buf = '';
  let first = true; // the first chunk can start mid-line; drop that partial line
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += value;
      const parts = buf.split(/\r?\n/);
      buf = parts.pop() ?? '';
      if (first && parts.length) {
        parts.shift();
        first = false;
      }
      parts.forEach(onLine);
    }
  } catch {
    if (!closing && state.status !== 'error') set({ status: 'error', message: 'Lost the IoT node: cable unplugged, node restarted or Bluetooth dropped. Connect again.' });
  } finally {
    reader?.releaseLock();
    reader = null;
  }
  if (!closing && state.status !== 'error') set({ status: 'error', message: 'The connection closed. Connect again.' });
  await closePort();
}

// Only the read loop closes the port, after its reader let go: closing a port that is still being read fails.
async function closePort() {
  if (stallTimer) clearInterval(stallTimer);
  stallTimer = null;
  const p = port;
  port = null;
  try {
    await p?.close();
  } catch {
    /* already closed */
  }
}

export async function connect(): Promise<void> {
  const s = serial();
  if (!s) {
    set({ status: 'error', message: 'This browser cannot connect to the IoT node. Use Chrome or Edge on a laptop.' });
    return;
  }
  if (port) return;
  closing = false;
  set({ status: 'picking', message: 'Choose the IoT node in the browser window.' });
  let picked: SerialPortLike;
  try {
    picked = await s.requestPort();
  } catch (err) {
    set({ status: 'idle', message: explainOpenError(err) });
    return;
  }
  set({ status: 'opening', message: 'Connecting. Bluetooth can take up to 10 s.', portLabel: describePort(picked) });
  try {
    await picked.open({ baudRate: 115200 });
  } catch (err) {
    set({ status: 'error', message: explainOpenError(err) });
    return;
  }
  port = picked;
  lastLineAt = Date.now();
  belowCount = 0;
  lastAlertAt = {};
  set({ status: 'waiting', message: 'Connected. Waiting for the first reading.', count: 0, lines: [], reading: null, level: null, readingAt: null, server: null });
  stallTimer = setInterval(() => {
    if (Date.now() - lastLineAt < STALL_MS) return;
    if (state.status === 'live' || state.status === 'waiting') {
      set({
        status: 'stalled',
        message: state.count === 0
          ? 'Connected, but no reading yet. Try the other connection (USB or Bluetooth).'
          : 'No reading for 5 s. Check the IoT node is powered and in range.',
      });
    }
  }, 1000);
  loop = readLoop();
}

export async function disconnect(): Promise<void> {
  closing = true;
  try {
    await reader?.cancel();
  } catch {
    /* already cancelled */
  }
  await loop;
  loop = null;
  set({ status: 'idle', message: null, portLabel: null, reading: null, level: null, readingAt: null });
}

// Unplugging the USB cable fires this on navigator.serial.
serial()?.addEventListener('disconnect', (e) => {
  if (port && (e.target as unknown) === port) set({ status: 'error', message: 'The IoT node was unplugged. Plug it back in and connect again.' });
});
