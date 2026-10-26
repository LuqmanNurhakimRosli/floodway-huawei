from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.services.fusion import MET_LEVELS, fuse, model_level
from app.vision.schemas import Level

router = APIRouter(prefix="/api/v1/fusion", tags=["Fusion"])


class FusionRequest(BaseModel):
    # Any factor may be missing (null): the rule fuses what it has and says how many reported.
    iot: Level | None = None
    cctv: Level | None = None
    model_score: float | None = Field(default=None, ge=0, le=1)
    met: Literal["none", "yellow", "orange", "red"] | None = None


@router.post("")
def evaluate(p: FusionRequest):
    """Stateless: computes the fused level for the given factors and stores nothing."""
    factors = {
        "iot": p.iot,
        "cctv": p.cctv,
        "model": model_level(p.model_score) if p.model_score is not None else None,
        "met": MET_LEVELS[p.met] if p.met is not None else None,
    }
    f = fuse(factors)
    return {
        "level": f.level,
        "factors": factors,
        "agreeing": f.agreeing,
        "reporting": f.reporting,
        "escalated": f.escalated,
        "capped": f.capped,
        "method": "Rule-based fusion (services/fusion.py), not a trained model.",
    }
