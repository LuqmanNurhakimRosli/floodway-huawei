"""Optional learned analyser (YOLOv8/11 segmentation). Not exercised by the unit tests because it
needs `pip install ultralytics` and trained weights. Train on frames from YOUR cameras
(label one class: water) for best results, then set:
    VISION_ANALYZER=yolo
    VISION_YOLO_WEIGHTS=models/water-seg.pt"""
from __future__ import annotations

import cv2
import numpy as np

from ..schemas import Calibration
from .base import FrameResult
from .waterline import polygon_mask, ratio_from_mask

WATER_NAMES = {"water", "flood", "river"}


class YoloWaterAnalyzer:
    name = "yolo-seg"

    def __init__(self, weights: str):
        if not weights:
            raise ValueError("VISION_YOLO_WEIGHTS is required for the yolo analyser")
        from ultralytics import YOLO  # lazy import: heavy optional dependency

        self.model = YOLO(weights)

    def analyze(self, frame_bgr: np.ndarray, cal: Calibration) -> FrameResult:
        h, w = frame_bgr.shape[:2]
        roi = polygon_mask((h, w), cal.roi)
        result = self.model.predict(frame_bgr, verbose=False)[0]
        mask = np.zeros((h, w), bool)
        if result.masks is not None:
            names = result.names
            for seg, cls in zip(result.masks.data.cpu().numpy(), result.boxes.cls.cpu().numpy()):
                if str(names[int(cls)]).lower() in WATER_NAMES:
                    mask |= cv2.resize(seg.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST).astype(bool)
        return ratio_from_mask(mask, roi, cal)
