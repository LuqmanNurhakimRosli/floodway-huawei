from fastapi import APIRouter
from pydantic import BaseModel
from app.services.forecaster import forecaster

router = APIRouter(prefix="/api/v1/predict", tags=["AI Prediction"])

class PredictionRequest(BaseModel):
    current_water_level_m: float = 1.20
    rainfall_rate_mm_hr: float = 95.0

@router.post("")
async def predict_flood(p: PredictionRequest):
    res = await forecaster.predict_horizon(p.current_water_level_m, p.rainfall_rate_mm_hr)
    return res
