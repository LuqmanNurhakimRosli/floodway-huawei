"""Training-free baseline: water is smooth and (usually) coloured, concrete is textured and grey.

HONEST LIMITS: this is a baseline for a fixed camera in daylight. It will struggle with night/IR
(grey, low texture), heavy glare, very smooth concrete, and clear water. Use it to get the pipeline
running; replace with the YOLO segmentation analyser once you have labelled frames from your cameras."""
from __future__ import annotations

import cv2
import numpy as np

from ..schemas import Calibration
from .base import FrameResult
from .waterline import EDGE_CORRECTION_ROWS, polygon_mask, ratio_from_mask

STD_SMOOTH = 4.5     # local grey-level std below this counts as "smooth"
MIN_SATURATION = 0.08


class ClassicalWaterAnalyzer:
    name = "classical-v1"

    def analyze(self, frame_bgr: np.ndarray, cal: Calibration) -> FrameResult:
        h, w = frame_bgr.shape[:2]
        roi = polygon_mask((h, w), cal.roi)
        if not roi.any():
            return FrameResult(None, None, 0.0)

        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY).astype(np.float32)
        mean = cv2.blur(gray, (7, 7))
        sq_mean = cv2.blur(gray * gray, (7, 7))
        std = np.sqrt(np.maximum(sq_mean - mean * mean, 0.0))
        smooth = std < STD_SMOOTH

        sat = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2HSV)[..., 1].astype(np.float32) / 255.0
        coloured = sat >= MIN_SATURATION
        if float(sat[roi].mean()) < 0.05:  # grey / IR scene: colour carries no information
            coloured = np.ones_like(coloured)

        mask = (smooth & coloured & roi).astype(np.uint8)
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        return ratio_from_mask(mask.astype(bool), roi, cal, edge_rows=EDGE_CORRECTION_ROWS)
