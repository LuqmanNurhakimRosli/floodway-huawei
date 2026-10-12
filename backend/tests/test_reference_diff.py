"""ReferenceDiffAnalyzer: water is whatever changed against a dry reference frame of the same fixed camera."""
import numpy as np
import pytest

from app.vision.analysis.reference_diff import ReferenceDiffAnalyzer
from app.vision.schemas import Calibration

H, W = 360, 640
CAL = Calibration(roi=[(0.2, 0.40), (0.8, 0.40), (0.8, 0.94), (0.2, 0.94)], lines={"normal": 0.82, "warning": 0.65, "danger": 0.48})


def _scene(seed=1):
    """A textured, non-uniform dry scene, so the test cannot pass by relying on smooth water."""
    rng = np.random.default_rng(seed)
    base = rng.integers(90, 150, (H, W, 3)).astype(np.uint8)
    return base


def _flood(dry, top_row):
    """The same scene with brown, rippled water from `top_row` to the bottom of the frame."""
    wet = dry.copy()
    rng = np.random.default_rng(7)
    wet[top_row:, :, :] = (np.array([60, 95, 130]) + rng.integers(-25, 25, (H - top_row, W, 3))).clip(0, 255).astype(np.uint8)
    return wet


def test_reads_textured_water_at_the_row_it_sits():
    dry = _scene()
    an = ReferenceDiffAnalyzer(dry)
    # danger line is row 0.48*359 = 172, bed 0.94*359 = 337: water at row 255 is ratio (337-255)/(337-172) = 0.50
    res = an.analyze(_flood(dry, 255), CAL)
    assert res.ratio == pytest.approx(0.50, abs=0.06)


def test_dry_frame_reads_zero():
    dry = _scene()
    res = ReferenceDiffAnalyzer(dry).analyze(dry.copy(), CAL)
    assert res.ratio == 0.0


def test_sensor_noise_alone_is_not_water():
    dry = _scene()
    noisy = np.clip(dry.astype(np.float32) + np.random.default_rng(3).normal(0, 1.5, dry.shape), 0, 255).astype(np.uint8)
    assert ReferenceDiffAnalyzer(dry).analyze(noisy, CAL).ratio == 0.0


def test_rises_with_the_water():
    dry = _scene()
    an = ReferenceDiffAnalyzer(dry)
    readings = [an.analyze(_flood(dry, row), CAL).ratio for row in (320, 280, 240, 200, 175)]
    assert readings == sorted(readings) and readings[-1] > 0.9


def test_a_frame_of_another_size_is_resized_not_rejected():
    dry = _scene()
    small = np.ascontiguousarray(_flood(dry, 255)[::2, ::2])
    assert ReferenceDiffAnalyzer(dry).analyze(small, CAL).ratio == pytest.approx(0.50, abs=0.08)
