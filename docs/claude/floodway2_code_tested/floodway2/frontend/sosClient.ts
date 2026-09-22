/** SOS client: idempotent send, offline queue, SMS fallback. No framework imports so it is unit-testable in Node. */
export interface SosPayload {
  family_group_id: string;
  lat: number;
  lon: number;
  accuracy_m?: number;
  battery_pct?: number;
  level_m?: number;
  shelter_name?: string;
  note?: string;
  idempotency_key: string;
}
export type SosResult = { state: "sent" | "queued" | "rejected"; detail?: string };

const QUEUE_KEY = "fw.sos.queue.v1";
const readQueue = (): SosPayload[] => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]"); } catch { return []; }
};
const writeQueue = (q: SosPayload[]) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-5)));

export const newKey = (): string =>
  (globalThis.crypto as Crypto & { randomUUID?: () => string })?.randomUUID?.() ?? `k${Date.now()}${Math.random().toString(16).slice(2)}`;

async function post(p: SosPayload, token: string, base: string, timeoutMs: number): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    return await fetch(`${base}/api/v1/sos`, {
      method: "POST", signal: ctl.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(p),
    });
  } finally { clearTimeout(timer); }
}

export async function sendSos(p: SosPayload, getToken: () => Promise<string>, base = "", timeoutMs = 8000): Promise<SosResult> {
  try {
    const r = await post(p, await getToken(), base, timeoutMs);
    if (r.ok || r.status === 429) return { state: "sent" };            // 429 = already sent a moment ago
    if (r.status >= 400 && r.status < 500) return { state: "rejected", detail: `HTTP ${r.status}` };
    throw new Error(`HTTP ${r.status}`);
  } catch {
    const q = readQueue();
    if (!q.some((x) => x.idempotency_key === p.idempotency_key)) writeQueue([...q, p]);
    return { state: "queued" };
  }
}

/** Call on app start, on window 'online', and on a 15 s timer while a queue exists. Same idempotency_key => no double SMS. */
export async function flushQueue(getToken: () => Promise<string>, base = ""): Promise<number> {
  const q = readQueue();
  const remaining: SosPayload[] = [];
  let sent = 0;
  for (const p of q) {
    const r = await sendSos(p, getToken, base);                         // re-queues itself on failure
    if (r.state === "sent") sent++;
    else if (r.state === "queued") remaining.push(p);
  }
  // sendSos re-wrote the queue for failures; make the stored queue exactly the still-pending ones
  writeQueue(remaining);
  return sent;
}

export function sosText(p: Pick<SosPayload, "lat" | "lon" | "level_m" | "shelter_name" | "battery_pct">): string {
  const parts = ["BANJIR / FLOOD:"];
  if (p.level_m != null) parts.push(`air ${p.level_m.toFixed(2)} m / water ${p.level_m.toFixed(2)} m at home.`);
  parts.push(p.shelter_name ? `Menuju / heading to ${p.shelter_name}.` : "Sedang berpindah / evacuating.");
  parts.push(`Lokasi: https://maps.google.com/?q=${p.lat.toFixed(5)},${p.lon.toFixed(5)}`);
  if (p.battery_pct != null) parts.push(`Bateri ${p.battery_pct}%`);
  return parts.join(" ");
}

/** Works with NO data connection (only cell signal): opens the SMS composer pre-filled. iOS and Android differ on the separator. */
export function smsHref(numbers: string[], body: string, userAgent = ""): string {
  const sep = /iPhone|iPad|iPod/i.test(userAgent) ? "&" : "?";
  return `sms:${numbers.join(",")}${sep}body=${encodeURIComponent(body)}`;
}
