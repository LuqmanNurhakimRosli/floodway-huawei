"""
backend/app/routes/retrospective.py

FastAPI route handlers for FloodWay Retrospective Model Screening Demonstration.
"""

from typing import Optional, Dict, Any, Literal
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.services.retrospective_screener import (
    retrospective_screener,
    APPROVED_FEATURES,
    FEATURE_METADATA
)

router = APIRouter(prefix="/api/v1/retrospective", tags=["Retrospective Screening Demonstration"])

class RetrospectiveScreeningRequest(BaseModel):
    model_id: Literal[
        "benchmark_a_logistic_regression",
        "benchmark_b_random_forest",
        "benchmark_a_random_forest",
        "benchmark_b_logistic_regression"
    ] = Field(
        default="benchmark_a_logistic_regression",
        description="Model identifier to use. Default is Benchmark A Logistic Regression."
    )
    rain_1d_prior_mm: float = Field(
        ...,
        ge=0.0,
        le=1500.0,
        description="Antecedent 1-day rainfall prior to event in mm (ERA5 reanalysis)."
    )
    rain_3d_prior_mm: float = Field(
        ...,
        ge=0.0,
        le=3000.0,
        description="Antecedent 3-day cumulative rainfall prior to event in mm (ERA5 reanalysis)."
    )
    rain_7d_prior_mm: float = Field(
        ...,
        ge=0.0,
        le=5000.0,
        description="Antecedent 7-day cumulative rainfall prior to event in mm (ERA5 reanalysis)."
    )
    elevation_m: float = Field(
        ...,
        ge=-50.0,
        le=4500.0,
        description="Copernicus DEM 30m elevation in meters above sea level."
    )
    slope_deg: float = Field(
        ...,
        ge=0.0,
        le=90.0,
        description="Copernicus DEM 30m terrain slope in degrees."
    )
    metadata: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional provenance metadata (e.g., historical record ID, locality, date). Excluded from feature vector."
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "model_id": "benchmark_a_logistic_regression",
                "rain_1d_prior_mm": 7.5,
                "rain_3d_prior_mm": 41.4,
                "rain_7d_prior_mm": 98.5,
                "elevation_m": 19.11,
                "slope_deg": 4.23,
                "metadata": {
                    "sample_id": "POS_9564",
                    "date": "2020-06-20",
                    "state": "Johor",
                    "place": "Kg. Ulu Pulai"
                }
            }
        }
    }


@router.get("/catalog")
def get_model_catalog():
    """
    Returns available retrospective models, input feature requirements, and project disclaimers.
    """
    return retrospective_screener.get_catalog()


@router.get("/examples")
def get_historical_examples():
    """
    Returns reproducible authentic historical test records from the 2020-2021 test set.
    """
    return {
        "examples": retrospective_screener.get_examples(),
        "disclaimer": (
            "Historical flood incident screening demonstration only. "
            "Not a real-time flood forecast or safety warning."
        )
    }


@router.post("/screen")
def screen_historical_record(req: RetrospectiveScreeningRequest):
    """
    Screens a location using the 5 approved features and returns a relative classification score.
    """
    features = {
        "rain_1d_prior_mm": req.rain_1d_prior_mm,
        "rain_3d_prior_mm": req.rain_3d_prior_mm,
        "rain_7d_prior_mm": req.rain_7d_prior_mm,
        "elevation_m": req.elevation_m,
        "slope_deg": req.slope_deg
    }

    try:
        result = retrospective_screener.screen_incident(
            features=features,
            model_id=req.model_id,
            metadata=req.metadata
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )


@router.post("/compare")
def compare_benchmarks(req: RetrospectiveScreeningRequest):
    """
    Evaluates both Benchmark A (Logistic Regression default) and Benchmark B (Random Forest comparison)
    side-by-side on the exact same 5 features.
    """
    features = {
        "rain_1d_prior_mm": req.rain_1d_prior_mm,
        "rain_3d_prior_mm": req.rain_3d_prior_mm,
        "rain_7d_prior_mm": req.rain_7d_prior_mm,
        "elevation_m": req.elevation_m,
        "slope_deg": req.slope_deg
    }

    try:
        res_a = retrospective_screener.screen_incident(
            features=features,
            model_id="benchmark_a_logistic_regression",
            metadata=req.metadata
        )
        res_b = retrospective_screener.screen_incident(
            features=features,
            model_id="benchmark_b_random_forest",
            metadata=req.metadata
        )

        return {
            "comparison": {
                "benchmark_a_logistic_regression": res_a,
                "benchmark_b_random_forest": res_b
            },
            "interpretation_note": (
                "Benchmark A was trained against uniform landscape background; "
                "Benchmark B was trained against terrain-restricted lowlands. "
                "Scores reflect relative discrimination within each model's training paradigm, "
                "not causal superiority."
            ),
            "disclaimer": (
                "Historical flood incident screening demonstration only. "
                "Not a real-time flood forecast or safety warning."
            ),
            "data_source": (
                "Historical ECMWF ERA5 reanalysis & Copernicus DEM 30m. "
                "Not live forecasts or sensor readings."
            )
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comparison inference error: {str(e)}"
        )
