"""
backend/tests/test_retrospective.py

Automated test suite for FloodWay Retrospective Model Screening Demonstration.
Tests:
- Model catalog retrieval and disclaimers
- Reproducible historical examples retrieval
- Inference execution on default model (Benchmark A Logistic Regression)
- Inference execution on comparison model (Benchmark B Random Forest)
- Side-by-side comparison endpoint
- Strict feature validation (missing features, invalid types, negative rainfall, out-of-range slope)
- Invalid model ID rejection
- Direct service validation and ordering integrity
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.retrospective_screener import (
    retrospective_screener,
    APPROVED_FEATURES,
    FEATURE_METADATA
)

client = TestClient(app)

SAMPLE_POSITIVE_FEATURES = {
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

SAMPLE_BACKGROUND_FEATURES = {
    "model_id": "benchmark_a_logistic_regression",
    "rain_1d_prior_mm": 0.1,
    "rain_3d_prior_mm": 9.0,
    "rain_7d_prior_mm": 20.4,
    "elevation_m": 6.5,
    "slope_deg": 0.0,
    "metadata": {
        "sample_id": "STAGE5_1A_UNIFORM_NEG_166",
        "date": "2020-11-11",
        "state": "Selangor"
    }
}

def test_retrospective_catalog():
    res = client.get("/api/v1/retrospective/catalog")
    assert res.status_code == 200
    data = res.json()
    assert data["default_model"] == "benchmark_a_logistic_regression"
    assert data["approved_features"] == APPROVED_FEATURES
    assert "Historical flood incident screening demonstration only" in data["disclaimer"]
    assert "benchmark_a_logistic_regression" in data["models"]
    assert "benchmark_b_random_forest" in data["models"]

def test_retrospective_examples():
    res = client.get("/api/v1/retrospective/examples")
    assert res.status_code == 200
    data = res.json()
    examples = data["examples"]
    assert len(examples) >= 2
    # First example is an authentic positive test record
    assert examples[0]["is_incident"] is True
    assert examples[0]["state"] == "Johor"
    assert "rain_1d_prior_mm" in examples[0]

def test_default_model_inference():
    res = client.post("/api/v1/retrospective/screen", json=SAMPLE_POSITIVE_FEATURES)
    assert res.status_code == 200
    data = res.json()

    assert data["model_id"] == "benchmark_a_logistic_regression"
    assert "Logistic Regression" in data["model_name"]
    assert 0.0 <= data["relative_classification_score"] <= 1.0
    # Relative score should reflect flood-incident-like conditions (> 0.60)
    assert data["relative_classification_score"] > 0.60
    assert data["screening_tier"] == "Elevated Screening Index"

    # Mandatory disclaimers
    assert "Historical flood incident screening demonstration only" in data["disclaimer"]
    assert "Historical ECMWF ERA5 reanalysis" in data["data_source"]
    assert "NOT an operational flood probability" in data["score_interpretation"]

    # 5 features used in exact order
    assert len(data["feature_vector_used"]) == 5
    for i, name in enumerate(APPROVED_FEATURES):
        assert data["feature_vector_used"][i]["feature"] == name

def test_comparison_model_inference():
    req = dict(SAMPLE_POSITIVE_FEATURES)
    req["model_id"] = "benchmark_b_random_forest"
    res = client.post("/api/v1/retrospective/screen", json=req)
    assert res.status_code == 200
    data = res.json()

    assert data["model_id"] == "benchmark_b_random_forest"
    assert "Random Forest" in data["model_name"]
    assert 0.0 <= data["relative_classification_score"] <= 1.0
    assert data["screening_tier"] == "Elevated Screening Index"

def test_background_sample_inference():
    res = client.post("/api/v1/retrospective/screen", json=SAMPLE_BACKGROUND_FEATURES)
    assert res.status_code == 200
    data = res.json()
    assert 0.0 <= data["relative_classification_score"] <= 1.0
    # Background sample should produce a lower relative score than the positive incident
    pos_res = client.post("/api/v1/retrospective/screen", json=SAMPLE_POSITIVE_FEATURES).json()
    assert data["relative_classification_score"] < pos_res["relative_classification_score"]

def test_side_by_side_compare_endpoint():
    res = client.post("/api/v1/retrospective/compare", json=SAMPLE_POSITIVE_FEATURES)
    assert res.status_code == 200
    data = res.json()
    assert "benchmark_a_logistic_regression" in data["comparison"]
    assert "benchmark_b_random_forest" in data["comparison"]
    assert "interpretation_note" in data
    assert "disclaimer" in data

def test_missing_feature_rejection():
    # Omit slope_deg
    bad_req = {
        "model_id": "benchmark_a_logistic_regression",
        "rain_1d_prior_mm": 7.5,
        "rain_3d_prior_mm": 41.4,
        "rain_7d_prior_mm": 98.5,
        "elevation_m": 19.11
    }
    res = client.post("/api/v1/retrospective/screen", json=bad_req)
    assert res.status_code == 422

def test_negative_rainfall_rejection():
    bad_req = dict(SAMPLE_POSITIVE_FEATURES)
    bad_req["rain_1d_prior_mm"] = -5.0
    res = client.post("/api/v1/retrospective/screen", json=bad_req)
    assert res.status_code == 422

def test_invalid_feature_type_rejection():
    bad_req = dict(SAMPLE_POSITIVE_FEATURES)
    bad_req["elevation_m"] = "not_a_number"
    res = client.post("/api/v1/retrospective/screen", json=bad_req)
    assert res.status_code == 422

def test_invalid_model_id_rejection():
    bad_req = dict(SAMPLE_POSITIVE_FEATURES)
    bad_req["model_id"] = "non_existent_deep_net_v99"
    res = client.post("/api/v1/retrospective/screen", json=bad_req)
    assert res.status_code == 422

def test_direct_screener_feature_validation_order():
    # Valid call
    vals = retrospective_screener.validate_features({
        "rain_1d_prior_mm": 10.0,
        "rain_3d_prior_mm": 20.0,
        "rain_7d_prior_mm": 30.0,
        "elevation_m": 15.0,
        "slope_deg": 2.5
    })
    assert vals == [10.0, 20.0, 30.0, 15.0, 2.5]

    # Direct call with missing feature raises ValueError
    with pytest.raises(ValueError, match="Missing required feature"):
        retrospective_screener.validate_features({"rain_1d_prior_mm": 10.0})

    # Direct call with out-of-range slope raises ValueError
    with pytest.raises(ValueError, match="exceeds maximum allowed value"):
        retrospective_screener.validate_features({
            "rain_1d_prior_mm": 10.0,
            "rain_3d_prior_mm": 20.0,
            "rain_7d_prior_mm": 30.0,
            "elevation_m": 15.0,
            "slope_deg": 120.0
        })
