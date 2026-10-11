import numpy as np
import pytest

from app.vision.analysis.classical import ClassicalWaterAnalyzer
from app.vision.analysis.temporal import aggregate
from app.vision.analysis.base import FrameResult
from app.vision.levels import ratio_to_level, thresholds_from_calibration
from app.vision.schemas import Level
from app.vision.seed import sample_calibration
from app.vision.sources.synthetic import SyntheticRiverSource


@pytest.mark.parametrize("true_ratio", [0.1, 0.3, 0.5, 0.8, 1.0])
def test_classical_analyzer_recovers_waterline(true_ratio):
    src = SyntheticRiverSource(true_ratio, true_ratio, 100, seed=1)
    frame = src.render(true_ratio)
    res = ClassicalWaterAnalyzer().analyze(frame, sample_calibration())
    assert res.ratio is not None
    assert abs(res.ratio - true_ratio) < 0.07, (true_ratio, res.ratio)
    assert res.confidence > 0.6


def test_dry_channel_reports_zero():
    frame = SyntheticRiverSource(0, 0, 100, seed=1).render(0.0)
    res = ClassicalWaterAnalyzer().analyze(frame, sample_calibration())
    assert res.ratio == pytest.approx(0.0, abs=0.03)


@pytest.mark.parametrize("true_ratio,expected", [
    (0.05, Level.NORMAL), (0.35, Level.ADVISORY), (0.7, Level.WARNING), (1.05, Level.DANGER),
])
def test_end_to_end_level(true_ratio, expected):
    cal = sample_calibration()
    frame = SyntheticRiverSource(true_ratio, true_ratio, 100, seed=2).render(true_ratio)
    res = ClassicalWaterAnalyzer().analyze(frame, cal)
    assert ratio_to_level(res.ratio, thresholds_from_calibration(cal)) == expected


def test_aggregate_uses_median_and_penalises_disagreement():
    steady = aggregate([FrameResult(0.5, 0.6, 0.9)] * 5)
    noisy = aggregate([FrameResult(r, 0.6, 0.9) for r in (0.1, 0.9, 0.4, 0.8, 0.2)])
    assert steady.ratio == pytest.approx(0.5)
    assert steady.confidence > noisy.confidence
    assert aggregate([FrameResult(None, None, 0.0)]).ratio is None


def test_synthetic_noise_is_robust_to_different_seeds():
    cal = sample_calibration()
    ests = [ClassicalWaterAnalyzer().analyze(SyntheticRiverSource(0.6, 0.6, 100, seed=s).render(0.6), cal).ratio for s in range(5)]
    assert np.std(ests) < 0.03
