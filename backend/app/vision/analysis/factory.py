from __future__ import annotations

from ..config import VisionSettings
from .classical import ClassicalWaterAnalyzer


def get_analyzer(settings: VisionSettings):
    if settings.analyzer == "yolo":
        from .yolo_seg import YoloWaterAnalyzer

        return YoloWaterAnalyzer(settings.yolo_weights)
    return ClassicalWaterAnalyzer()
