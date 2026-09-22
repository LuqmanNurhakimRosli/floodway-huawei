"""FloodWay 2.0 backend - sensor ingest, twin state, SOS. Run: uvicorn app:app --host 0.0.0.0 --port 8080"""
from __future__ import annotations

import hashlib
import hmac
import json
import math
import os
import time
from collections import defaultdict, deque
from statistics import median

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Response
from pydantic import BaseModel, Field

from clients import Forecaster, fetch_rain_window, make_notifier
from flood_core import HORIZONS_MIN, STEP_MIN, WINDOW
from trigger import RAIN_2H_WARN_MM, PhaseMachine

app = FastAPI(title="FloodWay 2.0 API", version="0.1.0")
forecaster, notifier = Forecaster(), make_notifier()

DEVICES: dict = json.loads(os.getenv("DEVICES", "{}"))       # {"fw-node-01": {"secret","mount_height_cm","lat","lon"}}
SHELTERS: list[dict] = json.loads(open(os.getenv("SHELTERS_FILE", "shelters.json")).read()) if os.path.exists(os.getenv("SHELTERS_FILE", "shelters.json")) else []
FAMILY: dict[str, list[str]] = json.loads(os.getenv("FAMILY", "{}"))    # demo only; use GaussDB in production
STALE_AFTER_S, MAX_SKEW_S, SOS_MIN_GAP_S = 600, 120, 30

readings: dict[str, deque] = defaultdict(lambda: deque(maxlen=2000))     # (ts, level_m)
machines: dict[str, PhaseMachine] = defaultdict(PhaseMachine)
raw_buf: dict[str, deque] = defaultdict(lambda: deque(maxlen=5))
sos_seen: dict[str, dict] = {}
sos_last: dict[str, float] = {}
_fc_cache: dict[str, tuple[float, dict | None, bool]] = {}
_rain_2h: dict[str, float] = {}


# ---------- helpers ----------
def haversine_m(lat1, lon1, lat2, lon2) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2
    return 2 * 6371000 * math.asin(math.sqrt(a))


def nearest_shelter(lat: float, lon: float) -> dict | None:
    if not SHELTERS:
        return None
    s = min(SHELTERS, key=lambda x: haversine_m(lat, lon, x["lat"], x["lon"]))
    return {**s, "distance_m": round(haversine_m(lat, lon, s["lat"], s["lon"]))}


def level_window(rs, now: float) -> list[float] | None:
    """24 x 15-min medians ending at `now`. Forward-fill <=2 empty buckets, back-fill the leading edge; else None."""
    step = STEP_MIN * 60
    buckets: list[list[float]] = [[] for _ in range(WINDOW)]
    for ts, lv in rs:
        idx = WINDOW - 1 - int((now - ts) // step)
        if 0 <= idx < WINDOW:
            buckets[idx].append(lv)
    vals = [median(b) if b else None for b in buckets]
    if sum(v is not None for v in vals) < WINDOW * 0.6:
        return None
    out, last, gap = [], None, 0
    for v in vals:
        if v is not None:
            last, gap = v, 0
            out.append(v)
        elif last is not None and gap < 2:
            gap += 1
            out.append(last)
        else:
            out.append(None)
    first = next((v for v in out if v is not None), None)
    i = 0
    while i < len(out) and out[i] is None:
        out[i] = first
        i += 1
    return None if any(v is None for v in out) else out


# ---------- auth ----------
async def current_user(authorization: str | None = Header(None), x_dev_user: str | None = Header(None)) -> str:
    if os.getenv("DEV_AUTH") == "1" and x_dev_user:
        return x_dev_user
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "missing bearer token")
    try:
        from firebase_admin import auth as fb_auth              # Firebase Auth kept as identity provider
        return fb_auth.verify_id_token(authorization[7:])["uid"]
    except Exception as e:                                        # noqa: BLE001
        raise HTTPException(401, f"invalid token: {e}") from e


# ---------- sensor ingest ----------
class Ingest(BaseModel):
    device_id: str
    ts: int
    distance_cm: float = Field(ge=20, le=600)                     # JSN-SR04T usable range
    sig: str


