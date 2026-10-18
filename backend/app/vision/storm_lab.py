"""Storm lab: replay a SYNTHETIC storm through the real Live Vision pipeline and measure how fast it warns.

Each scenario is a scripted water height over time (the ground truth). At every simulated camera cycle the lab renders
the synthetic river scene at that height, runs the same analyser, fault filter, level tracker and barrier rules the live
engine uses, and records what the system concluded. Time is simulated, so a ten-minute storm replays in seconds.

What it measures, per scenario, with the fault filter ON and OFF:
* detection delay: time from the true water crossing a level's line to the alert for that level
* warning lead: time from the WARNING alert to the true water reaching DANGER (what a resident actually gets)
* held readings and false alerts (an alert while the true water was clearly below that level)

HONESTY: the scene is drawn, not filmed, and the storms are scripted. These numbers show how the pipeline's timing
behaves (sampling interval, hysteresis, filter); they are not field accuracy figures for real cameras.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Callable, Optional

from pydantic import BaseModel

from .analysis.base import WaterAnalyzer
from .analysis.classical import ClassicalWaterAnalyzer
from .analysis.temporal import aggregate
from .barriers import Barrier, BarrierController
from .fault_filter import JumpFilter
from .levels import LevelTracker, rank, ratio_to_level, thresholds_from_calibration
from .schemas import Calibration, Level
from .seed import sample_calibration
from .sources.synthetic import SyntheticRiverSource

LAB_INTERVAL_S = 8          # same default cadence as a live camera (VISION_DEFAULT_INTERVAL_S)
LAB_BURST = 3               # frames per cycle (live default is 5; 3 keeps a replay under a few seconds)
LAB_GAP_S = 0.4
FALSE_ALERT_MARGIN = 0.05   # an alert counts as false if the true water was this far below the level's line


def _smooth(a: float, b: float, x: float) -> float:
    """0 before a, 1 after b, smooth in between."""
    if x <= a:
        return 0.0
    if x >= b:
        return 1.0
    u = (x - a) / (b - a)
    return u * u * (3 - 2 * u)


@dataclass(frozen=True)
class Scenario:
    id: str
    title: str
    description: str
    duration_s: int
    truth: Callable[[float], float]
    glitch: Callable[[float], bool] = lambda t: False   # cycles where the camera is fooled (lens splash)


def _rising(t: float) -> float:
    rise = 0.15 + 1.0 * _smooth(60, 300, t)
    return rise - 0.85 * _smooth(420, 600, t)


SCENARIOS: dict[str, Scenario] = {
    s.id: s for s in (
        Scenario(
            "rising-storm", "Rising storm",
            "Heavy rain over the catchment. The channel rises from 15% to 115% of bank height over four minutes, "
            "holds, then drains.",
            600, _rising,
        ),
        Scenario(
            "sudden-surge", "Sudden surge",
            "An upstream release. The water jumps from 30% to 105% of bank height within one camera cycle and stays "
            "high. This is where the fault filter costs one cycle.",
            300, lambda t: 0.30 + 0.75 * _smooth(120, 123, t),
        ),
        Scenario(
            "sensor-glitch", "Sensor glitch",
            "Calm water at 30% of bank height. Twice, for one cycle, the camera sees what looks like a full channel "
            "(a splash on the lens). Nothing should be alerted.",
            300, lambda t: 0.30, glitch=lambda t: 96 <= t < 104 or 200 <= t < 208,
        ),
    )
}


class TimelinePoint(BaseModel):
    t: float
    truth: float
    measured: Optional[float]
    level: Level
    held: bool


class LabAlert(BaseModel):
    t: float
    level: Level
    truth: float
    false_alert: bool


class LabBarrierEvent(BaseModel):
    t: float
    state: str
    reason: str


class LevelTiming(BaseModel):
    level: Level
    truth_crossed_at: Optional[float]
    alert_at: Optional[float]
    detection_delay_s: Optional[float]


class LabMetrics(BaseModel):
    timings: list[LevelTiming]
    warning_lead_s: Optional[float]
    held_readings: int
    false_alerts: int
    barrier_closed_at: Optional[float]
    barrier_close_delay_s: Optional[float]   # after the true water reached DANGER


class LabResult(BaseModel):
    fault_filter: bool
    timeline: list[TimelinePoint]
    alerts: list[LabAlert]
    barrier_events: list[LabBarrierEvent]
    metrics: LabMetrics


class StormRun(BaseModel):
    id: str
    scenario: str
    title: str
    description: str
    created_at: str
    interval_s: int
    analyzer: str
    with_filter: LabResult
    without_filter: LabResult
    note: str


class ScenarioInfo(BaseModel):
    id: str
    title: str
    description: str
    duration_s: int


def list_scenarios() -> list[ScenarioInfo]:
    return [ScenarioInfo(id=s.id, title=s.title, description=s.description, duration_s=s.duration_s) for s in SCENARIOS.values()]


def _first_crossing(truth: Callable[[float], float], line: float, duration_s: int) -> Optional[float]:
    for t10 in range(0, duration_s * 10 + 1):   # 0.1 s resolution
        t = t10 / 10
        if truth(t) >= line:
            return t
    return None


def _replay(sc: Scenario, cal: Calibration, analyzer: WaterAnalyzer, use_filter: bool) -> LabResult:
    thr = thresholds_from_calibration(cal)
    lines = {Level.WARNING: thr.warning, Level.DANGER: thr.danger}
    source = SyntheticRiverSource(0, 0, 1, seed=11)   # used only to draw frames at a given height
    tracker = LevelTracker()
    jump = JumpFilter()
    barriers = BarrierController()
    barriers.register(Barrier(id="LAB", name="Lab barrier", lat=0, lon=0, trigger="camera:lab", trigger_name="Lab camera"))

    timeline: list[TimelinePoint] = []
    alerts: list[LabAlert] = []
    bevents: list[LabBarrierEvent] = []
    held = 0
    t = 0.0
    while t <= sc.duration_s:
        heights = [1.10 if sc.glitch(t) else sc.truth(t + i * LAB_GAP_S) for i in range(LAB_BURST)]
        window = aggregate([analyzer.analyze(source.render(h), cal) for h in heights])
        truth_now = sc.truth(t)
        if window.ratio is None:
            timeline.append(TimelinePoint(t=t, truth=round(truth_now, 3), measured=None, level=tracker.current, held=False))
            t += LAB_INTERVAL_S
            continue
        observed = ratio_to_level(window.ratio, thr)
        accepted = True
        if use_filter:
            accepted = jump.check(window.ratio, t).accepted
        previous = tracker.current
        if accepted:
            level, changed = tracker.update(observed, window.confidence)
        else:
            level, changed = previous, False
            held += 1
        if changed and rank(level) > rank(previous) and rank(level) >= rank(Level.WARNING):
            alerts.append(LabAlert(t=t, level=level, truth=round(truth_now, 3),
                                   false_alert=truth_now < lines[level] - FALSE_ALERT_MARGIN))
        if accepted:
            for ev in barriers.on_reading("camera:lab", level, window.ratio):
                bevents.append(LabBarrierEvent(t=t, state=ev.state, reason=ev.reason))
        timeline.append(TimelinePoint(t=t, truth=round(truth_now, 3), measured=round(window.ratio, 3), level=level, held=not accepted))
        t += LAB_INTERVAL_S

    timings = []
    for lvl, line in lines.items():
        crossed = _first_crossing(sc.truth, line, sc.duration_s)
        first_alert = next((a.t for a in alerts if a.level == lvl or rank(a.level) > rank(lvl)), None)
        delay = round(first_alert - crossed, 1) if crossed is not None and first_alert is not None else None
        timings.append(LevelTiming(level=lvl, truth_crossed_at=crossed, alert_at=first_alert, detection_delay_s=delay))
    warn_alert = next((a.t for a in alerts if rank(a.level) >= rank(Level.WARNING) and not a.false_alert), None)
    danger_cross = _first_crossing(sc.truth, lines[Level.DANGER], sc.duration_s)
    lead = round(danger_cross - warn_alert, 1) if warn_alert is not None and danger_cross is not None else None
    closed = next((e.t for e in bevents if e.state == "CLOSED"), None)
    close_delay = round(closed - danger_cross, 1) if closed is not None and danger_cross is not None else None
    metrics = LabMetrics(
        timings=timings, warning_lead_s=lead, held_readings=held, false_alerts=sum(a.false_alert for a in alerts),
        barrier_closed_at=closed, barrier_close_delay_s=close_delay,
    )
    return LabResult(fault_filter=use_filter, timeline=timeline, alerts=alerts, barrier_events=bevents, metrics=metrics)


def run_storm(scenario_id: str, analyzer: Optional[WaterAnalyzer] = None) -> StormRun:
    sc = SCENARIOS[scenario_id]
    cal = sample_calibration()
    analyzer = analyzer or ClassicalWaterAnalyzer()
    return StormRun(
        id=f"storm-{uuid.uuid4().hex[:8]}", scenario=sc.id, title=sc.title, description=sc.description,
        created_at=datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        interval_s=LAB_INTERVAL_S, analyzer=analyzer.name,
        with_filter=_replay(sc, cal, analyzer, use_filter=True),
        without_filter=_replay(sc, cal, analyzer, use_filter=False),
        note="Synthetic storm on a drawn scene, replayed in simulated time with the live analyser, fault filter, "
             "level tracker and barrier rules. Timing behaviour only; not a field accuracy figure.",
    )


def summarise(run: StormRun) -> dict:
    m = run.with_filter.metrics
    return {"id": run.id, "scenario": run.scenario, "title": run.title, "created_at": run.created_at,
            "warning_lead_s": m.warning_lead_s, "false_alerts": m.false_alerts,
            "false_alerts_without_filter": run.without_filter.metrics.false_alerts, "held_readings": m.held_readings}

