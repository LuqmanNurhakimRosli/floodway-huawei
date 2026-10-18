import asyncio

from app.vision.alerts import AlertDispatcher
from app.vision.analysis import get_analyzer
from app.vision.config import VisionSettings
from app.vision.engine import VisionEngine
from app.vision.fault_filter import JumpFilter
from app.vision.seed import sample_calibration
from app.vision.sources.synthetic import SyntheticRiverSource


def test_first_reading_is_always_accepted():
    f = JumpFilter()
    v = f.check(1.05, now=0)
    assert v.accepted and v.status == "ok"


def test_small_steps_pass():
    f = JumpFilter()
    f.check(0.30, 0)
    assert f.check(0.50, 8).accepted


def test_single_glitch_is_held_then_dropped():
    f = JumpFilter()
    f.check(0.30, 0)
    held = f.check(1.10, 8)
    assert not held.accepted and held.status == "held" and "jump" in held.reason
    back = f.check(0.31, 16)
    assert back.accepted and back.status == "ok"
    assert f.last == 0.31 and f.suspect is None and f.held_count == 1


def test_real_surge_is_confirmed_by_the_next_reading():
    f = JumpFilter()
    f.check(0.30, 0)
    assert not f.check(1.05, 8).accepted
    confirmed = f.check(1.04, 16)
    assert confirmed.accepted and confirmed.status == "confirmed"
    assert confirmed.first_seen_at == 8  # the crossing is dated to the first sighting, not the confirmation


def test_allowed_step_grows_with_time_between_readings():
    f = JumpFilter()
    f.check(0.10, 0)
    assert f.check(1.00, 900).accepted  # a 15-minute snapshot feed is effectively unfiltered


class _Channel:
    name = "fake"

    def __init__(self):
        self.sent = []

    async def send(self, e):
        self.sent.append(e)


class _Switch(SyntheticRiverSource):
    """Draws the scene at whatever height the test sets."""

    def __init__(self):
        super().__init__(0.3, 0.3, 100, seed=5)
        self.h = 0.3

    def grab_frames(self, n, gap_s):
        return [self.render(self.h) for _ in range(n)]


def test_engine_holds_a_glitch_and_never_alerts(tmp_path):
    channel = _Channel()
    settings = VisionSettings(data_dir=tmp_path, seed_samples=False)
    engine = VisionEngine(settings, get_analyzer(settings), AlertDispatcher([channel], cooldown_s=300))
    src = _Switch()
    engine.register_synthetic("cam", "Glitch cam", "mine", 3.1, 101.7, sample_calibration(), src, 8)

    async def run():
        await engine.start(run_loops=False)
        out = [await engine.analyze_once_async("cam")]
        src.h = 1.10  # one fooled cycle
        out.append(await engine.analyze_once_async("cam"))
        src.h = 0.3
        out.append(await engine.analyze_once_async("cam"))
        await engine.stop()
        return out

    a, glitch, b = asyncio.run(run())
    assert a.accepted and b.accepted
    assert not glitch.accepted and glitch.fault and glitch.level == a.level
    assert channel.sent == [] and len(engine.alerts) == 0


def test_engine_logs_detection_delay_on_alert(tmp_path):
    settings = VisionSettings(data_dir=tmp_path, seed_samples=False)
    engine = VisionEngine(settings, get_analyzer(settings), AlertDispatcher([], cooldown_s=300))
    src = _Switch()
    engine.register_synthetic("cam", "Surge cam", "mine", 3.1, 101.7, sample_calibration(), src, 8)

    async def run():
        await engine.start(run_loops=False)
        await engine.analyze_once_async("cam")
        src.h = 1.05
        await engine.analyze_once_async("cam")   # held as suspect
        await engine.analyze_once_async("cam")   # confirmed: DANGER
        await engine.stop()

    asyncio.run(run())
    assert len(engine.alerts) == 1 and engine.alerts[0].level.value == "DANGER"
    assert engine.alerts[0].detection_delay_s is not None and engine.alerts[0].first_crossed_at
    assert engine.lead_log[0].camera_id == "cam" and engine.lead_log[0].source == "live"
