"""Underpass barriers: a DANGER reading from a linked camera or depth node closes the barrier, and the map stops routing
through its zone. Every change is logged with its cause.

Precedents: Kuala Lumpur's SMART Tunnel closes to traffic and opens its flood gates from station data, and Japan's
transport ministry advises remote-controlled barriers at flood-prone underpasses.

HONESTY: these barriers are SIMULATED. No real road barrier is connected. A bench prototype (ESP32 + servo, see
firmware/floodway_barrier.ino) can poll GET /barriers/{id} and move with the state, which is the only hardware path.

Rules:
* auto mode: close on DANGER; reopen only once the trigger is back at ADVISORY or below. The level tracker steps down
  one level at a time after three lower readings, so a closed barrier stays closed for several cycles after the peak.
* manual mode: an operator closes or opens it and it stays that way until they resume auto.
"""
from __future__ import annotations

import threading
import uuid
from collections import deque
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field

from .levels import rank
from .schemas import Level

BarrierStateName = Literal["OPEN", "CLOSED"]
EVENT_LIMIT = 200


def _now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


class Barrier(BaseModel):
    id: str
    name: str
    lat: float
    lon: float
    radius_m: float = Field(default=150, ge=20, le=2000)
    trigger: str                      # "camera:<id>" or "node:<device id>"
    trigger_name: str
    mode: Literal["auto", "manual"] = "auto"
    state: BarrierStateName = "OPEN"
    changed_at: Optional[str] = None
    reason: str = "No closure since the server started."
    last_level: Optional[Level] = None
    is_simulated: bool = True


class BarrierEvent(BaseModel):
    id: str
    barrier_id: str
    barrier_name: str
    state: BarrierStateName
    cause: Literal["auto", "manual", "resume"]
    reason: str
    timestamp: str
    trigger: str
    level: Optional[Level] = None
    value: Optional[float] = None


class BarrierCommand(BaseModel):
    action: Literal["close", "open", "auto"]
    note: str = Field(default="", max_length=120)


class BarrierController:
    def __init__(self) -> None:
        self.barriers: dict[str, Barrier] = {}
        self.events: deque[BarrierEvent] = deque(maxlen=EVENT_LIMIT)
        self._lock = threading.Lock()

    def register(self, barrier: Barrier) -> Barrier:
        self.barriers[barrier.id] = barrier
        return barrier

    def list(self) -> list[Barrier]:
        return list(self.barriers.values())

    def get(self, barrier_id: str) -> Barrier:
        return self.barriers[barrier_id]

    def recent_events(self, limit: int) -> list[BarrierEvent]:
        return list(self.events)[:limit]

    def on_reading(self, trigger: str, level: Level, value: float, timestamp: Optional[str] = None,
                   unit: str = "of bank height") -> list[BarrierEvent]:
        """Feed one accepted reading from a camera or node. Returns the barrier changes it caused."""
        out: list[BarrierEvent] = []
        with self._lock:
            for b in self.barriers.values():
                if b.trigger != trigger:
                    continue
                b.last_level = level
                if b.mode != "auto":
                    continue
                shown = f"{round(value * 100)}% {unit}" if unit == "of bank height" else f"{value:.2f} {unit}"
                if level == Level.DANGER and b.state == "OPEN":
                    out.append(self._set(b, "CLOSED", "auto", f"{b.trigger_name} reached DANGER ({shown}).", level, value, timestamp))
                elif b.state == "CLOSED" and rank(level) <= rank(Level.ADVISORY):
                    out.append(self._set(b, "OPEN", "auto", f"{b.trigger_name} fell back to {level.value} ({shown}).", level, value, timestamp))
        return out

    def command(self, barrier_id: str, cmd: BarrierCommand) -> BarrierEvent:
        with self._lock:
            b = self.barriers[barrier_id]
            note = f" Note: {cmd.note.strip()}" if cmd.note.strip() else ""
            if cmd.action == "auto":
                b.mode = "auto"
                return self._log(b, "resume", f"Operator resumed automatic control.{note}")
            b.mode = "manual"
            target: BarrierStateName = "CLOSED" if cmd.action == "close" else "OPEN"
            verb = "closed" if target == "CLOSED" else "opened"
            return self._set(b, target, "manual", f"Operator {verb} the barrier.{note}", b.last_level, None, None)

    def _set(self, b: Barrier, state: BarrierStateName, cause: str, reason: str, level: Optional[Level],
             value: Optional[float], timestamp: Optional[str]) -> BarrierEvent:
        b.state = state
        b.changed_at = timestamp or _now_iso()
        b.reason = reason
        return self._log(b, cause, reason, level, value, b.changed_at)

    def _log(self, b: Barrier, cause: str, reason: str, level: Optional[Level] = None, value: Optional[float] = None,
             timestamp: Optional[str] = None) -> BarrierEvent:
        event = BarrierEvent(
            id=f"bev-{uuid.uuid4().hex[:8]}", barrier_id=b.id, barrier_name=b.name, state=b.state, cause=cause,  # type: ignore[arg-type]
            reason=reason, timestamp=timestamp or _now_iso(), trigger=b.trigger, level=level,
            value=round(value, 3) if value is not None else None,
        )
        self.events.appendleft(event)
        return event
