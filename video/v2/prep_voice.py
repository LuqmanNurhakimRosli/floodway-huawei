"""Clean the narration and time the caption words to it.

  video/.venv/Scripts/python.exe video/v2/prep_voice.py      (after: whisper voice/narration.m4a --word_timestamps True)

The only cut: the long silence before the closing line comes down to about 1 s. Captions show the script text
(script.json); each script word takes the time of the matching Whisper word, unmatched words are interpolated.
Writes voice/voice.wav (48 kHz mono, -16 LUFS) and words.json (final-video seconds).
"""
from __future__ import annotations

import difflib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
VOICE = ROOT / "voice"
LEAD = 0.5  # silence before the first word in the final video
GAP_KEEP = (0.4, 0.6)  # kept after the last word before the long silence, and before the first word after it
LONG_GAP = 4.0
# Whisper smeared these three short words; onsets read off the voice envelope (final-video seconds)
OVERRIDE = {"Green,": (28.5, 28.95), "yellow,": (29.15, 29.6), "red.": (29.9, 30.15)}


def norm(w: str) -> str:
    return re.sub(r"[^a-z0-9]", "", w.lower())


def main() -> None:
    raw = [w for s in json.loads((VOICE / "narration.json").read_text(encoding="utf-8"))["segments"] for w in s["words"]]
    a0 = raw[0]["start"] - LEAD
    gap = next(i for i in range(1, len(raw)) if raw[i]["start"] - raw[i - 1]["end"] > LONG_GAP)
    a1, b0 = raw[gap - 1]["end"] + GAP_KEEP[0], raw[gap]["start"] - GAP_KEEP[1]
    shift = lambda t: t - a0 if t < a1 else t - b0 + (a1 - a0)
    chain = (f"[0]atrim={a0:.3f}:{a1:.3f},asetpts=N/SR/TB[a];[0]atrim=start={b0:.3f},asetpts=N/SR/TB[b];"
             "[a][b]concat=n=2:v=0:a=1,highpass=f=80,afftdn=nf=-28,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=120,"
             "loudnorm=I=-16:TP=-2:LRA=9")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(VOICE / "narration.m4a"), "-filter_complex", chain,
                    "-ac", "1", "-ar", "48000", str(VOICE / "voice.wav")], check=True)

    heard = [(norm(w["word"]), shift(w["start"]), shift(w["end"])) for w in raw]
    script = json.loads((ROOT / "script.json").read_text(encoding="utf-8"))
    words = [{"w": w, "scene": s["scene"]} for s in script for w in s["text"].split()]
    sm = difflib.SequenceMatcher(None, [norm(w["w"]) for w in words], [h[0] for h in heard], autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            words[blk.a + k]["a"], words[blk.a + k]["b"] = heard[blk.b + k][1], heard[blk.b + k][2]
    # unmatched words: spread evenly between their matched neighbours
    known = [i for i, w in enumerate(words) if "a" in w]
    for i, w in enumerate(words):
        if "a" in w:
            continue
        lo = max((k for k in known if k < i), default=None)
        hi = min((k for k in known if k > i), default=None)
        t0 = words[lo]["b"] if lo is not None else 0.0
        t1 = words[hi]["a"] if hi is not None else t0 + 0.5
        n = (hi if hi is not None else i + 1) - (lo if lo is not None else -1)
        j = i - (lo if lo is not None else -1)
        t0 = max(t0, t1 - 0.3 * n)  # across a pause, the unmatched words sit just before the next heard word
        w["a"] = t0 + (t1 - t0) * (j - 1) / n
        w["b"] = t0 + (t1 - t0) * j / n
    for w in words:
        if w["w"] in OVERRIDE and w["scene"] == 4:
            w["a"], w["b"] = OVERRIDE[w["w"]]
    out = [{"w": w["w"], "scene": w["scene"], "a": round(w["a"], 3), "b": round(w["b"], 3)} for w in words]
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(VOICE / "voice.wav")],
                               capture_output=True, text=True).stdout)
    (ROOT / "words.json").write_text(json.dumps({"voice": round(dur, 3), "words": out}, indent=1), encoding="utf-8")
    print(f"voice {dur:.2f}s, {len(known)}/{len(words)} script words matched to the recording")
    for s in script:
        first = next(w for w in out if w["scene"] == s["scene"])
        print(f"  scene {s['scene']} first word {first['a']:6.2f}s")


if __name__ == "__main__":
    main()
