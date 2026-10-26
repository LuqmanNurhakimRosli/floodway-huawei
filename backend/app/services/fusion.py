"""Four-factor fusion: one flood level for a place from the IoT node, the camera, the flood-prone model and MET Malaysia.

A hand-written rule, not a trained model. The same rule lives in frontend/src/lib/fusion.ts; keep the two in step.

- The live readings (IoT depth, camera) set the floor: the highest of them.
- The level goes up one step when any other factor is at WARNING or above (independent sources agree).
- Context alone (model, MET) with no live reading at ADVISORY or above is capped at ADVISORY: it means "watch",
  never "leave now".
"""

from dataclasses import dataclass
from typing import Literal

from app.vision.levels import LEVEL_ORDER, rank
from app.vision.schemas import Level

FactorKey = Literal["model", "met", "iot", "cctv"]
LIVE: tuple[FactorKey, ...] = ("iot", "cctv")
CONTEXT: tuple[FactorKey, ...] = ("model", "met")

# Tisya's illustrative tiers (retrospective_screener.py): >= 0.70 elevated, 0.40-0.70 moderate. A relative score,
# not a probability, so the model alone tops out at WARNING.
MODEL_BANDS = ((0.70, Level.WARNING), (0.40, Level.ADVISORY))
# MET Malaysia colour warnings: yellow (waspada), orange (buruk), red (bahaya).
MET_LEVELS = {"none": Level.NORMAL, "yellow": Level.ADVISORY, "orange": Level.WARNING, "red": Level.DANGER}


def model_level(score: float) -> Level:
    return next((lvl for cut, lvl in MODEL_BANDS if score >= cut), Level.NORMAL)


@dataclass(frozen=True)
class Fusion:
    level: Level
    agreeing: list[str]  # factors at WARNING or above
    reporting: int  # factors with data
    escalated: bool  # raised one step because another factor agreed
    capped: bool  # context only, held at ADVISORY


def fuse(factors: dict[str, Level | None]) -> Fusion:
    present = {k: v for k, v in factors.items() if v is not None}
    agreeing = [k for k, v in present.items() if rank(v) >= rank(Level.WARNING)]
    live = {k: v for k, v in present.items() if k in LIVE}
    lead = max(live, key=lambda k: rank(live[k]), default=None)
    floor = live[lead] if lead else Level.NORMAL

    if rank(floor) < rank(Level.ADVISORY):
        context_raised = any(rank(present[k]) >= rank(Level.WARNING) for k in CONTEXT if k in present)
        level = Level.ADVISORY if context_raised else floor
        return Fusion(level, agreeing, len(present), escalated=False, capped=context_raised)

    others_agree = any(k != lead for k in agreeing)
    level = LEVEL_ORDER[min(rank(floor) + 1, len(LEVEL_ORDER) - 1)] if others_agree else floor
    return Fusion(level, agreeing, len(present), escalated=level != floor, capped=False)
