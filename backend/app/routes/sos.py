from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field

from app.routes.alerts import RATE_LIMIT, RATE_WINDOW_S
from app.security import RateLimiter, require_write_token
from app.services.notifier import notifier

router = APIRouter(prefix="/api/v1/sos", tags=["Family SOS"])

# These endpoints message a Telegram chat, so they are not an open relay: field sizes are capped, a rate limit applies,
# and once VISION_WRITE_TOKEN is set the caller must present it. The notifier escapes every field it formats.
_limiter = RateLimiter(RATE_LIMIT, RATE_WINDOW_S)


class SosDispatch(BaseModel):
    userName: str = Field(default="Citizen", max_length=60)
    phone: str = Field(default="", max_length=30)
    familyGroupId: str = Field(default="default", max_length=40)
    lat: float = Field(default=3.1610, ge=-90, le=90)
    lon: float = Field(default=101.7010, ge=-180, le=180)
    waterDepthCm: float = Field(default=18.0, ge=0, le=1000)
    shelterName: str = Field(default="SK Seksyen 24 Shah Alam", max_length=80)
    note: str = Field(default="", max_length=200)


class CheckinDispatch(BaseModel):
    userName: str = Field(default="Citizen", max_length=60)
    shelterName: str = Field(default="SK Seksyen 24 Shah Alam", max_length=80)
    time: str = Field(default="Just now", max_length=40)


def _client(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/broadcast", dependencies=[Depends(require_write_token)])
async def broadcast_sos(payload: SosDispatch, request: Request):
    _limiter.check(_client(request))
    res = await notifier.broadcast_sos(payload.model_dump())
    return {"status": "SUCCESS" if res.get("telegram_sent") else "NOT_SENT", "details": res}


@router.post("/checkin", dependencies=[Depends(require_write_token)])
async def broadcast_checkin(payload: CheckinDispatch, request: Request):
    _limiter.check(_client(request))
    res = await notifier.broadcast_checkin(payload.model_dump())
    return {"status": "SUCCESS" if res.get("telegram_sent") else "NOT_SENT", "details": res}
