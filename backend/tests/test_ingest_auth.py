"""/api/v1/ingest changes state, so it needs a device signature or the operator write token."""
import hashlib
import hmac
import time

import pytest
from fastapi.testclient import TestClient

from app.config import DEVICES, MAX_SKEW_SECONDS


def _sig(device_id: str, ts: int, distance_cm: float) -> str:
    msg = f"{device_id}.{ts}.{distance_cm:.1f}".encode()
    return hmac.new(DEVICES[device_id]["secret"].encode(), msg, hashlib.sha256).hexdigest()


@pytest.fixture
def client():
    from app import main

    with TestClient(main.app) as c:
        yield c


def test_signed_reading_is_accepted_even_with_a_write_token(client, monkeypatch):
    monkeypatch.setenv("VISION_WRITE_TOKEN", "s3cret")
    ts = int(time.time())
    r = client.post("/api/v1/ingest", json={"device_id": "fw-node-01", "ts": ts, "distance_cm": 280.0, "sig": _sig("fw-node-01", ts, 280.0)})
    assert r.status_code == 200


def test_unsigned_reading_needs_the_write_token_when_one_is_set(client, monkeypatch):
    monkeypatch.setenv("VISION_WRITE_TOKEN", "s3cret")
    body = {"device_id": "fw-node-01", "ts": int(time.time()), "distance_cm": 280.0}
    assert client.post("/api/v1/ingest", json=body).status_code == 401
    assert client.post("/api/v1/ingest", json=body, headers={"Authorization": "Bearer s3cret"}).status_code == 200


def test_wrong_or_stale_signature_is_refused(client):
    ts = int(time.time())
    bad = client.post("/api/v1/ingest", json={"device_id": "fw-node-01", "ts": ts, "distance_cm": 280.0, "sig": "0" * 64})
    assert bad.status_code == 401
    old = ts - MAX_SKEW_SECONDS - 60
    stale = client.post("/api/v1/ingest", json={"device_id": "fw-node-01", "ts": old, "distance_cm": 280.0, "sig": _sig("fw-node-01", old, 280.0)})
    assert stale.status_code == 401 and "timestamp" in stale.json()["detail"]


def test_predict_rejects_out_of_range_input(client):
    assert client.post("/api/v1/predict", json={"current_water_level_m": -3, "rainfall_rate_mm_hr": 50}).status_code == 422
    assert client.post("/api/v1/predict", json={"current_water_level_m": 1.2, "rainfall_rate_mm_hr": 5000}).status_code == 422
    assert client.post("/api/v1/predict", json={"current_water_level_m": 1.2, "rainfall_rate_mm_hr": 50}).status_code == 200
