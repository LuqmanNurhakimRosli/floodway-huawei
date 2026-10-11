import pytest

from app.vision.levels import LevelTracker, compute_trend, lines_crossed, ratio_to_level, thresholds_from_calibration
from app.vision.schemas import Calibration, Level, Lines


def make_cal():
    return Calibration(
        roi=[(0.2, 0.3), (0.8, 0.3), (0.8, 0.9), (0.2, 0.9)],
        lines=Lines(normal=0.78, warning=0.6, danger=0.35),
    )


def test_thresholds_map_lines_to_bank_height():
    t = thresholds_from_calibration(make_cal())
    assert t.normal == pytest.approx((0.9 - 0.78) / (0.9 - 0.35))
    assert t.warning == pytest.approx((0.9 - 0.6) / (0.9 - 0.35))
    assert t.danger == pytest.approx(0.97)


@pytest.mark.parametrize("ratio,expected", [
    (0.0, Level.NORMAL), (0.1, Level.NORMAL), (0.3, Level.ADVISORY),
    (0.6, Level.WARNING), (0.96, Level.WARNING), (0.97, Level.DANGER), (1.2, Level.DANGER),
])
def test_ratio_to_level(ratio, expected):
    assert ratio_to_level(ratio, thresholds_from_calibration(make_cal())) == expected


def test_lines_crossed():
    t = thresholds_from_calibration(make_cal())
    assert lines_crossed(0.1, t) == []
    assert lines_crossed(0.6, t) == ["normal", "warning"]
    assert lines_crossed(1.0, t) == ["normal", "warning", "danger"]


def test_invalid_line_order_rejected():
    with pytest.raises(ValueError):
        Lines(normal=0.5, warning=0.6, danger=0.4)


def test_normal_line_must_be_above_bed():
    with pytest.raises(ValueError):
        Calibration(roi=[(0.2, 0.3), (0.8, 0.3), (0.8, 0.6)], lines=Lines(normal=0.7, warning=0.5, danger=0.35))


def test_trend():
    assert compute_trend([0.2, 0.2, 0.2]) == "steady"
    assert compute_trend([0.1, 0.1, 0.1, 0.3, 0.35, 0.4]) == "rising"
    assert compute_trend([0.5, 0.5, 0.5, 0.3, 0.25, 0.2]) == "falling"


class TestTracker:
    def test_escalates_after_two_consecutive(self):
        t = LevelTracker()
        assert t.update(Level.WARNING, 0.9) == (Level.NORMAL, False)
        assert t.update(Level.WARNING, 0.9) == (Level.WARNING, True)

    def test_single_blip_is_ignored(self):
        t = LevelTracker()
        t.update(Level.WARNING, 0.9)
        assert t.update(Level.NORMAL, 0.9)[0] == Level.NORMAL

    def test_confident_danger_is_immediate(self):
        t = LevelTracker()
        assert t.update(Level.DANGER, 0.95) == (Level.DANGER, True)

    def test_unsure_danger_needs_confirmation(self):
        t = LevelTracker()
        assert t.update(Level.DANGER, 0.5)[0] == Level.NORMAL
        assert t.update(Level.DANGER, 0.5)[0] == Level.DANGER

    def test_streak_escalates_to_lowest_seen(self):
        t = LevelTracker()
        t.update(Level.DANGER, 0.5)
        assert t.update(Level.WARNING, 0.5)[0] == Level.WARNING

    def test_deescalation_is_slow_and_stepwise(self):
        t = LevelTracker()
        t.update(Level.DANGER, 0.95)
        for _ in range(2):
            assert t.update(Level.NORMAL, 0.9)[0] == Level.DANGER
        assert t.update(Level.NORMAL, 0.9)[0] == Level.WARNING  # never straight to NORMAL
        for _ in range(2):
            t.update(Level.NORMAL, 0.9)
        assert t.update(Level.NORMAL, 0.9)[0] == Level.ADVISORY

    def test_recovery_streak_resets_when_level_returns(self):
        t = LevelTracker()
        t.update(Level.DANGER, 0.95)
        t.update(Level.NORMAL, 0.9)
        t.update(Level.NORMAL, 0.9)
        t.update(Level.DANGER, 0.95)  # back up: counter resets
        t.update(Level.NORMAL, 0.9)
        assert t.update(Level.NORMAL, 0.9)[0] == Level.DANGER
