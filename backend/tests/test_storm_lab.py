import pytest

from app.vision.schemas import Level
from app.vision.storm_lab import SCENARIOS, list_scenarios, run_storm


@pytest.fixture(scope="module")
def runs():
    return {sid: run_storm(sid) for sid in SCENARIOS}


def _timing(result, level):
    return next(t for t in result.metrics.timings if t.level == level)


def test_scenarios_are_listed():
    assert {s.id for s in list_scenarios()} == {"rising-storm", "sudden-surge", "sensor-glitch"}


def test_rising_storm_warns_before_danger(runs):
    r = runs["rising-storm"].with_filter
    warn, danger = _timing(r, Level.WARNING), _timing(r, Level.DANGER)
    assert warn.detection_delay_s is not None and 0 <= warn.detection_delay_s <= 3 * 8
    assert danger.detection_delay_s is not None and 0 <= danger.detection_delay_s <= 3 * 8
    assert r.metrics.warning_lead_s and r.metrics.warning_lead_s > 0
    assert r.metrics.false_alerts == 0 and r.metrics.barrier_closed_at is not None


def test_glitches_are_held_with_the_filter_and_alert_without_it(runs):
    run = runs["sensor-glitch"]
    assert run.with_filter.metrics.false_alerts == 0 and run.with_filter.metrics.held_readings == 2
    assert run.with_filter.metrics.barrier_closed_at is None
    assert run.without_filter.metrics.false_alerts >= 1  # the honest comparison: this is what the filter prevents


def test_surge_costs_at_most_one_cycle_with_the_filter(runs):
    run = runs["sudden-surge"]
    on = _timing(run.with_filter, Level.DANGER).detection_delay_s
    off = _timing(run.without_filter, Level.DANGER).detection_delay_s
    assert on is not None and off is not None and 0 <= on - off <= 8


def test_storm_lab_api_runs_and_lists(tmp_path, monkeypatch):
    import asyncio

    from fastapi.testclient import TestClient

    from app.vision.bootstrap import build_default_engine
    from app.vision.config import VisionSettings
    from app.vision.engine import VisionEngine
    from app.vision.standalone import create_app

    async def no_loops(self, run_loops=True):
        self._loop = asyncio.get_running_loop()
        self._running = True

    monkeypatch.setattr(VisionEngine, "start", no_loops)
    engine = build_default_engine(VisionSettings(data_dir=tmp_path, seed_samples=False))
    with TestClient(create_app(engine)) as c:
        assert len(c.get("/api/v1/vision/storm-lab/scenarios").json()) == 3
        assert c.post("/api/v1/vision/storm-lab/run", json={"scenario": "nope"}).status_code == 404
        body = c.post("/api/v1/vision/storm-lab/run", json={"scenario": "sensor-glitch"}).json()
        assert body["with_filter"]["metrics"]["false_alerts"] == 0 and "Synthetic" in body["note"]
        assert c.get("/api/v1/vision/storm-lab/runs").json()[0]["id"] == body["id"]
