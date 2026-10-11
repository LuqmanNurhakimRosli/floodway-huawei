from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Protocol

import numpy as np

from ..schemas import Calibration


@dataclass
class FrameResult:
    ratio: Optional[float]        # 0 = bed, 1 = danger line (can exceed 1 when overtopping)
    waterline_y: Optional[float]  # normalised y of the detected surface
    confidence: float             # 0..1


class WaterAnalyzer(Protocol):
    name: str

    def analyze(self, frame_bgr: np.ndarray, cal: Calibration) -> FrameResult: ...
