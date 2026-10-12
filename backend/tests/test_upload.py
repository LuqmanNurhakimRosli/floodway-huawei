"""Photo upload for the camera wizard: type by magic bytes, size cap, token guard, EXIF dropped, delete cleans up."""
import asyncio

import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.vision.bootstrap import build_default_engine
from app.vision.config import VisionSettings
from app.vision.engine import VisionEngine
from app.vision.seed import sample_calibration
from app.vision.standalone import create_app

BASE = "/api/v1/vision"


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.delenv("VISION_WRITE_TOKEN", raising=False)

    async def no_loops(self, run_loops=True):
        self._loop = asyncio.get_running_loop()
        self._running = True

    monkeypatch.setattr(VisionEngine, "start", no_loops)
    engine = build_default_engine(VisionSettings(data_dir=tmp_path, seed_samples=True))
    with TestClient(create_app(engine)) as c:
        c.uploads = tmp_path / "uploads"
        yield c


def _photo(ext, size=(320, 180)):
    image = np.full((size[1], size[0], 3), (90, 140, 60), np.uint8)
    ok, buf = cv2.imencode(ext, image)
    assert ok
    return buf.tobytes()


def _draft(source_url):
    return {"name": "My photo cam", "lat": 3.15, "lon": 101.7, "source_type": "upload", "source_url": source_url,
            "calibration": sample_calibration().model_dump(mode="json")}


@pytest.mark.parametrize("ext", [".jpg", ".png"])
def test_accepts_jpeg_and_png_and_stores_a_jpeg(client, ext):
    r = client.post(f"{BASE}/cameras/upload", content=_photo(ext))
    assert r.status_code == 201
    ref = r.json()["source_url"]
    assert ref.startswith("upload:")
    stored = client.uploads / f"{ref.removeprefix('upload:')}.jpg"
    assert stored.read_bytes()[:3] == bytes([0xFF, 0xD8, 0xFF])


def test_rejects_a_text_file_renamed_to_jpg(client):
    r = client.post(f"{BASE}/cameras/upload", content=b"not an image at all", headers={"Content-Type": "image/jpeg"})
    assert r.status_code == 422


def test_rejects_a_truncated_image(client):
    assert client.post(f"{BASE}/cameras/upload", content=_photo(".jpg")[:40]).status_code == 422


def test_rejects_more_than_5_mb(client):
    big = _photo(".jpg") + b"\x00" * (5 * 1024 * 1024)
    assert client.post(f"{BASE}/cameras/upload", content=big).status_code == 413


def test_large_photos_are_scaled_down(client):
    ref = client.post(f"{BASE}/cameras/upload", content=_photo(".png", (4000, 2000))).json()["source_url"]
    stored = cv2.imread(str(client.uploads / f"{ref.removeprefix('upload:')}.jpg"))
    assert max(stored.shape[:2]) == 1920


def test_requires_the_token_once_one_is_set(client, monkeypatch):
    monkeypatch.setenv("VISION_WRITE_TOKEN", "operator-secret")
    assert client.post(f"{BASE}/cameras/upload", content=_photo(".jpg")).status_code == 401
    ok = client.post(f"{BASE}/cameras/upload", content=_photo(".jpg"), headers={"Authorization": "Bearer operator-secret"})
    assert ok.status_code == 201


@pytest.mark.parametrize("ref", ["upload:../../etc/passwd", "upload:" + "g" * 32, "upload:" + "a" * 31, "upload:" + "a" * 32])
def test_forged_references_are_refused_or_missing(client, ref):
    r = client.post(f"{BASE}/cameras/preview", json={"source_type": "upload", "source_url": ref})
    assert r.status_code in (422, 502)


def test_upload_becomes_a_camera_that_can_be_tested_and_deleted(client):
    ref = client.post(f"{BASE}/cameras/upload", content=_photo(".jpg")).json()["source_url"]
    preview = client.post(f"{BASE}/cameras/preview", json={"source_type": "upload", "source_url": ref})
    assert preview.status_code == 200 and preview.headers["content-type"] == "image/jpeg"
    assert client.post(f"{BASE}/cameras/test", json=_draft(ref)).status_code == 200
    created = client.post(f"{BASE}/cameras", json=_draft(ref))
    assert created.status_code == 201
    body = created.json()
    assert body["source_type"] == "upload" and body["is_playback"] is True
    stored = client.uploads / f"{ref.removeprefix('upload:')}.jpg"
    assert stored.exists()
    assert client.delete(f"{BASE}/cameras/{body['id']}").status_code == 204
    assert not stored.exists()
