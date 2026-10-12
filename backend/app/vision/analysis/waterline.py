"""Shared geometry: turn a boolean water mask into a waterline and a 0..1 bank-height ratio."""
from __future__ import annotations

import cv2
import numpy as np

from ..schemas import Calibration
from .base import FrameResult

# The texture filter in the classical analyser blurs the edge by about this many rows.
EDGE_CORRECTION_ROWS = 3


def polygon_mask(shape: tuple[int, int], roi: list[tuple[float, float]]) -> np.ndarray:
    h, w = shape
    pts = np.array([[int(round(x * (w - 1))), int(round(y * (h - 1)))] for x, y in roi], np.int32)
    mask = np.zeros((h, w), np.uint8)
    cv2.fillPoly(mask, [pts], 1)
    return mask.astype(bool)


def ratio_from_mask(
    water_mask: np.ndarray, roi_mask: np.ndarray, cal: Calibration, edge_rows: int = 0, bed_tolerance_rows: int = 10,
    row_fraction: float = 0.5, gap_rows: int = 0,
) -> FrameResult:
    h, _ = water_mask.shape
    ys, xs = np.nonzero(roi_mask)
    if ys.size == 0:
        return FrameResult(None, None, 0.0)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    m = water_mask[y0 : y1 + 1, x0 : x1 + 1] & roi_mask[y0 : y1 + 1, x0 : x1 + 1]
    r = roi_mask[y0 : y1 + 1, x0 : x1 + 1]
    support = r.sum(axis=1)
    row_frac = np.where(support >= 5, m.sum(axis=1) / np.maximum(support, 1), 0.0)

    bed = max(y for _, y in cal.roi)
    span = bed - cal.lines.danger

    # Find where the water starts at the bed. Users never draw the zone bottom pixel-perfectly, and
    # texture filters blur the last rows, so tolerate a few non-water rows at the very bottom.
    rows = row_frac.shape[0]
    start = rows - 1
    floor = max(0, rows - 1 - bed_tolerance_rows)
    while start >= floor and row_frac[start] < row_fraction:
        start -= 1
    if start < floor:  # nothing wet at the bed: report "dry" with modest confidence
        return FrameResult(0.0, bed, 0.35)

    # Walk up while at least `row_fraction` of the zone's width is water (half, unless the caller knows the water is patchy).
    # A bar, lid or pole can hide a few rows of water: skip up to `gap_rows` non-wet rows if wet rows resume above.
    top, misses, y = start, 0, start
    while y >= 0:
        if row_frac[y] >= row_fraction:
            top, misses = y, 0
        else:
            misses += 1
            if misses > gap_rows:
                break
        y -= 1
    y = top - 1
    detected_row = y + 1  # first wet row at the detected edge (confidence is measured HERE)

    below = row_frac[detected_row : detected_row + 6]
    above = row_frac[max(0, detected_row - 6) : max(0, detected_row - 1)]
    contrast = float(below.mean() - (above.mean() if above.size else 0.0))
    purity = float(row_frac[detected_row : start + 1].mean())

    # Only now shift the reported position to undo the blur of the texture filter.
    water_row = max(0, detected_row - edge_rows)
    water_y = (y0 + water_row) / (h - 1)
    ratio = float(np.clip((bed - water_y) / span, 0.0, 1.3))
    confidence = float(np.clip(0.55 * np.clip(contrast, 0, 1) + 0.45 * purity, 0.0, 1.0))
    return FrameResult(ratio, float(water_y), confidence)
