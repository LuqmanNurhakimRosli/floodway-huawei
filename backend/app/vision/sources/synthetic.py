"""Self-running sample river camera. It draws a CCTV-style scene whose water level moves on its
own, so the whole pipeline (capture -> AI -> level -> alert) can be exercised with no real camera.
Always flagged as playback/sample in the API and UI."""
from __future__ import annotations

import math
import time
from typing import Callable

import cv2
import numpy as np

from .base import FrameSource

W, H = 640, 360
BED_Y = 330      # bottom of the channel
DANGER_Y = 130   # top of the bank (the danger line)
CH_X0, CH_X1 = 160, 480


class SyntheticRiverSource(FrameSource):
    is_playback = True

    def __init__(
        self,
        ratio_min: float,
        ratio_max: float,
        period_s: float,
        phase: float = 0.0,
        seed: int = 0,
        clock: Callable[[], float] = time.time,
    ):
        self.ratio_min, self.ratio_max = ratio_min, ratio_max
        self.period_s, self.phase = period_s, phase
        self.rng = np.random.default_rng(seed)
        self.clock = clock

    def ratio_at(self, t: float) -> float:
        mid = (self.ratio_min + self.ratio_max) / 2
        amp = (self.ratio_max - self.ratio_min) / 2
        return mid + amp * math.sin(2 * math.pi * (t / self.period_s + self.phase))

    def render(self, ratio: float) -> np.ndarray:
        img = np.zeros((H, W, 3), np.float32)
        # sky and distant buildings
        img[:, :] = (205, 190, 170)
        for x0, x1, top in ((0, 90, 40), (90, 170, 70), (480, 560, 55), (560, 640, 85)):
            img[top:DANGER_Y, x0:x1] = (110, 105, 100)
        # concrete banks / channel walls (textured, grey)
        img[DANGER_Y:, :] = (150, 150, 150)
        img[DANGER_Y:, :] += self.rng.normal(0, 12, (H - DANGER_Y, W, 1)).astype(np.float32)
        img[DANGER_Y - 22 : DANGER_Y, CH_X0:CH_X1] = (150, 150, 150)
        img[DANGER_Y - 22 : DANGER_Y, CH_X0:CH_X1] += self.rng.normal(0, 12, (22, CH_X1 - CH_X0, 1)).astype(np.float32)
        # water: smooth, brown, slightly rippled
        water_y = int(round(BED_Y - ratio * (BED_Y - DANGER_Y)))
        water_y = max(0, min(BED_Y, water_y))
        if water_y < BED_Y:
            region = img[water_y:BED_Y, CH_X0:CH_X1]
            region[:] = (70, 95, 110)  # BGR brown
            yy = np.arange(region.shape[0], dtype=np.float32)[:, None, None]
            region += 2.0 * np.sin(yy / 3.0)
            region += self.rng.normal(0, 1.2, region.shape).astype(np.float32)
        out = np.clip(img, 0, 255).astype(np.uint8)
        cv2.putText(out, "CAM", (10, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
        return out

    def grab_frames(self, n: int, gap_s: float) -> list[np.ndarray]:
        t0 = self.clock()
        return [self.render(self.ratio_at(t0 + i * gap_s)) for i in range(n)]
