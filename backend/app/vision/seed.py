"""Sample cameras so the page is alive on first run.

Each sample camera uses the AI-generated photo set in `sample_media/` when it is present (four photos of one fixed view,
one per water level, plus `calibration.json`). If a camera's photos or calibration are missing, it falls back to the
vector `SyntheticRiverSource`, so the app still runs. Either way the camera is a SAMPLE: self-running and clearly flagged
as playback in the API and UI. They are placeholders, not real agency feeds.
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Optional

import cv2

from .engine import VisionEngine
from .levels import thresholds_from_calibration
from .schemas import Calibration, Lines
from .sources.base import FrameSource
from .analysis.reference_diff import ReferenceDiffAnalyzer
from .sources.frameset import LEVELS, RUNG_COUNT, FrameSetSource
from .sources.synthetic import BED_Y, CH_X1, CH_X0, DANGER_Y, H, W, SyntheticRiverSource

logger = logging.getLogger("FloodWayVisionSeed")

MEDIA_DIR = Path(__file__).parent / "sample_media"
_PX = H - 1  # analyser normalises y by (height - 1)


def _ny(px: float) -> float:
    return px / _PX


def sample_calibration() -> Calibration:
    """Calibration for the vector fallback scene."""

    def line_at(ratio: float) -> float:
        return _ny(BED_Y - ratio * (BED_Y - DANGER_Y))

    return Calibration(
        roi=[(CH_X0 / (W - 1), _ny(108)), (CH_X1 / (W - 1), _ny(108)), (CH_X1 / (W - 1), _ny(BED_Y)), (CH_X0 / (W - 1), _ny(BED_Y))],
        lines=Lines(normal=line_at(0.2), warning=line_at(0.5), danger=_ny(DANGER_Y)),
    )


# id, name, provider, lat, lon, ratio_min, ratio_max, period_s, phase, media prefix
# Ranges and periods are tuned so that within about two minutes several cameras visibly change level.
SAMPLES = [
    ("sample-klang-jamek", "Sg. Klang @ Masjid Jamek", "city", 3.1490, 101.6960, 0.40, 1.10, 180, 0.00, "klang"),
    ("sample-gombak-tun-razak", "Sg. Gombak @ Jln Tun Razak", "city", 3.1620, 101.7200, 0.12, 0.75, 200, 0.30, "gombak"),
    ("sample-smart-tunnel", "SMART Tunnel entrance", "public", 3.1380, 101.7030, 0.03, 0.45, 220, 0.55, "smart"),
    ("sample-batu-sentul", "Sg. Batu @ Sentul", "public", 3.1840, 101.6930, 0.05, 0.62, 210, 0.80, "batu"),
    ("sample-kampung-baru-drain", "Kampung Baru Drain", "mine", 3.1642, 101.7031, 0.18, 0.80, 190, 0.15, "drain"),
]


def load_media_calibrations(media_dir: Path = MEDIA_DIR) -> dict[str, Calibration]:
    """Calibrations from sample_media/calibration.json. Entries that fail validation are skipped, not trusted."""
    path = media_dir / "calibration.json"
    if not path.exists():
        return {}
    out: dict[str, Calibration] = {}
    for cam_id, raw in json.loads(path.read_text(encoding="utf-8")).items():
        try:
            out[cam_id] = Calibration(roi=[tuple(p) for p in raw["roi"]], lines=raw["lines"])
        except Exception as exc:  # malformed entry: fall back for that camera
            logger.warning("ignoring invalid calibration for %s: %s", cam_id, exc)
    return out


def load_frames(prefix: str, media_dir: Path = MEDIA_DIR) -> Optional[dict]:
    """The four photos for a camera, or None if any is missing or unreadable."""
    frames = {}
    for level in LEVELS:
        img = cv2.imread(str(media_dir / f"{prefix}-{level}.jpg"))
        if img is None:
            return None
        frames[level] = img
    return frames


def load_ladder(prefix: str, media_dir: Path = MEDIA_DIR) -> Optional[dict[int, "cv2.Mat"]]:
    """The 12 ladder photos (r000 .. r110) for a camera, or None if any is missing or unreadable."""
    ladder = {}
    for i in range(RUNG_COUNT):
        img = cv2.imread(str(media_dir / f"{prefix}-r{i * 10:03d}.jpg"))
        if img is None:
            return None
        ladder[i] = img
    return ladder


def build_sample_source(prefix: str, cam_id: str, lo: float, hi: float, period: float, phase: float, seed: int,
                 media_dir: Path = MEDIA_DIR, calibrations: Optional[dict] = None) -> tuple[FrameSource, Calibration, str]:
    """(source, calibration, kind) where kind is 'photos' or 'synthetic'."""
    calibrations = load_media_calibrations(media_dir) if calibrations is None else calibrations
    cal = calibrations.get(cam_id)
    frames = load_frames(prefix, media_dir) if cal else None
    if cal and frames:
        thr = thresholds_from_calibration(cal)
        src = FrameSetSource(frames, (thr.normal, thr.warning, thr.danger), lo, hi, period, phase, seed=seed, ladder=load_ladder(prefix, media_dir))
        return src, cal, "photos"
    return SyntheticRiverSource(lo, hi, period, phase, seed=seed), sample_calibration(), "synthetic"


def seed_samples(engine: VisionEngine, media_dir: Path = MEDIA_DIR) -> dict[str, str]:
    """Register the sample cameras. Returns {camera_id: 'photos'|'synthetic'} for logging and tests."""
    interval = engine.settings.default_interval_s
    offset = engine.settings.sample_clock_offset_s
    calibrations = load_media_calibrations(media_dir)
    kinds: dict[str, str] = {}
    for i, (cid, name, provider, lat, lon, lo, hi, period, phase, prefix) in enumerate(SAMPLES):
        source, cal, kind = build_sample_source(prefix, cid, lo, hi, period, phase, i, media_dir, calibrations)
        if offset:
            import time

            source.clock = lambda off=offset: time.time() + off  # testing aid, see VISION_SAMPLE_CLOCK_OFFSET_S
        # Photographic water is rippled, so these cameras are read by change against their own dry frame (rung r000).
        analyzer = ReferenceDiffAnalyzer(source.ladder[0]) if kind == "photos" and getattr(source, "ladder", None) else None
        engine.register_synthetic(cid, name, provider, lat, lon, cal, source, interval, analyzer=analyzer)
        kinds[cid] = kind
    logger.info("sample cameras: %s", ", ".join(f"{k}={v}" for k, v in kinds.items()))
    # Genuinely unreachable URL (.invalid never resolves) so the offline state is real.
    engine.register_offline_placeholder("sample-backyard-stream", "Backyard Stream", 3.1700, 101.7100,
                                        sample_calibration(), "https://backyard-camera.invalid/frame.jpg", interval)
    return kinds


def seed_barriers(engine: VisionEngine) -> None:
    """Two SIMULATED underpass barriers for the demo. Sites are illustrative points on stored demo routes, not surveyed
    underpasses, and no real barrier is connected. B-01 follows the Klang sample camera, the one sample that reaches
    DANGER on its own cycle. B-02 follows depth node fw-node-03, which a bench ESP32 can drive (firmware/)."""
    from .barriers import Barrier

    engine.barriers.register(Barrier(
        id="B-01", name="Underpass B-01, west of Masjid Jamek (demo)", lat=3.1517, lon=101.6931, radius_m=120,
        trigger="camera:sample-klang-jamek", trigger_name="Sg. Klang @ Masjid Jamek (sample camera)",
    ))
    engine.barriers.register(Barrier(
        id="B-02", name="Jalan Kuching underpass B-02 (demo)", lat=3.1832, lon=101.6798, radius_m=120,
        trigger="node:fw-node-03", trigger_name="Underpass depth node fw-node-03",
    ))
