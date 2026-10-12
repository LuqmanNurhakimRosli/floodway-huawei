"""Does every rung of every camera read at the water height it was made for, and does the background hold still?

Run from backend/:  python -m app.vision.sample_media.check_ladder
Uses the analyser the app uses for the sample cameras (reference difference against rung r000) and the camera's own calibration. Do not change thresholds or blur frames to pass.

For rung r (r000 .. r110) the water surface was meant to sit at r x bank height (0 = bed, 1 = bank top), so the analyser
should read a ratio close to r. Three things are reported per camera:
  reading   how many of the 12 rungs read within TOL of their nominal ratio, and the mean absolute error
  order     whether the readings rise with the rungs (no rung reads lower than the one below it by more than SLACK)
  drift     mean grey-level change of the area ABOVE the water zone between rung 0 and every other rung. It must stay
            small: the camera did not move and the light did not change. Large drift means the image tool redrew the scene.
Exit code 1 if any camera fails any of the three, or the legacy four-level copies differ from their rungs."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import cv2
import numpy as np

from app.vision.analysis.reference_diff import ReferenceDiffAnalyzer
from app.vision.levels import ratio_to_level, thresholds_from_calibration
from app.vision.schemas import Calibration

HERE = Path(__file__).parent
CAMERAS = {
    "klang": "sample-klang-jamek",
    "gombak": "sample-gombak-tun-razak",
    "smart": "sample-smart-tunnel",
    "batu": "sample-batu-sentul",
    "drain": "sample-kampung-baru-drain",
}
RUNGS = tuple(range(0, 120, 10))
LEGACY = {"normal": (10, "NORMAL"), "watch": (40, "ADVISORY"), "warning": (80, "WARNING"), "danger": (100, "DANGER")}
TOL = 0.10          # a rung passes if |measured - nominal| <= TOL
MIN_PASS = 10       # of 12 rungs per camera
SLACK = 0.06        # readings may dip this much between neighbouring rungs (the Drain lip stops r100 and r110 rising apart)
MAX_DRIFT = 8.0     # grey levels (0-255), mean absolute, area above the zone


def load(cam: str, rung: int):
    return cv2.imread(str(HERE / f"{cam}-r{rung:03d}.jpg"))


def drift(ref: np.ndarray, frame: np.ndarray, roi_top: float) -> float:
    rows = max(8, int((roi_top - 0.04) * ref.shape[0]))
    a = cv2.GaussianBlur(cv2.cvtColor(ref[:rows], cv2.COLOR_BGR2GRAY), (5, 5), 0).astype(np.float32)
    b = cv2.GaussianBlur(cv2.cvtColor(frame[:rows], cv2.COLOR_BGR2GRAY), (5, 5), 0).astype(np.float32)
    return float(np.abs(a - b).mean())


def main() -> int:
    cal_all = json.loads((HERE / "calibration.json").read_text(encoding="utf-8"))
    failures: list[str] = []
    for cam, cam_id in CAMERAS.items():
        cal = Calibration(roi=[tuple(p) for p in cal_all[cam_id]["roi"]], lines=cal_all[cam_id]["lines"])
        thr = thresholds_from_calibration(cal)
        roi_top = min(y for _, y in cal.roi)
        frames = {r: load(cam, r) for r in RUNGS}
        if any(f is None for f in frames.values()):
            gone = [f"r{r:03d}" for r, f in frames.items() if f is None]
            print(f"{cam_id}: MISSING {gone}")
            failures.append(f"{cam}: missing rungs")
            continue
        analyzer = ReferenceDiffAnalyzer(frames[0])  # the same analyser the app uses for the sample cameras
        measured, errs, drifts = [], [], []
        for r in RUNGS:
            res = analyzer.analyze(frames[r], cal)
            m = float("nan") if res.ratio is None else float(res.ratio)
            measured.append(m)
            errs.append(abs(m - r / 100) if m == m else 9.9)
            drifts.append(drift(frames[0], frames[r], roi_top) if r else 0.0)
        ok_rungs = sum(e <= TOL for e in errs)
        ordered = all(b >= a - SLACK for a, b in zip(measured, measured[1:]) if a == a and b == b)
        worst_drift = max(drifts)
        print(f"{cam_id}")
        print("   nominal  " + " ".join(f"{r / 100:5.2f}" for r in RUNGS))
        print("   measured " + " ".join(f"{m:5.2f}" for m in measured))
        print(f"   reading {ok_rungs}/12 within {TOL}  mean err {np.nanmean(errs):.3f}  order {'ok' if ordered else 'BROKEN'}  worst drift {worst_drift:.1f}")
        if ok_rungs < MIN_PASS:
            failures.append(f"{cam}: only {ok_rungs}/12 rungs read correctly")
        if not ordered:
            failures.append(f"{cam}: readings do not rise with the rungs")
        if worst_drift > MAX_DRIFT:
            failures.append(f"{cam}: background drift {worst_drift:.1f} > {MAX_DRIFT}")
        for level, (rung, expect) in LEGACY.items():
            legacy = cv2.imread(str(HERE / f"{cam}-{level}.jpg"))
            if legacy is None or not np.array_equal(legacy, frames[rung]):
                failures.append(f"{cam}: {cam}-{level}.jpg is not an exact copy of r{rung:03d}")
                continue
            res = analyzer.analyze(legacy, cal)
            got = ratio_to_level(res.ratio, thr).value if res.ratio is not None else "NONE"
            if got != expect:
                failures.append(f"{cam}: legacy {level} classifies as {got}, wanted {expect}")
    print()
    if failures:
        print("FAIL\n  " + "\n  ".join(failures))
        return 1
    print("PASS: every camera reads correctly, in order, with a steady background")
    return 0


if __name__ == "__main__":
    sys.exit(main())
