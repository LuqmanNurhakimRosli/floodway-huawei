"""Build video/timeline.json: when each scene and each narration line plays.

Scene lengths are set here (the app's own timing - 15 s storm, 8 s drive - sets the longer ones);
line lengths are measured from video/audio/voice/*.wav. Fails loudly if a line overruns its scene
or the next line in the same scene.

  video/.venv/Scripts/python.exe video/timeline.py
"""
from __future__ import annotations

import json
from pathlib import Path

import soundfile as sf

ROOT = Path(__file__).resolve().parent
FPS = 30

# scene number -> (name, length in s, {line id: offset from scene start in s}, {marker: offset})
# App footage and its taps are placed by edit.py; markers here are for drawn effects only.
SCENES: dict[int, tuple[str, float, dict[str, float], dict[str, float]]] = {
    1: ("sting", 7.0, {}, {}),
    2: ("car", 11.0, {"s01": 2.0, "s02": 5.0}, {"lightning": 3.4}),
    3: ("river", 15.0, {"s03": 0.5, "s04a": 5.4, "s04b": 7.6, "s04c": 10.2}, {}),
    4: ("live", 21.0, {"s05": 0.4, "s06": 16.0}, {}),
    5: ("alert", 7.0, {"s07": 1.2, "s08": 2.4}, {"phone_buzz": 0.6}),
    6: ("map", 16.0, {"s09": 0.5, "s10": 3.0, "s11": 9.8}, {}),
    7: ("arrival", 8.0, {"s12": 0.8}, {}),
    8: ("reports", 18.0, {"s13": 0.5, "s14": 6.8, "s15": 14.2}, {}),
    9: ("end", 8.5, {"s16": 2.0}, {}),
}


def srt(cues: list[dict]) -> str:
    """Subtitles: each line from its start until it ends (+0.4 s), never past the next line."""
    stamp = lambda s: f"{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{int(s % 60):02d},{int(round(s % 1 * 1000)) % 1000:03d}"
    rows = []
    for i, c in enumerate(cues):
        end = min(c["end"] + 0.4, cues[i + 1]["start"] - 0.05) if i + 1 < len(cues) else c["end"] + 0.4
        rows.append(f"{i + 1}\n{stamp(c['start'])} --> {stamp(end)}\n{c['text']}\n")
    return "\n".join(rows)


def main() -> None:
    script = {x["id"]: x for x in json.loads((ROOT / "script.json").read_text(encoding="utf-8"))}
    voice = ROOT / "audio" / "voice"
    scenes, cues, markers, t = [], [], [], 0.0
    for num, (name, length, lines, marks) in SCENES.items():
        scenes.append({"scene": num, "name": name, "start": round(t, 3), "end": round(t + length, 3),
                       "from": round(t * FPS), "frames": round(length * FPS)})
        prev_end = 0.0
        for lid, off in lines.items():
            dur = sf.info(voice / f"{lid}.wav").duration
            if off < prev_end:
                raise SystemExit(f"{lid} starts at {off}s but the previous line ends at {prev_end:.2f}s")
            if off + dur > length:
                raise SystemExit(f"{lid} ends at {off + dur:.2f}s, past scene {num} ({length}s)")
            prev_end = off + dur + script[lid]["pause_after_ms"] / 1000
            cues.append({"id": lid, "scene": num, "text": script[lid]["text"], "start": round(t + off, 3),
                         "end": round(t + off + dur, 3), "from": round((t + off) * FPS), "frames": round(dur * FPS)})
        markers += [{"name": k, "scene": num, "at": round(t + v, 3), "frame": round((t + v) * FPS)} for k, v in marks.items()]
        t += length
    out = {"fps": FPS, "width": 1920, "height": 1080, "duration": round(t, 3), "frames": round(t * FPS),
           "scenes": scenes, "cues": cues, "markers": markers}
    (ROOT / "timeline.json").write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")
    (ROOT / "out").mkdir(exist_ok=True)
    (ROOT / "out" / "floodway_demo.srt").write_text(srt(cues), encoding="utf-8")
    speech = sum(c["end"] - c["start"] for c in cues)
    print(f"total {t:.1f}s ({int(t // 60)}:{t % 60:04.1f}), {len(cues)} lines, speech {speech:.1f}s")
    for s in scenes:
        print(f"  {s['scene']} {s['name']:8s} {s['start']:6.1f} - {s['end']:6.1f}")


if __name__ == "__main__":
    main()
