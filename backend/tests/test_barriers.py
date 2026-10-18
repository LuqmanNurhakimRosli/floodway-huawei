import asyncio
import time

import pytest
from fastapi.testclient import TestClient

from app.vision.barriers import Barrier, BarrierCommand, BarrierController
from app.vision.schemas import Level


def _ctl():
    c = BarrierController()
    c.register(Barrier(id="B", name="Test underpass", lat=3.1, lon=101.7, trigger="camera:cam", trigger_name="Cam"))
    return c


def test_danger_closes_and_advisory_reopens():
    c = _ctl()
    assert c.on_reading("camera:cam", Level.WARNING, 0.8) == []
    closed = c.on_reading("camera:cam", Level.DANGER, 1.0)
    assert [e.state for e in closed] == ["CLOSED"] and c.get("B").state == "CLOSED"
    assert c.on_reading("camera:cam", Level.WARNING, 0.8) == []  # still closed while water is high
    opened = c.on_reading("camera:cam", Level.ADVISORY, 0.3)
    assert [e.state for e in opened] == ["OPEN"]
    assert [e.state for e in c.recent_events(10)] == ["OPEN", "CLOSED"]


def test_other_triggers_are_ignored():
    c = _ctl()
    assert c.on_reading("camera:other", Level.DANGER, 1.0) == []
    assert c.get("B").state == "OPEN"


def test_manual_override_holds_until_auto_resumes():
    c = _ctl()
    ev = c.command("B", BarrierCommand(action="close", note="crew on site"))
    assert ev.cause == "manual" and c.get("B").state == "CLOSED" and "crew on site" in ev.reason
    assert c.on_reading("camera:cam", Level.NORMAL, 0.1) == []  # manual: auto rules do not reopen it
    c.command("B", BarrierCommand(action="auto"))
    assert [e.state for e in c.on_reading("camera:cam", Level.NORMAL, 0.1)] == ["OPEN"]


@pytest.fixture()
def client(tmp_path, monkeypatch):
    from app import main
    from app.vision.bootstrap import build_default_engine
    from app.vision.config import VisionSettings
    from app.vision.engine import VisionEngine

    async def no_loops(self, run_loops=True):
        self._loop = asyncio.get_running_loop()
        self._running = True

    monkeypatch.setattr(VisionEngine, "start", no_loops)
    main.app.state.vision_engine = build_default_engine(VisionSettings(data_dir=tmp_path, seed_samples=True))
    with TestClient(main.app) as c:
        yield c
    main.app.state.vision_engine = None


def test_demo_barriers_are_seeded_and_marked_simulated(client):
    body = client.get("/api/v1/vision/barriers").json()
    assert {b["id"] for b in body} == {"B-01", "B-02"}
    assert all(b["is_simulated"] and b["state"] == "OPEN" for b in body)


def test_depth_node_reading_closes_its_barrier(client):
    ts = int(time.time())
    # Pole 300 cm above the road: 250 cm to the water means 0.50 m deep, over the 0.30 m danger line.
    for _ in range(3):
        r = client.post("/api/v1/ingest", json={"device_id": "fw-node-03", "ts": ts, "distance_cm": 250})
        assert r.status_code == 200
    b = client.get("/api/v1/vision/barriers/B-02").json()
    assert b["state"] == "CLOSED" and "DANGER" in b["reason"]
    log = client.get("/api/v1/vision/barriers/events").json()
    assert log[0]["barrier_id"] == "B-02" and log[0]["cause"] == "auto"


def test_command_requires_token_when_set(client, monkeypatch):
    monkeypatch.setenv("VISION_WRITE_TOKEN", "s3cret")
    assert client.post("/api/v1/vision/barriers/B-01/command", json={"action": "close"}).status_code == 401
    ok = client.post("/api/v1/vision/barriers/B-01/command", json={"action": "close"}, headers={"Authorization": "Bearer s3cret"})
    assert ok.status_code == 200 and ok.json()["state"] == "CLOSED"
    assert client.post("/api/v1/vision/barriers/NOPE/command", json={"action": "open"}, headers={"Authorization": "Bearer s3cret"}).status_code == 404
