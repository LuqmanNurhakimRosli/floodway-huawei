"""
backend/app/services/retrospective_screener.py

FloodWay Retrospective Model Inference Service.
Evaluates historical reported flood incident discrimination using existing saved baseline models
trained on Peninsular Malaysia data (Stage 5.3B).

CRITICAL REQUIREMENTS:
- Uses strictly the 5 approved features in exact saved order:
    1. rain_1d_prior_mm
    2. rain_3d_prior_mm
    3. rain_7d_prior_mm
    4. elevation_m
    5. slope_deg
- Default model: Benchmark A Logistic Regression
- Comparison model: Benchmark B Random Forest
- Returns a relative classification score (0.0 to 1.0), NOT an operational flood probability.
- Clearly distinguishes historical ERA5 inputs from live weather forecasts.
- Carries an explicit historical screening demonstration disclaimer.
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional
import numpy as np
import joblib

logger = logging.getLogger(__name__)

# Approved 5 predictors in exact trained order
APPROVED_FEATURES = [
    "rain_1d_prior_mm",
    "rain_3d_prior_mm",
    "rain_7d_prior_mm",
    "elevation_m",
    "slope_deg"
]

FEATURE_METADATA = {
    "rain_1d_prior_mm": {
        "label": "Antecedent 1-Day Rainfall (D-1)",
        "unit": "mm",
        "description": "Historical ERA5 total precipitation on the day prior to incident (mm).",
        "min": 0.0,
        "max": 1500.0
    },
    "rain_3d_prior_mm": {
        "label": "Antecedent 3-Day Cumulative Rainfall (D-3..D-1)",
        "unit": "mm",
        "description": "Historical ERA5 cumulative precipitation over 3 days prior (mm).",
        "min": 0.0,
        "max": 3000.0
    },
    "rain_7d_prior_mm": {
        "label": "Antecedent 7-Day Cumulative Rainfall (D-7..D-1)",
        "unit": "mm",
        "description": "Historical ERA5 cumulative precipitation over 7 days prior (mm).",
        "min": 0.0,
        "max": 5000.0
    },
    "elevation_m": {
        "label": "Ground Elevation",
        "unit": "m",
        "description": "Copernicus DEM 30m terrain elevation above sea level (meters).",
        "min": -50.0,
        "max": 4500.0
    },
    "slope_deg": {
        "label": "Terrain Slope",
        "unit": "degrees",
        "description": "Copernicus DEM 30m terrain slope in degrees (0 to 90).",
        "min": 0.0,
        "max": 90.0
    }
}

# Resolve models directory relative to project root
MODELS_DIR = os.getenv(
    "MODELS_DIR",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "models"))
)

MODEL_CATALOG = {
    "benchmark_a_logistic_regression": {
        "id": "benchmark_a_logistic_regression",
        "name": "Benchmark A - Logistic Regression (Default)",
        "filename": "stage5_3b_benchmark_a_logistic_regression.joblib",
        "benchmark": "Benchmark A (Uniform landscape background)",
        "model_architecture": "StandardScaler (Train-fit) + LogisticRegression (C=1.0, L2)",
        "roc_auc_test": 0.8357,
        "is_default": True,
        "description": "Trained to discriminate reported flood incidents from general Peninsular Malaysia landscape topography."
    },
    "benchmark_b_random_forest": {
        "id": "benchmark_b_random_forest",
        "name": "Benchmark B - Random Forest (Comparison)",
        "filename": "stage5_3b_benchmark_b_random_forest.joblib",
        "benchmark": "Benchmark B (Terrain-restricted background)",
        "model_architecture": "RandomForestClassifier (100 trees, max_depth=5, min_samples_leaf=10)",
        "roc_auc_test": 0.7727,
        "is_default": False,
        "description": "Trained to discriminate reported flood incidents from terrain-restricted lowlands (elevation -4 to 125 m, slope 0 to 14 deg, per scripts/generate_stage5_1a_scaling_250.py)."
    },
    "benchmark_a_random_forest": {
        "id": "benchmark_a_random_forest",
        "name": "Benchmark A - Random Forest",
        "filename": "stage5_3b_benchmark_a_random_forest.joblib",
        "benchmark": "Benchmark A (Uniform landscape background)",
        "model_architecture": "RandomForestClassifier (100 trees, max_depth=5, min_samples_leaf=10)",
        "roc_auc_test": 0.8058,
        "is_default": False,
        "description": "Non-linear decision tree ensemble on uniform landscape background."
    },
    "benchmark_b_logistic_regression": {
        "id": "benchmark_b_logistic_regression",
        "name": "Benchmark B - Logistic Regression",
        "filename": "stage5_3b_benchmark_b_logistic_regression.joblib",
        "benchmark": "Benchmark B (Terrain-restricted background)",
        "model_architecture": "StandardScaler (Train-fit) + LogisticRegression (C=1.0, L2)",
        "roc_auc_test": 0.7186,
        "is_default": False,
        "description": "Standardized linear model on terrain-restricted lowlands."
    }
}

# Authentic historical test cohort examples for reproducible verification
HISTORICAL_EXAMPLES = [
    {
        "id": "example-flood-incident-1",
        "title": "Reported Flood Incident: Kg. Ulu Pulai, Johor (2020-06-20)",
        "provenance": "Authentic Test Set Record POS_9564 (JPS Historical Incident)",
        "is_incident": True,
        "date": "2020-06-20",
        "state": "Johor",
        "place": "Kg. Ulu Pulai",
        "rain_1d_prior_mm": 7.5,
        "rain_3d_prior_mm": 41.4,
        "rain_7d_prior_mm": 98.5,
        "elevation_m": 19.11,
        "slope_deg": 4.23
    },
    {
        "id": "example-flood-incident-2",
        "title": "Reported Flood Incident: Jln. Bakariah, Johor (2020-07-13)",
        "provenance": "Authentic Test Set Record POS_9603 (JPS Historical Incident)",
        "is_incident": True,
        "date": "2020-07-13",
        "state": "Johor",
        "place": "Jln. Bakariah",
        "rain_1d_prior_mm": 6.1,
        "rain_3d_prior_mm": 15.5,
        "rain_7d_prior_mm": 64.2,
        "elevation_m": 5.57,
        "slope_deg": 1.88
    },
    {
        "id": "example-background-landscape-1",
        "title": "Background Landscape Point: Selangor Lowland (2020-11-11)",
        "provenance": "Authentic Test Set Record STAGE5_1A_UNIFORM_NEG_166 (Uniform Background Sample)",
        "is_incident": False,
        "date": "2020-11-11",
        "state": "Selangor",
        "place": "Landscape background location",
        "rain_1d_prior_mm": 0.1,
        "rain_3d_prior_mm": 9.0,
        "rain_7d_prior_mm": 20.4,
        "elevation_m": 6.5,
        "slope_deg": 0.0
    }
]

class RetrospectiveScreener:
    def __init__(self, models_dir: str = MODELS_DIR):
        self.models_dir = models_dir
        self._loaded_models: Dict[str, Any] = {}

    def get_catalog(self) -> Dict[str, Any]:
        """Returns metadata for all available retrospective models."""
        return {
            "default_model": "benchmark_a_logistic_regression",
            "approved_features": APPROVED_FEATURES,
            "feature_metadata": FEATURE_METADATA,
            "models": MODEL_CATALOG,
            "disclaimer": (
                "Historical flood incident screening demonstration only. "
                "Not a real-time flood forecast or safety warning."
            ),
            "data_source_note": (
                "Historical ECMWF ERA5 reanalysis and Copernicus DEM 30m. "
                "Inputs represent antecedent conditions before historical dates, "
                "strictly distinct from live weather forecasts."
            )
        }

    def get_examples(self) -> List[Dict[str, Any]]:
        """Returns reproducible historical test samples."""
        return HISTORICAL_EXAMPLES

    def load_model(self, model_id: str) -> Any:
        """Loads a model pipeline from disk and caches it in memory."""
        if model_id not in MODEL_CATALOG:
            valid_ids = list(MODEL_CATALOG.keys())
            raise ValueError(f"Unknown model_id '{model_id}'. Must be one of: {valid_ids}")

        if model_id in self._loaded_models:
            return self._loaded_models[model_id]

        filename = MODEL_CATALOG[model_id]["filename"]
        path = os.path.join(self.models_dir, filename)

        if not os.path.exists(path):
            raise FileNotFoundError(
                f"Model file '{filename}' not found at '{path}'. Verify models/ directory."
            )

        pipeline = joblib.load(path)
        self._loaded_models[model_id] = pipeline
        logger.info(f"Loaded retrospective model pipeline '{model_id}' from {path}")
        return pipeline

    def validate_features(self, features: Dict[str, Any]) -> List[float]:
        """
        Validates feature presence, numeric types, physical ranges, and exact ordering.
        Returns a list of 5 floats strictly in APPROVED_FEATURES order.
        """
        validated_values = []
        for feat_name in APPROVED_FEATURES:
            if feat_name not in features:
                raise ValueError(f"Missing required feature: '{feat_name}'")

            val = features[feat_name]
            if val is None:
                raise ValueError(f"Feature '{feat_name}' cannot be null or None")

            try:
                num_val = float(val)
            except (ValueError, TypeError):
                raise ValueError(f"Feature '{feat_name}' must be a numeric value, got '{val}' ({type(val).__name__})")

            meta = FEATURE_METADATA[feat_name]
            if num_val < meta["min"]:
                raise ValueError(f"Feature '{feat_name}' ({num_val}) is below minimum allowed value ({meta['min']} {meta['unit']})")
            if num_val > meta["max"]:
                raise ValueError(f"Feature '{feat_name}' ({num_val}) exceeds maximum allowed value ({meta['max']} {meta['unit']})")

            validated_values.append(num_val)

        return validated_values

    def screen_incident(
        self,
        features: Dict[str, Any],
        model_id: str = "benchmark_a_logistic_regression",
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes retrospective model inference on the 5 validated features.
        Returns a clearly labeled relative classification score.
        """
        # Validate features in exact order
        val_vector = self.validate_features(features)
        pipeline = self.load_model(model_id)
        model_info = MODEL_CATALOG[model_id]

        # Shape (1, 5) matrix matching model expectation
        X = np.array([val_vector], dtype=float)

        # Compute probability estimate
        # [P(background), P(incident_similarity)]
        probs = pipeline.predict_proba(X)[0]
        relative_score = float(probs[1])

        # Assign relative screening tier (NOT operational hazard levels)
        # Note: Thresholds (0.70 / 0.40) are illustrative for presentation only and do not represent official hazard levels.
        if relative_score >= 0.70:
            tier = "Elevated Screening Index"
            tier_desc = "Feature combination shares strong similarity with historical reported flood incidents."
        elif relative_score >= 0.40:
            tier = "Moderate Screening Index"
            tier_desc = "Intermediate antecedent rainfall / terrain profile relative to historical baseline."
        else:
            tier = "Baseline / Low Screening Index"
            tier_desc = "Profile resembles typical background landscape or low antecedent rainfall conditions."

        tier_basis_note = (
            "Illustrative demonstration categorization only (>=0.70 Elevated, 0.40-0.70 Moderate, <0.40 Baseline). "
            "Not an official meteorological, hydrological, or civil protection alert threshold."
        )

        return {
            "model_id": model_id,
            "model_name": model_info["name"],
            "benchmark_type": model_info["benchmark"],
            "model_architecture": model_info["model_architecture"],
            "relative_classification_score": round(relative_score, 4),
            "relative_score_percent": round(relative_score * 100.0, 1),
            "screening_tier": tier,
            "tier_description": tier_desc,
            "tier_basis": tier_basis_note,
            "score_interpretation": (
                "Relative presence-background discrimination score (0.0 to 1.0). "
                "Indicates relative similarity to historical reported flood incident conditions compared to landscape background. "
                "NOT an operational flood probability, NOT a physical water level, and NOT an emergency warning."
            ),
            "disclaimer": (
                "Historical flood incident screening demonstration only. "
                "Not a real-time flood forecast or safety warning."
            ),
            "data_source": (
                "Historical ECMWF ERA5 reanalysis & Copernicus DEM 30m. "
                "Not live forecasts or sensor readings."
            ),
            "feature_vector_used": [
                {
                    "feature": feat,
                    "value": val_vector[i],
                    "unit": FEATURE_METADATA[feat]["unit"],
                    "description": FEATURE_METADATA[feat]["description"]
                }
                for i, feat in enumerate(APPROVED_FEATURES)
            ],
            "metadata": metadata
        }

# Global singleton instance
retrospective_screener = RetrospectiveScreener()
