// Family circle state, shared by the map, Home and Profile. Module-level, read through hooks/useFamily
// (useSyncExternalStore), like the vision store.
//
// What is real: your own position when you turn on "Use my phone's location" (browser geolocation, asked once, never
// sent to a server by this store), and your check-ins and SOS. What is simulated: every other member, their movement and
// battery, and their replies. Nothing here is sent anywhere except the Telegram messages the UI sends on SOS or check-in.
import { DEMO_CIRCLES, DEMO_MEMBERS, DEMO_PLACES, DRIVER_FALLBACK, DRIVER_ID, DRIVER_PERIOD_S, DRIVER_ROUTE_KEY, YOU_ID } from '../../data/familyDemo';
import { pingPong, placeChange, type Circle, type CircleEvent, type EventKind, type FamilyMember, type Place } from '../../lib/family';
import { haversineM, toRoadRoute, type LatLon } from '../../lib/routing';

export type GpsState = 'off' | 'asking' | 'on' | 'denied' | 'unavailable';

export interface FamilyState {
  circles: Circle[];
  circleId: string;
  members: Record<string, FamilyMember>;
  places: Place[];
  /** Newest first. */
  events: CircleEvent[];
  /** You share your position with the circle. Off hides you from the others (in a real build; here it is a setting). */
  sharing: boolean;
  gps: GpsState;
  /** Accuracy of the last phone fix, in metres. */
  gpsAccuracyM: number | null;
}

const STORAGE_KEY = 'floodway_family_v1';
const EVENTS_MAX = 40;
const TICK_MS = 2000;

interface Saved {
  circleId?: string;
  sharing?: boolean;
  events?: CircleEvent[];
  alertsOff?: string[];
  you?: Pick<FamilyMember, 'status' | 'statusAt'>;
}

function load(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : {};
  } catch {
    return {};
  }
}

