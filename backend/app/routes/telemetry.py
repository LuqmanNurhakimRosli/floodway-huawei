import time
import hmac
import hashlib
from collections import defaultdict, deque
from statistics import median
from fastapi import APIRouter, Header, HTTPException, Query, Request, Response
from pydantic import BaseModel, Field
from app.config import DEVICES, MAX_SKEW_SECONDS
from app.security import require_write_token
from app.services.phase_machine import PhaseMachine
from app.vision.fault_filter import JumpFilter
from app.vision.schemas import Level

router = APIRouter(prefix="/api/v1", tags=["Telemetry"])

readings: dict[str, deque] = defaultdict(lambda: deque(maxlen=2000))
raw_buffer: dict[str, deque] = defaultdict(lambda: deque(maxlen=5))
# Each device escalates on its own thresholds (a river station and a street underpass are very different scales).
machines: dict[str, PhaseMachine] = {
    dev_id: PhaseMachine(dev.get("warning_threshold_m", 1.20), dev.get("danger_threshold_m", 1.50)) for dev_id, dev in DEVICES.items()
}
filters: dict[str, JumpFilter] = defaultdict(lambda: JumpFilter(base_step=0.30, step_per_s=0.005))  # metres
held: dict[str, int] = defaultdict(int)

# Seed one starting reading per demo device, so the status page is not empty before a node reports
for dev_id, dev_cfg in DEVICES.items():
    init_ts = int(time.time()) - 60
    start_m = dev_cfg.get("initial_level_m", 1.20)
    readings[dev_id].append((init_ts, start_m))
    machines[dev_id].update(start_m)

class IngestPayload(BaseModel):
    device_id: str
    ts: int
    distance_cm: float = Field(ge=1.0, le=800)
    sig: str = ""

@router.post("/ingest")
async def ingest_sensor_reading(p: IngestPayload, request: Request, authorization: str | None = Header(default=None)):
    dev = DEVICES.get(p.device_id)
    if not dev:
        raise HTTPException(404, f"Unknown device {p.device_id}")

    # A reading changes state (history, level, and through it an underpass barrier), so it needs one of two proofs:
    # the device's HMAC signature over a recent timestamp, or the operator write token (tools, tests, the storm lab).
    # A wrong or stale signature is always refused. With no write token set (local development) unsigned readings
    # stay open, as every other write route does.
    if p.sig:
        if not dev.get("secret"):
            raise HTTPException(401, "This device has no signing secret configured")
        expected_msg = f"{p.device_id}.{p.ts}.{p.distance_cm:.1f}".encode()
        good_sig = hmac.new(dev["secret"].encode(), expected_msg, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(good_sig, p.sig):
            raise HTTPException(401, "Invalid HMAC signature")
        if abs(time.time() - p.ts) > MAX_SKEW_SECONDS:
            raise HTTPException(401, f"Signed timestamp is more than {MAX_SKEW_SECONDS} s from server time (replay or clock drift)")
    else:
        await require_write_token(authorization)

    raw_buffer[p.device_id].append(p.distance_cm)
    filtered_dist = median(raw_buffer[p.device_id])
    mount_h = dev.get("mount_height_cm", 400.0)
    level_m = max(0.0, (mount_h - filtered_dist) / 100.0)

    verdict = filters[p.device_id].check(level_m, time.time())
    if not verdict.accepted:  # implausible jump: keep it out of the history and the phase until a second reading agrees
        held[p.device_id] += 1
        return {
            "status": "HELD",
            "device_id": p.device_id,
            "level_m": round(level_m, 3),
            "phase": machines[p.device_id].phase,
            "timestamp": p.ts,
            "reason": verdict.reason,
        }

    readings[p.device_id].append((p.ts, level_m))
    phase = machines[p.device_id].update(level_m)

    engine = getattr(request.app.state, "vision_engine", None)
    if engine is not None:  # depth nodes can drive underpass barriers too
        for event in engine.barriers.on_reading(f"node:{p.device_id}", Level(phase), level_m, unit="m"):
            engine.publish_barrier_threadsafe(event)

    return {
        "status": "ACCEPTED",
        "device_id": p.device_id,
        "level_m": round(level_m, 3),
        "phase": phase,
        "timestamp": p.ts
    }

@router.get("/devices")
def list_devices():
    out = []
    now = time.time()
    for dev_id, dev in DEVICES.items():
        rs = readings.get(dev_id, [])
        last_ts, last_val = (rs[-1] if rs else (now, 1.20))
        out.append({
            "id": dev_id,
            "name": dev.get("name", dev_id),
            "lat": dev.get("lat"),
            "lon": dev.get("lon"),
            "current_level_m": round(last_val, 3),
            "status": "ONLINE" if (now - last_ts) < 600 else "STALE",
            "phase": machines[dev_id].phase,
            "warning_threshold_m": dev.get("warning_threshold_m"),
            "danger_threshold_m": dev.get("danger_threshold_m"),
            "held_readings": held[dev_id],
        })
    return {"devices": out}

@router.get("/export.csv")
def export_csv(device_id: str = Query("fw-node-01")):
    rows = ["ts,timestamp_iso,level_m"]
    for t, l in readings.get(device_id, []):
        iso = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(t))
        rows.append(f"{t},{iso},{l:.3f}")
    return Response("\n".join(rows), media_type="text/csv")