@app.post("/api/v1/ingest")
def ingest(p: Ingest):
    dev = DEVICES.get(p.device_id)
    if not dev:
        raise HTTPException(404, "unknown device")
    msg = f"{p.device_id}.{p.ts}.{p.distance_cm:.1f}".encode()
    good = hmac.new(dev["secret"].encode(), msg, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(good, p.sig):
        raise HTTPException(401, "bad signature")
    if abs(time.time() - p.ts) > MAX_SKEW_S:
        raise HTTPException(400, "timestamp skew (replay or unsynced clock)")
    raw_buf[p.device_id].append(p.distance_cm)
    dist = median(raw_buf[p.device_id])                            # kills single-sample spikes
    level_m = max(0.0, (dev["mount_height_cm"] - dist) / 100.0)
    readings[p.device_id].append((p.ts, level_m))
    m = machines[p.device_id]
    fc = _fc_cache.get(p.device_id)
    m.update(level_m, fc[1]["p50"] if fc and fc[1] else None, _rain_2h.get(p.device_id, 0.0))   # tick per reading
    return {"level_m": round(level_m, 3), "phase": m.phase}


@app.get("/api/v1/export.csv")
def export_csv(device_id: str):
    rows = "\n".join(f"{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(t))},{l:.3f}" for t, l in readings[device_id])
    return Response("ts,level_m\n" + rows, media_type="text/csv")


# ---------- twin state ----------
@app.get("/api/v1/twin/state")
async def twin_state(device_id: str, lat: float = Query(...), lon: float = Query(...), profile: str = "walking"):
    dev = DEVICES.get(device_id)
    if not dev:
        raise HTTPException(404, "unknown device")
    now = time.time()
    rs = readings[device_id]
    last_ts, level = (rs[-1] if rs else (0, 0.0))
    stale = (now - last_ts) > STALE_AFTER_S
    forecast, degraded, reason = None, False, []
    cached = _fc_cache.get(device_id)
    if cached and now - cached[0] < 120:
        forecast, degraded = cached[1], cached[2]
    else:
        lw, rw = level_window(rs, now), await fetch_rain_window(dev["lat"], dev["lon"])
        if rw:
            _rain_2h[device_id] = sum(rw[-8:])                     # last 2 h, feeds the rule-based safety net
            if _rain_2h[device_id] >= RAIN_2H_WARN_MM and machines[device_id].phase == "NORMAL":
                machines[device_id].phase = "WARNING"                # escalate-only here; de-escalation stays tied to sensor ticks
        if stale or lw is None or rw is None:
            degraded = True
        else:
            try:
                forecast = await forecaster.predict(rw, lw)
            except Exception:                                      # noqa: BLE001
                degraded = True
        _fc_cache[device_id] = (now, forecast, degraded)
    if stale:
        reason.append("sensor_stale")
    if degraded and not stale:
        reason.append("forecast_unavailable")
    m = machines[device_id]
    phase = m.phase                                            # never auto-downgrade because the sensor went quiet (it may be underwater)
    return {
        "device_id": device_id, "level_m": round(level, 3), "sensor_age_s": int(now - last_ts) if last_ts else None,
        "stale": stale, "phase": phase, "forecast": forecast, "forecast_source": forecaster.source,
        "degraded": degraded or stale, "degraded_reasons": reason, "horizons_min": list(HORIZONS_MIN),
        "profile": profile, "shelter": nearest_shelter(lat, lon),
        "disclaimer": "Indicative only. Follow NADMA / JPS / police instructions. Call 999 in an emergency.",
    }


# ---------- SOS ----------
class Sos(BaseModel):
    family_group_id: str
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    accuracy_m: float | None = None
    battery_pct: int | None = Field(None, ge=0, le=100)
    level_m: float | None = None
    shelter_name: str | None = Field(None, max_length=80)
    note: str = Field("", max_length=140)
    idempotency_key: str = Field(min_length=8, max_length=64)


@app.post("/api/v1/sos")
def sos(p: Sos, uid: str = Depends(current_user)):
    if p.idempotency_key in sos_seen:                              # client retries after flaky network
        return {**sos_seen[p.idempotency_key], "duplicate": True}
    now = time.time()
    if now - sos_last.get(uid, 0) < SOS_MIN_GAP_S:
        raise HTTPException(429, "SOS already sent a moment ago")
    recipients = FAMILY.get(p.family_group_id)
    if not recipients:
        raise HTTPException(404, "no family contacts registered for this group")
    where = f"https://maps.google.com/?q={p.lat:.5f},{p.lon:.5f}"
    parts = ["BANJIR / FLOOD:"]
    if p.level_m is not None:
        parts.append(f"air {p.level_m:.2f} m di rumah saya / water {p.level_m:.2f} m at my home.")
    parts.append(f"Menuju / heading to {p.shelter_name}." if p.shelter_name else "Sedang berpindah / evacuating.")
    parts.append(f"Lokasi: {where}")
    if p.battery_pct is not None:
        parts.append(f"Bateri {p.battery_pct}%")
    if p.note:
        parts.append(p.note)
    body = " ".join(parts)
    channel = notifier.send(recipients, "FloodWay SOS", body)
    sos_last[uid] = now
    result = {"status": "sent", "channel": channel, "recipients": len(recipients), "duplicate": False}
    sos_seen[p.idempotency_key] = result
    return result


@app.get("/healthz")
def healthz():
    return {"ok": True, "forecast_source": forecaster.source}
