"""Pure decision logic: ratio -> level, hysteresis, trend. No I/O, fully unit-testable."""
from __future__ import annotations

from dataclasses import dataclass

from .schemas import Calibration, Level

LEVEL_ORDER = [Level.NORMAL, Level.ADVISORY, Level.WARNING, Level.DANGER]
DANGER_AT = 0.97  # water within 3% of the danger line counts as reaching it


def rank(level: Level) -> int:
    return LEVEL_ORDER.index(level)


@dataclass(frozen=True)
class Thresholds:
    normal: float
    warning: float
    danger: float


def thresholds_from_calibration(cal: Calibration) -> Thresholds:
    """Express the three drawn lines on a 0..1 'bank height' scale.
    0 = bottom of the analysed zone (bed), 1 = the danger line."""
    bed = max(y for _, y in cal.roi)
    span = bed - cal.lines.danger
    if span <= 0.02:
        raise ValueError("danger line is too close to the bed of the analysed zone")

    def to_ratio(y: float) -> float:
        return max(0.0, (bed - y) / span)

    return Thresholds(normal=to_ratio(cal.lines.normal), warning=to_ratio(cal.lines.warning), danger=DANGER_AT)


def ratio_to_level(ratio: float, t: Thresholds) -> Level:
    if ratio >= t.danger:
        return Level.DANGER
    if ratio >= t.warning:
        return Level.WARNING
    if ratio >= t.normal:
        return Level.ADVISORY
    return Level.NORMAL


def lines_crossed(ratio: float, t: Thresholds) -> list[str]:
    out = []
    if ratio >= t.normal:
        out.append("normal")
    if ratio >= t.warning:
        out.append("warning")
    if ratio >= t.danger:
        out.append("danger")
    return out


def compute_trend(ratios: list[float], threshold: float = 0.03) -> str:
    """Compare the mean of the last 3 readings with the 3 before them."""
    if len(ratios) < 4:
        return "steady"
    recent = ratios[-3:]
    earlier = ratios[-6:-3] if len(ratios) >= 6 else ratios[:-3]
    delta = sum(recent) / len(recent) - sum(earlier) / len(earlier)
    if delta > threshold:
        return "rising"
    if delta < -threshold:
        return "falling"
    return "steady"


class LevelTracker:
    """Hysteresis so the level never flickers.

    * Escalate after `escalate_after` consecutive higher observations
      (to the lowest level seen in that streak), or immediately for a
      confident DANGER reading (safety first).
    * De-escalate one step at a time, only after `deescalate_after`
      consecutive lower observations (DANGER never drops to NORMAL in one go).
    """

    def __init__(self, escalate_after: int = 2, deescalate_after: int = 3, danger_confidence: float = 0.85):
        self.escalate_after = escalate_after
        self.deescalate_after = deescalate_after
        self.danger_confidence = danger_confidence
        self.current: Level = Level.NORMAL
        self._up_streak: list[Level] = []
        self._down_count = 0

    def update(self, observed: Level, confidence: float) -> tuple[Level, bool]:
        before = self.current
        if rank(observed) > rank(self.current):
            self._down_count = 0
            self._up_streak.append(observed)
            immediate = observed == Level.DANGER and confidence >= self.danger_confidence
            if immediate or len(self._up_streak) >= self.escalate_after:
                lowest = min(self._up_streak, key=rank)
                self.current = observed if immediate else lowest
                self._up_streak.clear()
        elif rank(observed) < rank(self.current):
            self._up_streak.clear()
            self._down_count += 1
            if self._down_count >= self.deescalate_after:
                step_down = LEVEL_ORDER[rank(self.current) - 1]
                self.current = observed if rank(observed) > rank(step_down) else step_down
                self._down_count = 0
        else:
            self._up_streak.clear()
            self._down_count = 0
        return self.current, self.current != before
