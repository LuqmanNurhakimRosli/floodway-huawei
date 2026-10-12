"""Reference-difference analyser: water is whatever changed against a dry reference frame of the same fixed camera.

WHY: the classical analyser looks for smooth coloured pixels, which only fits flat synthetic water. Real photographic
flood water is rippled and foamy, and concrete walls are tan too, so no texture or colour rule separates them reliably.
For a camera that does not move, the honest signal is change against a known dry frame.

HONEST LIMITS: it assumes a fixed camera and steady light. A shadow, a lighting change or a moved camera reads as
water. It cannot reference a camera it has no dry frame for, so user cameras keep the classical analyser. The real
fix for arbitrary cameras is a learned segmenter (`yolo_seg.py`) trained on labelled frames."""
from __future__ import annotations

import cv2
import numpy as np

from ..schemas import Calibration
from .base import FrameResult
from .waterline import polygon_mask, ratio_from_mask

CHANGE_THRESHOLD = 20.0   # colour distance (0..441) above which a pixel counts as changed
BLUR_SIGMA = 2.0          # smooths grain and JPEG noise before comparing
GAP_ROWS = 60             # rows of a lid, grating or pole that may hide the water without ending the waterline
ROW_FRACTION = 0.25       # shallow real water covers only part of the channel width, so a wet row needs 25%, not 50%


class ReferenceDiffAnalyzer:
    name = "reference-diff-v1"

    def __init__(self, reference_bgr: np.ndarray, threshold: float = CHANGE_THRESHOLD):
        self.threshold = threshold
        self._ref = cv2.GaussianBlur(reference_bgr, (0, 0), BLUR_SIGMA).astype(np.float32)

    def analyze(self, frame_bgr: np.ndarray, cal: Calibration) -> FrameResult:
        h, w = self._ref.shape[:2]
        if frame_bgr.shape[:2] != (h, w):
            frame_bgr = cv2.resize(frame_bgr, (w, h), interpolation=cv2.INTER_AREA)
        roi = polygon_mask((h, w), cal.roi)
        if not roi.any():
            return FrameResult(None, None, 0.0)
        cur = cv2.GaussianBlur(frame_bgr, (0, 0), BLUR_SIGMA).astype(np.float32)
        dist = np.sqrt(((cur - self._ref) ** 2).sum(axis=2))
        changed = cv2.GaussianBlur((dist > self.threshold).astype(np.float32), (0, 0), BLUR_SIGMA) > 0.5
        return ratio_from_mask(changed & roi, roi, cal, row_fraction=ROW_FRACTION, gap_rows=GAP_ROWS)
