"""Check that the sample frames classify at the level they were generated for.
Run from backend/:  python -m app.vision.sample_media.check_frames
Uses the project's real analyser and level rules. Do not change thresholds to pass."""
from __future__ import annotations

import json
from pathlib import Path

import cv2

from app.vision.analysis.reference_diff import ReferenceDiffAnalyzer
from app.vision.levels import ratio_to_level, thresholds_from_calibration
from app.vision.schemas import Calibration

HERE = Path(__file__).parent
EXPECT = {"normal": "NORMAL", "watch": "ADVISORY", "warning": "WARNING", "danger": "DANGER"}
CAMERAS = {
    "klang": "sample-klang-jamek",
    "gombak": "sample-gombak-tun-razak",
    "smart": "sample-smart-tunnel",
    "batu": "sample-batu-sentul",
    "drain": "sample-kampung-baru-drain",
}

cal_all = json.loads((HERE / "calibration.json").read_text(encoding="utf-8"))
total = hits = 0
for short, cam_id in CAMERAS.items():
    cal = Calibration(roi=[tuple(p) for p in cal_all[cam_id]["roi"]], lines=cal_all[cam_id]["lines"])
    thr = thresholds_from_calibration(cal)
    analyzer = ReferenceDiffAnalyzer(cv2.imread(str(HERE / f"{short}-r000.jpg")))  # as in the app
    row = []
    cam_hits = 0
    for level, expected in EXPECT.items():
        frame = cv2.imread(str(HERE / f"{short}-{level}.jpg"))
        if frame is None:
            row.append(f"{level}: MISSING")
            continue
        res = analyzer.analyze(frame, cal)
        got = ratio_to_level(res.ratio, thr).value if res.ratio is not None else "NONE"  # str Enum: .value prints cleanly
        ok = got == expected
        total += 1
        cam_hits += ok
        hits += ok
        row.append(f"{level}: expect {expected:<8} got {got:<8} ratio {res.ratio if res.ratio is None else round(res.ratio, 2)} {'OK' if ok else 'MISS'}")
    print(f"{cam_id}  ({cam_hits}/4)")
    for r in row:
        print("   ", r)
print(f"\nTOTAL {hits}/{total} frames classified at the expected level")
