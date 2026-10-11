"""The AI-generated sample photo set: wiring, calibration and classification. Skipped where the media is absent."""
from pathlib import Path

import cv2
import numpy as np
import pytest

from app.vision import seed
from app.vision.analysis.classical import ClassicalWaterAnalyzer
from app.vision.config import VisionSettings
from app.vision.levels import ratio_to_level, thresholds_from_calibration
from app.vision.schemas import Calibration
from app.vision.sources.frameset import LEVELS, FrameSetSource, level_for_ratio

MEDIA = seed.MEDIA_DIR
EXPECT = {"normal": "NORMAL", "watch": "ADVISORY", "warning": "WARNING", "danger": "DANGER"}
needs_media = pytest.mark.skipif(not (MEDIA / "calibration.json").exists(), reason="sample_media is not present")


def test_level_for_ratio_boundaries():
    assert level_for_ratio(0.0, 0.25, 0.6) == "normal"
    assert level_for_ratio(0.25, 0.25, 0.6) == "watch"
    assert level_for_ratio(0.59, 0.25, 0.6) == "watch"
    assert level_for_ratio(0.6, 0.25, 0.6) == "warning"
    assert level_for_ratio(0.97, 0.25, 0.6) == "danger"
    assert level_for_ratio(1.3, 0.25, 0.6) == "danger"


def _tiny_frames():
    return {k: np.full((36, 64, 3), 40 * i, np.uint8) for i, k in enumerate(LEVELS)}


def test_frameset_requires_all_four_levels():
    frames = _tiny_frames()
    del frames["danger"]
    with pytest.raises(ValueError):
        FrameSetSource(frames, (0.25, 0.6, 0.97), 0.0, 1.2, 100)


def test_frameset_follows_the_simulated_clock_and_adds_noise():
    t = {"now": 0.0}
    src = FrameSetSource(_tiny_frames(), (0.25, 0.6, 0.97), 0.0, 1.2, 100.0, clock=lambda: t["now"])
    seen = set()
    for now in range(0, 100, 5):
        t["now"] = float(now)
        frame = src.grab_frames(1, 0)[0]
        seen.add(int(round(float(frame.mean()) / 40)))
    assert seen == {0, 1, 2, 3}, "a full cycle should visit all four level photos"
    a, b = src.grab_frames(1, 0)[0], src.grab_frames(1, 0)[0]
    assert not np.array_equal(a, b), "consecutive frames should differ (sensor noise), so the engine sees a new frame"


@needs_media
def test_calibration_json_is_valid_for_every_sample_camera():
    cals = seed.load_media_calibrations()
    for cam_id, *_ in seed.SAMPLES:
        assert cam_id in cals, f"missing calibration for {cam_id}"
        lines = cals[cam_id].lines
        assert lines.danger < lines.warning < lines.normal


@needs_media
def test_every_sample_camera_uses_photos_and_keeps_its_sample_flag():
    class Eng:
        settings = VisionSettings(data_dir=Path("."))
        registered = []

        def register_synthetic(self, cid, name, provider, lat, lon, cal, source, interval):
            self.registered.append((cid, source))

        def register_offline_placeholder(self, *a):
            pass

    eng = Eng()
    kinds = seed.seed_samples(eng)
    assert set(kinds.values()) == {"photos"}
    assert all(src.is_playback for _, src in eng.registered)  # still flagged as playback/sample


def test_falls_back_to_the_vector_scene_without_media(tmp_path):
    src, cal, kind = seed.build_sample_source("klang", "sample-klang-jamek", 0.4, 1.1, 180, 0.0, 0, media_dir=tmp_path)
    assert kind == "synthetic" and isinstance(cal, Calibration)
    assert src.grab_frames(1, 0)[0].shape[:2] == (360, 640)


@needs_media
def test_each_photo_classifies_at_its_level_even_with_sensor_noise():
    """The same 20/20 check as sample_media/check_frames.py, but run on the noisy frames the app really serves."""
    analyzer = ClassicalWaterAnalyzer()
    cals = seed.load_media_calibrations()
    misses = []
    for cam_id, *_rest, prefix in seed.SAMPLES:
        cal = cals[cam_id]
        thr = thresholds_from_calibration(cal)
        frames = seed.load_frames(prefix)
        src = FrameSetSource(frames, (thr.normal, thr.warning, thr.danger), 0, 1, 100, seed=7)
        for level, expected in EXPECT.items():
            noisy = src._noisy(frames[level])
            res = analyzer.analyze(noisy, cal)
            got = ratio_to_level(res.ratio, thr).value if res.ratio is not None else "NONE"
            if got != expected:
                misses.append(f"{cam_id}/{level}: expected {expected}, got {got} (ratio {res.ratio})")
    assert not misses, "\n".join(misses)


@needs_media
def test_media_files_stay_within_the_size_limits():
    for f in MEDIA.glob("*.jpg"):
        assert f.stat().st_size <= 300 * 1024, f"{f.name} is over 300 KB"
        img = cv2.imread(str(f))
        assert img is not None and img.shape[:2] == (360, 640), f"{f.name} should be 640x360"


@needs_media
@pytest.mark.xfail(strict=True, reason="KNOWN DEFECT: the rising-water frames are a flat patch drawn over the NORMAL frame, "
                                       "not generated water. Regenerate them (docs/PLAN_A_GEMINI_MEDIA.md, 'Defect found'), then remove this xfail.")
def test_rising_water_frames_are_not_pasted_patches():
    from app.vision.sample_media import check_realism as cr

    pasted = [f"{c}-{l}" for c in cr.CAMERAS for l in cr.LEVELS if cr.measure(c, l)["pasted"]]
    assert not pasted, f"{len(pasted)} frames look like pasted patches: {pasted}"
