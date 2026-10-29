"""Timeline for the v2 demo (your narration): scenes, footage cuts, the forecaster curve, Shah Alam records.

  video/.venv/Scripts/python.exe video/v2/edit_v2.py      (after prep_voice.py; reads video/footage/*.taps.json)

Writes v2/edit.json and copies it, words.json, the voice and the footage into the Remotion project.
"""
from __future__ import annotations

import asyncio
import csv
import json
import shutil
import sys
from pathlib import Path

V2 = Path(__file__).resolve().parent
VIDEO = V2.parent
REPO = VIDEO.parent
sys.path.insert(0, str(VIDEO))
sys.path.insert(0, str(REPO / "backend"))
from edit import copy, take  # noqa: E402
from app.services.forecaster import Forecaster  # noqa: E402

# scene -> (start, end) in final-video seconds, cut in the pauses between your sentences (see STORYBOARD.md)
SCENES = {1: (0.0, 9.7), 2: (9.7, 19.6), 3: (19.6, 25.6), 4: (25.6, 37.7), 5: (37.7, 64.2),
          6: (64.2, 84.1), 7: (84.1, 95.6), 8: (95.6, 108.0), 9: (108.0, 113.5)}
STORM_LEAVE_NOW_S = 0.53 * 15  # stormScenario.ts: the 'Leave now' step


def forecast_curve() -> dict:
    """The rule-based forecaster's own output for a storm input whose first danger crossing is the +90 min horizon."""
    fc = Forecaster()
    for level in (0.9, 0.8, 1.0, 0.7):
        for rain in range(40, 121, 2):
            out = asyncio.run(fc.predict_horizon(level, float(rain)))
            if out["time_to_danger_min"] == 90:
                return {"level_m": level, "rain_mm_h": rain, "danger_m": 1.5, **{k: out[k] for k in ("horizons_min", "p10", "p50", "p90", "time_to_danger_min", "source")}}
    raise SystemExit("no storm input crosses danger first at +90 min")


def shah_alam() -> list[dict]:
    rows = csv.DictReader((REPO / "datasets/jps_positives_clean.csv").open(encoding="utf-8"))
    return [{"year": int(r["year"]), "date": r["date"], "place": r["place"]} for r in rows if "shah alam" in r["place"].lower()]


def huawei_flower(dst: Path) -> None:
    """The flower from the deck's Huawei logo, white made transparent, for the service chips."""
    from PIL import Image
    import numpy as np
    im = np.asarray(Image.open(REPO / "docs/team/slide-assets/deck/huawei.png").convert("RGB")).astype(np.float32)
    flower = im[:, :int(im.shape[1] * 0.3)]
    alpha = np.clip((255 - flower.min(axis=2)) * 1.6, 0, 255)
    rgba = np.dstack([np.full(flower.shape[:2] + (3,), (199, 0, 11), np.float32), alpha]).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA")
    img.crop(img.getbbox()).save(dst)


def main() -> None:
    live, live_taps = take("live")
    mp, _ = take("map")
    rp, _ = take("report")
    play = next(t["t"] for t in live_taps if abs(t["t"] - live["storm_play"]) < 0.5)

    def seg(file: str, frm: float, to: float, start: float, end: float, **k) -> dict:
        return {"file": file, "from": round(frm, 3), "to": round(to, 3), "start": start, "end": end,
                "rate": round((to - frm) / (end - start), 3), **k}

    nadi = [  # LED colour changes land on your words: green 28.5, yellow 29.15, red 29.9
        seg("nadi_node.mp4", 0.0, 3.3, 25.6, 29.15),
        seg("nadi_node.mp4", 5.0, 5.75, 29.15, 29.9),
        seg("nadi_node.mp4", 8.9, 11.2, 29.9, 32.2, audio=True),
        seg("nadi_node.mp4", 11.2, 16.7, 32.2, 37.7),  # keeps playing, small, beside the phone
    ]
    phone = {
        4: [seg("live.mp4", play - 0.2, play + 13.55, 32.2, 37.7, badge="2.5× SPEED")],
        5: [seg("live.mp4", play + STORM_LEAVE_NOW_S - 0.3, play + STORM_LEAVE_NOW_S + 1.3, 62.6, 64.2)],
        7: [seg("map.mp4", mp["tap_open_centre"] - 0.4, mp["tap_drive"] + 0.3, 84.1, 86.4),
            seg("map.mp4", mp["drive_start"] - 0.3, mp["arrived"] + 0.6, 86.4, 89.6, badge="3× SPEED"),
            seg("map.mp4", mp["arrived"] + 0.6, mp["arrived"] + 2.4, 89.6, 91.4),
            seg("report.mp4", rp["ai_result"] - 0.2, rp["ai_result"] + 1.6, 91.4, 93.2, note="In-app sample photo"),
            seg("report.mp4", rp["area"] - 0.3, rp["area"] + 2.1, 93.2, 95.6)],
    }
    for s in nadi + [x for v in phone.values() for x in v]:
        if s["from"] < 0:
            raise SystemExit(f"{s['file']} cut starts before the take: {s}")
    out = {"scenes": {str(k): v for k, v in SCENES.items()}, "nadi": nadi, "phone": {str(k): v for k, v in phone.items()},
           "forecast": forecast_curve(), "shahAlam": shah_alam()}
    (V2 / "edit.json").write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")

    data = VIDEO / "remotion/src/data/v2"
    data.mkdir(parents=True, exist_ok=True)
    for f in ("edit.json", "words.json", "script.json"):
        shutil.copy(V2 / f, data / f)
    public = VIDEO / "remotion/public"
    for f in ("live.mp4", "map.mp4", "report.mp4", "nadi_node.mp4"):
        copy(VIDEO / "footage" / f, public / "footage" / f)
    huawei_flower(public / "img/huawei-flower.png")
    fc = out["forecast"]
    print(f"forecast: level {fc['level_m']} m, rain {fc['rain_mm_h']} mm/h -> danger at +{fc['time_to_danger_min']} min; p50 {fc['p50']}")
    print(f"Shah Alam records: {len(out['shahAlam'])}")
    for s in nadi + [x for v in phone.values() for x in v]:
        print(f"  {s['file']:14s} {s['from']:6.2f}-{s['to']:6.2f} x{s['rate']} -> {s['start']:6.2f}-{s['end']:6.2f}")


if __name__ == "__main__":
    main()
