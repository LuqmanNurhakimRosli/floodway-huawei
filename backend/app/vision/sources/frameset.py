"""A sample camera backed by four AI-generated photos of the same fixed view at different water levels.

HONESTY: the frames are AI-generated sample imagery (see backend/app/vision/sample_media/README.md). The camera is
flagged as a sample/playback source in the API and the UI, exactly like the synthetic scenes it replaces.

The simulated water height follows the same sine wave as `SyntheticRiverSource.ratio_at`, so the page moves on its own.
Each grab returns the photo for the current level plus a little seeded sensor noise, so consecutive frames are not
byte-identical (the engine only counts a frame as new when its hash changes) and the analyser still sees what a real,
slightly noisy camera would give it.
"""
from __future__ import annotations

import math
import time
from typing import Callable, Mapping

import numpy as np

from .base import FrameSource, SourceError

LEVELS = ("normal", "watch", "warning", "danger")


def level_for_ratio(ratio: float, normal: float, warning: float, danger: float = 0.97) -> str:
    """Which of the four photos matches a simulated water ratio. `normal`/`warning`/`danger` are the camera's own
    thresholds (`thresholds_from_calibration`), so the photo shown is the one the analyser will classify the same way."""
    if ratio >= danger:
        return "danger"
    if ratio >= warning:
        return "warning"
    if ratio >= normal:
        return "watch"
    return "normal"


class FrameSetSource(FrameSource):
    is_playback = True

    def __init__(
        self,
        frames: Mapping[str, np.ndarray],
        thresholds: tuple[float, float, float],
        ratio_min: float,
        ratio_max: float,
        period_s: float,
        phase: float = 0.0,
        seed: int = 0,
        noise_sigma: float = 0.8,
        clock: Callable[[], float] = time.time,
    ):
        missing = [k for k in LEVELS if k not in frames]
        if missing:
            raise ValueError(f"frame set is missing levels: {missing}")
        self.frames = {k: np.asarray(v) for k, v in frames.items()}
        self.thresholds = thresholds
        self.ratio_min, self.ratio_max = ratio_min, ratio_max
        self.period_s, self.phase = period_s, phase
        self.noise_sigma = noise_sigma
        self.rng = np.random.default_rng(seed)
        self.clock = clock

    def ratio_at(self, t: float) -> float:
        mid = (self.ratio_min + self.ratio_max) / 2
        amp = (self.ratio_max - self.ratio_min) / 2
        return mid + amp * math.sin(2 * math.pi * (t / self.period_s + self.phase))

    def level_at(self, t: float) -> str:
        return level_for_ratio(self.ratio_at(t), *self.thresholds)

    def _noisy(self, frame: np.ndarray) -> np.ndarray:
        if self.noise_sigma <= 0:
            return frame.copy()
        noise = self.rng.normal(0.0, self.noise_sigma, frame.shape).astype(np.float32)
        return np.clip(frame.astype(np.float32) + noise, 0, 255).astype(np.uint8)

    def grab_frames(self, n: int, gap_s: float) -> list[np.ndarray]:
        if n < 1:
            raise SourceError("no frames requested")
        t0 = self.clock()
        return [self._noisy(self.frames[self.level_at(t0 + i * gap_s)]) for i in range(n)]
