"""Audio for the v2 demo: your narration, a ducked music bed, procedural SFX and the node's real buzzer.

  video/.venv/Scripts/python.exe video/v2/mix_v2.py      (after edit_v2.py)

Writes v2/out/v2mix.wav (48 kHz stereo, -14 LUFS) and copies it to remotion/public/audio/.
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

V2 = Path(__file__).resolve().parent
sys.path.insert(0, str(V2.parent))
from mix import SR, alert_tone, chime, db, env, load, music, rain, shutter, step_tone, tap, thunder, tone, whoosh  # noqa: E402

TOTAL = 113.5


def main() -> None:
    ed = json.loads((V2 / "edit.json").read_text(encoding="utf-8"))
    words = json.loads((V2 / "words.json").read_text(encoding="utf-8"))["words"]
    sc = {int(k): v for k, v in ed["scenes"].items()}
    n = int(TOTAL * SR)
    sfx = np.zeros(n)

    def put(at: float, clip: np.ndarray, gain_db: float, fade: float = 0.0) -> None:
        i = int(at * SR)
        c = clip[: max(0, n - i)] * db(gain_db)
        if fade:
            c = c * env(len(c), fade, fade)
        sfx[i:i + len(c)] += c

    voice = np.zeros(n)
    v = load(V2 / "voice" / "voice.wav")[:n]
    voice[: len(v)] = v

    # 1-2 Shah Alam: rain, a low hit on "26", a tick per place
    put(0.0, rain(sc[2][1], heavy=False), -28, 1.0)
    put(7.7, thunder(3.0), -20)
    for at in (12.64, 15.18, 17.56):
        put(at, tone(1318.5, 0.5, (1, 0.3), 0.2), -24)
    # 3 four signals into the ring
    put(sc[3][0] - 0.35, whoosh(), -24)
    for i in range(4):
        put(20.6 + i * 0.55, step_tone(i), -26)
    put(24.7, tone(587.3, 1.2, (1, 0.5, 0.2), 0.6), -22)
    # 4 node: LED steps on your words, then its real buzzer (recorded quietly by the phone, so lifted)
    put(sc[4][0] - 0.35, whoosh(), -24)
    for i, at in enumerate((28.5, 29.15, 29.9)):
        put(at, step_tone(i * 2), -26)
    for s in ed["nadi"]:
        if s.get("audio"):
            clip = load(V2.parent / "footage" / s["file"])[int(s["from"] * SR): int(s["to"] * SR)]
            put(s["start"], clip * 0.9 / max(1e-6, np.abs(clip).max()), -12, 0.05)
    live = ed["phone"]["4"][0]
    for i, k in enumerate((0, 0.12, 0.25, 0.38, 0.53, 0.8, 0.9)):  # stormScenario.ts steps, played at the cut's speed
        put(live["start"] + (k * 15 + 0.2) / live["rate"], step_tone(i), -26)
    # 5 the 90-minute steps, the danger crossing, the Leave now alert
    put(sc[5][0] - 0.35, whoosh(), -26)
    for i, at in enumerate((41.82, 44.52, 49.02, 52.58)):
        put(at, tone(880 * 2 ** (i / 12 * 2), 0.4, (1, 0.3), 0.2), -26)
    put(55.82, tone(440, 0.8, (1, 0.5), 0.3), -22)
    put(62.84, alert_tone(), -20)
    # 6 accuracy reveal
    put(sc[6][0] - 0.35, whoosh(), -26)
    put(81.66, tone(783.99, 1.4, (1, 0.5, 0.2), 0.6), -20)
    # 7 taps, arrival chime, photo shutter and the AI ping
    put(sc[7][0] - 0.35, whoosh(), -26)
    put(85.9, tap(), -20)
    put(89.56, chime(), -20)
    put(91.4, shutter(), -20)
    put(91.8, tone(1318.5, 0.6, (1, 0.3), 0.2), -22)
    # 8 one card per service
    put(sc[8][0] - 0.35, whoosh(), -26)
    for at in (97.96, 100.04, 103.12, 105.82):
        put(at, tone(659.25, 0.7, (1, 0.4), 0.3), -24)
    put(sc[9][0] - 0.2, whoosh(1.0), -24)

    # music: pulse through the prediction scene, resolving to major from the guide scene on; ducked under your voice
    bed = music(TOTAL + 1, (sc[5][0], sc[6][0]), sc[7][0])[:n]
    duck = np.ones(n)
    for w in words:
        duck[max(0, int((w["a"] - 0.15) * SR)): int((w["b"] + 0.3) * SR)] = db(-8)
    k = int(0.2 * SR)
    duck = np.convolve(duck, np.ones(k) / k, mode="same")
    bed *= duck * np.clip((TOTAL - np.arange(n) / SR) / 2.5, 0, 1) * db(-18)

    meter = pyln.Meter(SR)
    mix = voice + sfx + bed
    stereo_lufs = lambda x: meter.integrated_loudness(np.stack([x, x], axis=1))  # the file is stereo: L = R
    mix *= db(-14 - stereo_lufs(mix))
    ceiling = db(-1.5)
    if np.abs(mix).max() > ceiling:  # soft limit only the rare peaks
        mix = np.where(np.abs(mix) > ceiling * 0.8, np.sign(mix) * (ceiling * 0.8 + (ceiling * 0.2) * np.tanh((np.abs(mix) - ceiling * 0.8) / (ceiling * 0.2))), mix)
    out = V2 / "out" / "v2mix.wav"
    out.parent.mkdir(exist_ok=True)
    sf.write(out, np.stack([mix, mix], axis=1), SR, subtype="PCM_24")
    dst = V2.parent / "remotion" / "public" / "audio" / "v2mix.wav"
    shutil.copy(out, dst)
    print(f"mix {len(mix) / SR:.1f}s, {stereo_lufs(mix):.1f} LUFS (stereo), peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS")


if __name__ == "__main__":
    main()
