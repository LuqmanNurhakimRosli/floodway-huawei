"""Combine the per-frame results of one capture burst into a single, robust window result."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import numpy as np

from .base import FrameResult


@dataclass
class WindowResult:
    ratio: Optional[float]
    waterline_y: Optional[float]
    confidence: float
    frames_used: int


def aggregate(results: list[FrameResult]) -> WindowResult:
    valid = [r for r in results if r.ratio is not None]
    if not valid:
        return WindowResult(None, None, 0.0, 0)
    ratios = np.array([r.ratio for r in valid], float)
    med = float(np.median(ratios))
    mad = float(np.median(np.abs(ratios - med)))
    agreement = 1.0 - min(1.0, mad / 0.08)
    quality = float(np.mean([r.confidence for r in valid]))
    coverage = len(valid) / max(1, len(results))
    confidence = float(np.clip(quality * (0.5 + 0.5 * agreement) * coverage, 0.0, 1.0))
    ys = [r.waterline_y for r in valid if r.waterline_y is not None]
    return WindowResult(med, float(np.median(ys)) if ys else None, round(confidence, 3), len(valid))
