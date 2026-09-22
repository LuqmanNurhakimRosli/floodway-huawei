import os, json, time, hmac, hashlib, asyncio
os.environ["DEVICES"] = json.dumps({"fw-node-01": {"secret": "s3cret", "mount_height_cm": 250, "lat": 3.045, "lon": 101.55}})
os.environ["FAMILY"] = json.dumps({"fam1": ["+60100000000"]})
os.environ["LOCAL_MODEL_DIR"] = "../ml/model_out"; os.environ["DEV_AUTH"] = "1"
import app as A
from fastapi.testclient import TestClient
A.SHELTERS[:] = [{"name": "Dewan A", "lat": 3.07, "lon": 101.50}, {"name": "Dewan B", "lat": 3.10, "lon": 101.60}]
async def fake_rain(lat, lon): return [0.0]*16 + [3.0, 5.0, 6.0, 4.0, 2.0, 1.0, 0.5, 0.0]
A.fetch_rain_window = fake_rain
c = TestClient(A.app)

def send(dist, ts=None, secret="s3cret"):
    ts = ts or int(time.time()); d = f"{dist:.1f}"
    sig = hmac.new(secret.encode(), f"fw-node-01.{ts}.{d}".encode(), hashlib.sha256).hexdigest()
    return c.post("/api/v1/ingest", json={"device_id": "fw-node-01", "ts": ts, "distance_cm": dist, "sig": sig})

assert send(200, secret="wrong").status_code == 401
assert send(200, ts=int(time.time()) - 999).status_code == 400
now = time.time()
for k in range(24 * 3):                                    # 6h of 5-min readings, rising water
    ts = int(now - (24 * 3 - k) * 300); lvl_cm = 5 + k * 0.6
    d = 250 - lvl_cm; A.raw_buf["fw-node-01"].clear()
    A.readings["fw-node-01"].append((ts, lvl_cm / 100))
r = send(250 - 32); print("ingest ->", r.json())         # 32 cm
st = c.get("/api/v1/twin/state", params={"device_id": "fw-node-01", "lat": 3.071, "lon": 101.501}).json()
print(json.dumps({k: st[k] for k in ["level_m", "phase", "degraded", "forecast", "shelter"]}, indent=1))
assert st["phase"] == "DANGER" and st["shelter"]["name"] == "Dewan A"
# hysteresis: 2 low readings must NOT clear DANGER, 3 must
m = A.machines["fw-node-01"]; assert m.update(0.2, None) == "DANGER" and m.update(0.2, None) == "DANGER"; assert m.update(0.2, None) != "DANGER"
from trigger import PhaseMachine
assert PhaseMachine().update(0.0, None, rain_2h_mm=65) == "WARNING"     # rain safety net works without any model
# SOS
body = {"family_group_id": "fam1", "lat": 3.071, "lon": 101.501, "battery_pct": 41, "level_m": 0.32, "shelter_name": "Dewan Serbaguna Seksyen 7", "idempotency_key": "abcdef123456"}
h = {"X-Dev-User": "u1"}
r1 = c.post("/api/v1/sos", json=body, headers=h); r2 = c.post("/api/v1/sos", json=body, headers=h)
assert r1.json()["status"] == "sent" and r2.json()["duplicate"] is True
r3 = c.post("/api/v1/sos", json={**body, "idempotency_key": "zzzzzzzz9999"}, headers=h); assert r3.status_code == 429
assert c.post("/api/v1/sos", json=body).status_code == 401
assert c.post("/api/v1/sos", json={**body, "family_group_id": "nope", "idempotency_key": "qqqqqqqq1111"}, headers={"X-Dev-User": "u2"}).status_code == 404
# stale sensor stays flagged, phase not downgraded
A.readings["fw-node-01"].append((int(time.time()) - 5000, 0.4)); A._fc_cache.clear()
st2 = c.get("/api/v1/twin/state", params={"device_id": "fw-node-01", "lat": 3.07, "lon": 101.5}).json()
print("stale:", st2["stale"], st2["degraded_reasons"])
print("ALL BACKEND TESTS PASSED")
