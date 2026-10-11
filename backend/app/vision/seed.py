"""Sample cameras so the page is alive on first run. These are SYNTHETIC (self-running) scenes,
clearly flagged as playback in the API/UI. They are placeholders, not real agency feeds.
Replace or extend them with real sources (see docs/LIVE_VISION_IMPLEMENTATION_PLAN.md)."""
from __future__ import annotations

from .engine import VisionEngine
from .schemas import Calibration, Lines
from .sources.synthetic import BED_Y, CH_X1, CH_X0, DANGER_Y, H, W, SyntheticRiverSource

_PX = H - 1  # analyser normalises y by (height - 1)


def _ny(px: float) -> float:
    return px / _PX


def sample_calibration() -> Calibration:
    def line_at(ratio: float) -> float:
        return _ny(BED_Y - ratio * (BED_Y - DANGER_Y))

    return Calibration(
        roi=[(CH_X0 / (W - 1), _ny(108)), (CH_X1 / (W - 1), _ny(108)), (CH_X1 / (W - 1), _ny(BED_Y)), (CH_X0 / (W - 1), _ny(BED_Y))],
        lines=Lines(normal=line_at(0.2), warning=line_at(0.5), danger=_ny(DANGER_Y)),
    )


# id, name, provider, lat, lon, ratio_min, ratio_max, period_s, phase
SAMPLES = [
    ("sample-klang-jamek", "Sg. Klang @ Masjid Jamek", "city", 3.1490, 101.6960, 0.40, 1.10, 240, 0.00),
    ("sample-gombak-tun-razak", "Sg. Gombak @ Jln Tun Razak", "city", 3.1620, 101.7200, 0.12, 0.50, 300, 0.30),
    ("sample-smart-tunnel", "SMART Tunnel entrance", "public", 3.1380, 101.7030, 0.03, 0.18, 360, 0.55),
    ("sample-batu-sentul", "Sg. Batu @ Sentul", "public", 3.1840, 101.6930, 0.05, 0.30, 330, 0.80),
    ("sample-kampung-baru-drain", "Kampung Baru Drain", "mine", 3.1642, 101.7031, 0.18, 0.55, 270, 0.15),
]


def seed_samples(engine: VisionEngine) -> None:
    interval = engine.settings.default_interval_s
    for i, (cid, name, provider, lat, lon, lo, hi, period, phase) in enumerate(SAMPLES):
        engine.register_synthetic(cid, name, provider, lat, lon, sample_calibration(),
                                  SyntheticRiverSource(lo, hi, period, phase, seed=i), interval)
    # Genuinely unreachable URL (.invalid never resolves) so the offline state is real.
    engine.register_offline_placeholder("sample-backyard-stream", "Backyard Stream", 3.1700, 101.7100,
                                        sample_calibration(), "https://backyard-camera.invalid/frame.jpg", interval)
