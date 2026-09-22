import { floodMask, depthAt, type Terrain } from "./floodMask.ts";
import { sendSos, flushQueue, smsHref, sosText, type SosPayload } from "./sosClient.ts";
import assert from "node:assert/strict";

// ---- floodMask: a disconnected pit must NOT flood
const t: Terrain = { rows: 3, cols: 5, cell_m: 30, sensor_rc: [1, 0], ground_at_sensor_m: 8,
  elev_rel_m: [ 0.5, 0.5, 0.5, 0.5, 0.5,
                0.0, 0.2, 0.6, -0.5, 0.0,      // pit (-0.5) behind a 0.6 m ridge
                0.5, 0.5, 0.5, 0.5, 0.5 ] };
let m = floodMask(t, 0.3);
assert.equal(m[1 * 5 + 1], 1); assert.equal(m[1 * 5 + 3], 0, "isolated pit stays dry at 0.3 m");
m = floodMask(t, 0.7);
assert.equal(m[1 * 5 + 3], 1, "ridge overtopped at 0.7 m");
assert.ok(Math.abs(depthAt(t, 0.7, m, 1, 3) - 1.2) < 1e-9);

// ---- SOS client with fake browser globals
const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
let online = false; const seenKeys: string[] = [];
(globalThis as any).fetch = async (_u: string, init: any) => {
  if (!online) throw new TypeError("network down");
  seenKeys.push(JSON.parse(init.body).idempotency_key);
  return { ok: true, status: 200 } as Response;
};
const p: SosPayload = { family_group_id: "fam1", lat: 3.07, lon: 101.5, idempotency_key: "key-1234567" };
const tok = async () => "tkn";
const r1 = await sendSos(p, tok, "", 200); assert.equal(r1.state, "queued");
assert.equal(await flushQueue(tok), 0);                       // still offline: stays queued
assert.equal(JSON.parse(store.get("fw.sos.queue.v1")!).length, 1);
online = true;
assert.equal(await flushQueue(tok), 1);
assert.equal(JSON.parse(store.get("fw.sos.queue.v1")!).length, 0);
assert.deepEqual(seenKeys, ["key-1234567"]);
assert.ok(smsHref(["+601", "+602"], "a b", "iPhone").startsWith("sms:+601,+602&body=a%20b"));
assert.ok(smsHref(["+601"], "x", "Android").startsWith("sms:+601?body="));
console.log(sosText({ lat: 3.07, lon: 101.5, level_m: 0.32, shelter_name: "Dewan Serbaguna Seksyen 7", battery_pct: 41 }));
console.log("FRONTEND LOGIC TESTS PASSED");
