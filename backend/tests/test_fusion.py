from fastapi.testclient import TestClient

from app.main import app
from app.services.fusion import fuse, model_level
from app.vision.schemas import Level

N, A, W, D = Level.NORMAL, Level.ADVISORY, Level.WARNING, Level.DANGER


def test_no_data_is_normal():
    f = fuse({"iot": None, "cctv": None, "model": None, "met": None})
    assert f.level == N and f.reporting == 0


def test_live_reading_alone_sets_the_level():
    assert fuse({"cctv": W}).level == W
    assert fuse({"iot": A, "cctv": N}).level == A


def test_context_alone_is_capped_at_advisory():
    f = fuse({"model": W, "met": D, "cctv": N})
    assert f.level == A and f.capped and not f.escalated


def test_another_factor_at_warning_raises_one_step():
    f = fuse({"iot": W, "met": W})
    assert f.level == D and f.escalated
    assert fuse({"cctv": A, "model": W}).level == W


def test_two_live_readings_agreeing_escalate():
    assert fuse({"iot": W, "cctv": W}).level == D


def test_lead_factor_does_not_agree_with_itself():
    f = fuse({"iot": W, "cctv": N, "model": A})
    assert f.level == W and not f.escalated


def test_danger_stays_danger():
    f = fuse({"iot": D, "cctv": D, "model": W, "met": W})
    assert f.level == D and len(f.agreeing) == 4


def test_model_bands():
    assert model_level(0.25) == N
    assert model_level(0.44) == A
    assert model_level(0.74) == W
    assert model_level(0.99) == W  # a relative score never reaches DANGER on its own


def test_route_fuses_and_explains():
    r = TestClient(app).post("/api/v1/fusion", json={"iot": "WARNING", "cctv": "ADVISORY", "model_score": 0.9, "met": "orange"})
    assert r.status_code == 200
    body = r.json()
    assert body["level"] == "DANGER"
    assert body["agreeing"] == ["iot", "model", "met"]
    assert body["reporting"] == 4
    assert "not a trained model" in body["method"]


def test_route_rejects_out_of_range_score():
    assert TestClient(app).post("/api/v1/fusion", json={"model_score": 1.5}).status_code == 422
