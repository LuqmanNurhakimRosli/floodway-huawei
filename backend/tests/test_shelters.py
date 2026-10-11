import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routes import shelters
from app.services.shelters_data import SHELTERS_DATA

FRONTEND_COPY = Path(__file__).resolve().parents[2] / "frontend" / "src" / "data" / "kl_shelters.json"


def test_every_demo_shelter_is_in_kuala_lumpur():
    assert len(SHELTERS_DATA) >= 8, "the list should offer real choice"
    for s in SHELTERS_DATA:
        assert 3.05 <= s["lat"] <= 3.25 and 101.60 <= s["lon"] <= 101.78, f'{s["name"]} is outside Kuala Lumpur'


def test_no_invented_contact_details_or_official_claims():
    for s in SHELTERS_DATA:
        assert "demo" in s["contact"].lower()
        assert "official" not in json.dumps(s).lower()


def test_ids_are_unique_and_capacity_is_consistent():
    assert len({s["id"] for s in SHELTERS_DATA}) == len(SHELTERS_DATA)
    for s in SHELTERS_DATA:
        assert 0 <= s["current_capacity"] <= s["max_capacity"]
        assert (s["status"] == "FULL") == (s["current_capacity"] >= s["max_capacity"])


def test_the_api_serves_the_list():
    app = FastAPI()
    app.include_router(shelters.router)
    body = TestClient(app).get("/api/v1/shelters").json()
    assert [s["id"] for s in body] == [s["id"] for s in SHELTERS_DATA]


def test_frontend_offline_copy_matches_the_backend():
    if not FRONTEND_COPY.exists():
        return  # backend deployed on its own
    assert json.loads(FRONTEND_COPY.read_text(encoding="utf-8")) == SHELTERS_DATA
