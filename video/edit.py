"""Place the recorded footage on the timeline: video/edit.json (read by the Remotion project and by mix.py).

Each segment plays [from, to] seconds of a take, starting `at` seconds into its scene, at `rate`.
App takes are placed from the marks their recorder logged (video/footage/<take>.taps.json), so a
re-take with slightly different timing still lines up. Taps inside a used segment become ripples + clicks.

  video/.venv/Scripts/python.exe video/edit.py      (after timeline.py)
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
FOOTAGE = ROOT / "footage"
STORM_LEAVE_NOW_S = 0.53 * 15  # stormScenario.ts: the 'Leave now' step, as a share of STORM_DURATION_S
FONTS = Path.home() / "AppData/Local/Microsoft/Windows/Fonts"
# repo path -> path under remotion/public
ASSETS = {
    "docs/product/preliminary-round/poster/assets/uitm.png": "img/uitm.png",
    "docs/team/slide-assets/deck/huawei.png": "img/huawei.png",
    "frontend/public/logo-512.png": "img/floodway-mark.png",
    "docs/team/slide-assets/huawei-bg.png": "img/huawei-bg.png",
}


def copy(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
        shutil.copy2(src, dst)


def take(name: str) -> tuple[dict[str, float], list[dict]]:
    """Marks and taps of a take, in seconds of its video (frame 0 = first captured frame)."""
    d = json.loads((FOOTAGE / f"{name}.taps.json").read_text(encoding="utf-8"))
    shift = d["start"] - d["recStart"]
    marks = {x["mark"]: x["t"] - shift for x in d["taps"] if "mark" in x}
    taps = [{"t": x["t"] - shift, "x": x["x"], "y": x["y"]} for x in d["taps"] if "x" in x]
    taps_before = {x["t"] - shift: x for x in d["taps"] if "x" in x}
    marks["_first_tap"] = min(taps_before) if taps_before else 0.0
    return marks, taps


def main() -> None:
    tl = json.loads((ROOT / "timeline.json").read_text(encoding="utf-8"))
    start = {s["scene"]: s["start"] for s in tl["scenes"]}
    live, live_taps = take("live")
    mp, map_taps = take("map")
    rp, rep_taps = take("report")
    play = next(t["t"] for t in live_taps if abs(t["t"] - live["storm_play"]) < 0.5)

    seg = lambda scene, file, frm, to, at, rate=1.0, **k: {"scene": scene, "file": file, "from": round(frm, 3), "to": round(to, 3), "at": at, "rate": rate, **k}
    segments = [
        # 3 river: node clip, green at 1x, yellow at 2x (badge), red at 1x with its real buzzer
        seg(3, "nadi_node.mp4", 0.8, 3.3, 4.8, audio=False),
        seg(3, "nadi_node.mp4", 3.3, 8.9, 7.3, 2.0, audio=False, badge="2x speed"),
        seg(3, "nadi_node.mp4", 8.9, 13.8, 10.1, audio=True),
        # 4 live: storm button pressed 5.0 s into the scene
        seg(4, "live.mp4", play - 5.0, play + 16.0, 0.0, phone=True),
        # 5 alert: the 'Leave now' toast pops 0.6 s in
        seg(5, "live.mp4", play + STORM_LEAVE_NOW_S - 0.6, play + STORM_LEAVE_NOW_S + 6.4, 0.0, phone=True),
        # 6-7 map: home-area centre FULL, open centre, Drive, 8 s drive, arrival (one continuous take)
        seg(6, "map.mp4", mp["full_row"] - 0.9, mp["full_row"] + 15.1, 0.0, phone=True),
        seg(7, "map.mp4", mp["full_row"] + 15.1, mp["end"] + 0.3, 0.0, phone=True, hold_last=True),
        # 8 report: jump cuts around the waits
        seg(8, "report.mp4", rp["shutter"] - 0.7, rp["shutter"] + 1.3, 4.2, phone=True),
        seg(8, "report.mp4", rp["ai_check"] - 0.3, rp["ai_check"] + 1.2, 6.2, phone=True),
        seg(8, "report.mp4", rp["ai_result"] - 0.2, rp["ai_result"] + 1.8, 7.7, phone=True),
        seg(8, "report.mp4", rp["sent"] - 0.4, rp["sent"] + 3.6, 9.7, phone=True),
        seg(8, "report.mp4", rp["approved"] + 1.2, rp["approved"] + 5.5, 13.7, phone=True),
    ]
    takes = {"live.mp4": live_taps, "map.mp4": map_taps, "report.mp4": rep_taps}
    taps = []
    for s in segments:
        if s["from"] < 0:  # a take cannot start before its first frame: start the picture a moment later
            s["at"], s["from"] = round(s["at"] - s["from"] / s["rate"], 3), 0.0
        s["start"] = round(start[s["scene"]] + s["at"], 3)
        s["end"] = round(s["start"] + (s["to"] - s["from"]) / s["rate"], 3)
        for t in takes.get(s["file"], []):
            if s["from"] <= t["t"] < s["to"]:
                taps.append({"t": round(s["start"] + (t["t"] - s["from"]) / s["rate"], 3), "x": t["x"], "y": t["y"]})
    arr = next(s for s in segments if s["file"] == "map.mp4" and s["from"] <= mp["arrived"] < s["to"])
    events = {"arrived": round(arr["start"] + (mp["arrived"] - arr["from"]) / arr["rate"], 3)}
    out = {"segments": segments, "taps": taps, "events": events}
    (ROOT / "edit.json").write_text(json.dumps(out, indent=2), encoding="utf-8")

    # The Remotion project reads its own copies (public/ is git-ignored).
    data = ROOT / "remotion" / "src" / "data"
    data.mkdir(parents=True, exist_ok=True)
    for f in ("timeline.json", "edit.json", "script.json"):
        shutil.copy(ROOT / f, data / f)
    public = ROOT / "remotion" / "public"
    for f in ("live.mp4", "map.mp4", "report.mp4", "nadi_node.mp4"):
        copy(FOOTAGE / f, public / "footage" / f)
    repo = ROOT.parent
    for src, dst in ASSETS.items():
        copy(repo / src, public / dst)
    for rung in range(0, 111, 10):
        copy(repo / "frontend/public/media/live" / f"klang-r{rung:03d}.webp", public / "img" / f"klang-r{rung:03d}.webp")
    for f in ("Inter-Variable.ttf", "Outfit-Variable.ttf"):
        copy(FONTS / f, public / "fonts" / f)
    for s in segments:
        print(f"scene {s['scene']} {s['file']:14s} {s['from']:6.2f}-{s['to']:6.2f} x{s['rate']} -> {s['start']:6.2f}-{s['end']:6.2f}")
    print(len(taps), "taps")


if __name__ == "__main__":
    main()
