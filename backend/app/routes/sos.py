from fastapi import APIRouter
from pydantic import BaseModel, Field
from app.services.notifier import notifier

router = APIRouter(prefix="/api/v1/sos", tags=["Family SOS"])

class SosDispatch(BaseModel):
    userName: str = "Citizen"
    phone: str = ""
    familyGroupId: str = "default"
    lat: float = 3.1610
    lon: float = 101.7010
    waterDepthCm: float = 18.0
    shelterName: str = "SK Seksyen 24 Shah Alam"
    note: str = ""

class CheckinDispatch(BaseModel):
    userName: str = "Citizen"
    shelterName: str = "SK Seksyen 24 Shah Alam"
    time: str = "Just now"

@router.post("/broadcast")
async def broadcast_sos(payload: SosDispatch):
    res = await notifier.broadcast_sos(payload.model_dump())
    return {"status": "SUCCESS", "details": res}

@router.post("/checkin")
async def broadcast_checkin(payload: CheckinDispatch):
    res = await notifier.broadcast_checkin(payload.model_dump())
    return {"status": "SUCCESS", "details": res}