function save(s: FamilyState) {
  try {
    const you = s.members[YOU_ID];
    const saved: Saved = {
      circleId: s.circleId,
      sharing: s.sharing,
      events: s.events.slice(0, EVENTS_MAX),
      alertsOff: s.places.filter((p) => !p.alerts).map((p) => p.id),
      you: { status: you.status, statusAt: you.statusAt },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // storage blocked (private window): the circle still works for this visit
  }
}

function initial(): FamilyState {
  const saved = load();
  const now = Date.now();
  const members: Record<string, FamilyMember> = {
    [YOU_ID]: {
      id: YOU_ID,
      name: 'You',
      relation: 'You',
      colors: ['#4096FF', '#0958D9'],
      avatar: '/media/avatars/avatar-you.jpg',
      isYou: true,
      lat: 3.1642,
      lon: 101.7031,
      source: 'demo',
      battery: 82,
      updatedAt: now,
      since: now - 40 * 60000,
      status: saved.you?.status ?? 'ok',
      statusAt: saved.you?.statusAt,
    },
  };
  for (const { sinceMinAgo, ...m } of DEMO_MEMBERS) {
    members[m.id] = { ...m, updatedAt: now - Math.round(Math.random() * 90000), since: sinceMinAgo === null ? null : now - sinceMinAgo * 60000 };
  }
  const off = new Set(saved.alertsOff ?? []);
  return {
    circles: DEMO_CIRCLES,
    circleId: DEMO_CIRCLES.some((c) => c.id === saved.circleId) ? saved.circleId! : DEMO_CIRCLES[0].id,
    members,
    places: DEMO_PLACES.map((p) => ({ ...p, alerts: !off.has(p.id) })),
    events: saved.events ?? [],
    sharing: saved.sharing ?? true,
    gps: 'off',
    gpsAccuracyM: null,
  };
}

let state: FamilyState = initial();
const listeners = new Set<() => void>();

export const getState = (): FamilyState => state;
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function set(next: Partial<FamilyState>, persist = false) {
  state = { ...state, ...next };
  if (persist) save(state);
  listeners.forEach((l) => l());
}

function patchMember(id: string, patch: Partial<FamilyMember>) {
  const m = state.members[id];
  if (!m) return;
  set({ members: { ...state.members, [id]: { ...m, ...patch } } });
}

let seq = 0;
function log(memberId: string, kind: EventKind, text: string): CircleEvent {
  const e: CircleEvent = { id: `ev-${Date.now()}-${seq++}`, at: Date.now(), memberId, kind, text };
  set({ events: [e, ...state.events].slice(0, EVENTS_MAX) }, true);
  return e;
}

const firstName = (id: string) => (id === YOU_ID ? 'You' : (state.members[id]?.name ?? 'Someone'));

// ---- Simulation: only the driver moves; everyone else stays where they are and refreshes now and then. ----

let refs = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let driverLine: LatLon[] | null = null;
let routeLoad: Promise<void> | null = null;

function loadDriverRoute() {
  routeLoad ??= import('../../data/klRoutes.json')
    .then((m) => {
      const raw = (m.default as unknown as { routes: Record<string, Parameters<typeof toRoadRoute>[0][]> }).routes[DRIVER_ROUTE_KEY]?.[0];
      driverLine = raw ? toRoadRoute(raw).line : null;
    })
    .catch(() => {
      driverLine = null;
    });
}

function tick() {
  const now = Date.now();
  const driver = state.members[DRIVER_ID];
  const members = { ...state.members };
  if (driver) {
    const prev: LatLon = [driver.lat, driver.lon];
    const pos = driverLine ? pingPong(driverLine, now / 1000, DRIVER_PERIOD_S).pos : DRIVER_FALLBACK;
    const moved = haversineM(prev, pos);
    // a slow drain while driving, but it is charging in the car, so it creeps up instead
    const battery = Math.min(100, driver.battery + (driver.charging ? 0.02 : -0.02));
    members[DRIVER_ID] = { ...driver, lat: pos[0], lon: pos[1], updatedAt: now, battery, speedKmh: Math.round(Math.min(70, (moved / (TICK_MS / 1000)) * 3.6)) };
    const change = placeChange(prev, pos, state.places);
    if (change.left?.alerts) queueMicrotask(() => log(DRIVER_ID, 'left', `${firstName(DRIVER_ID)} left ${change.left!.name}`));
    if (change.arrived?.alerts) queueMicrotask(() => log(DRIVER_ID, 'arrived', `${firstName(DRIVER_ID)} arrived at ${change.arrived!.name}`));
  }
  // still members report in about once a minute, as a phone in a pocket does
  for (const id of Object.keys(members)) {
    const m = members[id];
    if (id === DRIVER_ID || m.source === 'gps') continue;
    if (now - m.updatedAt > 60000) members[id] = { ...m, updatedAt: now - Math.round(Math.random() * 5000) };
  }
  set({ members });
}

/** Start the simulation while any screen that shows the circle is mounted. */
export function acquire() {
  refs++;
  if (timer) return;
  loadDriverRoute();
  tick();
  timer = setInterval(tick, TICK_MS);
}

export function release() {
  refs = Math.max(0, refs - 1);
  if (refs === 0 && timer) {
    clearInterval(timer);
    timer = null;
  }
}

// ---- Your position ----

let watchId: number | null = null;

/** Where you are when the phone's location is off: the demo position picked in the header. */
export function setDemoPosition(lat: number, lon: number) {
  const you = state.members[YOU_ID];
  if (you.source === 'gps' || (you.lat === lat && you.lon === lon)) return;
  patchMember(YOU_ID, { lat, lon, updatedAt: Date.now(), since: Date.now() });
}

export function startGps() {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    set({ gps: 'unavailable' });
    return;
  }
  if (watchId !== null) return;
  set({ gps: 'asking' });
  watchId = navigator.geolocation.watchPosition(
    (p) => {
      const prev = state.members[YOU_ID];
      const moved = haversineM([prev.lat, prev.lon], [p.coords.latitude, p.coords.longitude]) > 50;
      set({ gps: 'on', gpsAccuracyM: Math.round(p.coords.accuracy) });
      patchMember(YOU_ID, {
        lat: p.coords.latitude,
        lon: p.coords.longitude,
        source: 'gps',
        updatedAt: Date.now(),
        since: moved || prev.source !== 'gps' ? Date.now() : prev.since,
      });
    },
    (err) => {
      stopGps(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
    },
    { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
  );
}

export function stopGps(next: GpsState = 'off') {
  if (watchId !== null && typeof navigator !== 'undefined') navigator.geolocation.clearWatch(watchId);
  watchId = null;
  patchMember(YOU_ID, { source: 'demo' });
  set({ gps: next, gpsAccuracyM: null });
}

// ---- Actions ----

export function setCircle(id: string) {
  if (state.circles.some((c) => c.id === id)) set({ circleId: id }, true);
}

export function setSharing(on: boolean) {
  set({ sharing: on }, true);
}

export function togglePlaceAlerts(id: string) {
  set({ places: state.places.map((p) => (p.id === id ? { ...p, alerts: !p.alerts } : p)) }, true);
}

export function checkIn(placeName: string): CircleEvent {
  patchMember(YOU_ID, { status: 'checked-in', statusAt: Date.now() });
  return log(YOU_ID, 'check-in', `You checked in at ${placeName}`);
}

export function startSos(): CircleEvent {
  patchMember(YOU_ID, { status: 'sos', statusAt: Date.now() });
  return log(YOU_ID, 'sos', 'You sent an SOS with your position');
}

export function markSafe(): CircleEvent {
  patchMember(YOU_ID, { status: 'ok', statusAt: Date.now() });
  return log(YOU_ID, 'safe', 'You marked yourself safe');
}

const replyTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Ask a member to check in. Demo members answer by themselves a few seconds later (a simulated reply). */
export function askCheckIn(memberId: string) {
  if (memberId === YOU_ID || !state.members[memberId]) return;
  log(memberId, 'ask', `You asked ${firstName(memberId)} to check in`);
  clearTimeout(replyTimers.get(memberId));
  replyTimers.set(
    memberId,
    setTimeout(() => {
      patchMember(memberId, { status: 'checked-in', statusAt: Date.now() });
      log(memberId, 'check-in', `${firstName(memberId)} checked in: "I'm safe" (simulated reply)`);
    }, 4000),
  );
}

export function sendRoute(memberId: string, centreName: string) {
  log(memberId, 'route', `You sent ${firstName(memberId)} the safe route to ${centreName}`);
}

export function clearEvents() {
  set({ events: [] }, true);
}

/** Members of the current circle, in circle order. */
export function circleMembers(s: FamilyState): FamilyMember[] {
  const c = s.circles.find((x) => x.id === s.circleId) ?? s.circles[0];
  return c.memberIds.map((id) => s.members[id]).filter((m): m is FamilyMember => Boolean(m));
}
