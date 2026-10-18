"""Reject physically implausible jumps between consecutive readings of one sensor.

A camera can be fooled for one cycle: a splash on the lens, a passing truck, a sudden shadow. A depth node can return a
wild echo off debris. Water in a drain does not rise from a quarter of the bank to the top in eight seconds, so a jump
that large is held as SUSPECT instead of being fed to the level tracker. If the next reading agrees with the suspect,
the jump was real and both are accepted (cost: one cycle of delay on a genuine surge). If it does not, the suspect was a
glitch and is dropped.

This sits in front of the level logic. It does not change any threshold in `levels.py`.

HONEST LIMITS: the allowed step is an engineering judgment, not a measured rise rate for Malaysian drains. It grows with
the time between readings, so a slow snapshot feed (one frame every 15 minutes) is effectively unfiltered.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal, Optional

BASE_STEP = 0.25        # change always allowed between two readings (bank-height ratio, or metres for depth nodes)
STEP_PER_S = 0.01       # extra change allowed per second between readings
CONFIRM_TOL = 0.12      # a second reading this close to the suspect confirms it

Status = Literal["ok", "held", "confirmed"]


@dataclass(frozen=True)
class FilterVerdict:
    status: Status
    accepted: bool
    first_seen_at: float     # when this value was first seen (the suspect's time for a confirmed jump)
    reason: Optional[str] = None


class JumpFilter:
    def __init__(self, base_step: float = BASE_STEP, step_per_s: float = STEP_PER_S, confirm_tol: float = CONFIRM_TOL):
        self.base_step = base_step
        self.step_per_s = step_per_s
        self.confirm_tol = confirm_tol
        self.last: Optional[float] = None
        self.last_at: Optional[float] = None
        self.suspect: Optional[float] = None
        self.suspect_at: Optional[float] = None
        self.held_count = 0

    def allowed_step(self, dt_s: float) -> float:
        return self.base_step + self.step_per_s * max(0.0, dt_s)

    def check(self, value: float, now: float) -> FilterVerdict:
        if self.last is None or self.last_at is None:
            return self._accept(value, now, "ok", now)

        step = abs(value - self.last)
        if step <= self.allowed_step(now - self.last_at):
            return self._accept(value, now, "ok", now)

        if self.suspect is not None and self.suspect_at is not None and abs(value - self.suspect) <= self.confirm_tol:
            return self._accept(value, now, "confirmed", self.suspect_at)

        self.suspect, self.suspect_at = value, now
        self.held_count += 1
        return FilterVerdict(
            "held", False, now,
            reason=f"jump of {step:.2f} in {now - self.last_at:.0f} s is larger than the {self.allowed_step(now - self.last_at):.2f} allowed",
        )

    def _accept(self, value: float, now: float, status: Status, first_seen_at: float) -> FilterVerdict:
        self.last, self.last_at = value, now
        self.suspect = self.suspect_at = None
        return FilterVerdict(status, True, first_seen_at)
