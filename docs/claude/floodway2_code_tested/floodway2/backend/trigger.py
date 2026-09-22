"""trigger.py - evacuation phase machine (single source of truth; the frontend only renders it)."""
from __future__ import annotations

from dataclasses import dataclass

DANGER_M = 0.30     # commit threshold: cars stall, pedestrians cannot wade
WARN_M = 0.10       # earliest pedestrian limit in the routing table
CLEAR_M = 0.25      # hysteresis: must fall below this to leave DANGER
CLEAR_TICKS = 3     # consecutive lower readings before de-escalating
RAIN_2H_WARN_MM = 60.0   # rule-based safety net independent of the ML model (JPS notes convective rain >60 mm in 2-4 h can cause flash floods)
RANK = {"NORMAL": 0, "WARNING": 1, "DANGER": 2}


@dataclass
class PhaseMachine:
    phase: str = "NORMAL"
    clear_count: int = 0

    def target(self, level_now: float, p50: list[float] | None, rain_2h_mm: float = 0.0) -> str:
        danger = level_now >= DANGER_M or (self.phase == "DANGER" and level_now >= CLEAR_M)
        if danger:
            return "DANGER"
        near_term = max(p50[:2]) if p50 else 0.0               # <= 60 min ahead
        any_term = max(p50) if p50 else 0.0
        if level_now >= WARN_M or near_term >= WARN_M or any_term >= DANGER_M or rain_2h_mm >= RAIN_2H_WARN_MM:
            return "WARNING"
        return "NORMAL"

    def update(self, level_now: float, p50: list[float] | None = None, rain_2h_mm: float = 0.0) -> str:
        tgt = self.target(level_now, p50, rain_2h_mm)
        if RANK[tgt] >= RANK[self.phase]:
            self.phase, self.clear_count = tgt, 0                # escalate / hold immediately
        else:
            self.clear_count += 1                                # de-escalate slowly
            if self.clear_count >= CLEAR_TICKS:
                self.phase, self.clear_count = tgt, 0
        return self.phase
