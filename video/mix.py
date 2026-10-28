"""Sound for the FloodWay demo: synthesised SFX + a quiet music bed, mixed with the narration.

Everything is made here in code (no downloaded audio) except two recordings we own: the narration
(video/audio/voice) and the real buzzer in Nadi's node clip. Music sits about 24 dB under the voice and
ducks a further 8 dB while anyone speaks; the final stereo mix is normalised to -14 LUFS, peaks at -1.5 dBFS.

  video/.venv/Scripts/python.exe video/mix.py    (after timeline.py and edit.py)
Output: video/audio/mix.wav (48 kHz stereo), copied to remotion/public/audio/mix.wav
"""
from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

ROOT = Path(__file__).resolve().parent
SR = 48_000
RNG = np.random.default_rng(7)


def load(path: Path) -> np.ndarray:
    """Any audio file -> mono float at SR (ffmpeg resamples)."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def db(x: float) -> float:
    return 10 ** (x / 20)


def env(n: int, attack: float, release: float) -> np.ndarray:
    a, r = max(1, int(attack * SR)), max(1, int(release * SR))
    e = np.ones(n)
    e[:a] = np.linspace(0, 1, min(a, n))
    e[-r:] *= np.linspace(1, 0, min(r, n))
    return e


def fft_filter(x: np.ndarray, lo: float = 0, hi: float = SR / 2) -> np.ndarray:
    """Band-limit a long buffer in the frequency domain (soft edges)."""
    spec = np.fft.rfft(x)
    fr = np.fft.rfftfreq(len(x), 1 / SR)
    gain = np.clip((fr - lo * 0.7) / (lo * 0.3 + 1e-9), 0, 1) if lo else np.ones_like(fr)
    gain *= np.clip((hi * 1.3 - fr) / (hi * 0.3), 0, 1)
    return np.fft.irfft(spec * gain, len(x))


def noise(sec: float) -> np.ndarray:
    return RNG.standard_normal(int(sec * SR))


# ---------- sound effects ----------
def rain(sec: float, heavy: bool = True) -> np.ndarray:
    base = fft_filter(noise(sec), 400, 9000 if heavy else 6000)
    drops = np.zeros_like(base)
    idx = RNG.integers(0, len(base) - 200, int(sec * (900 if heavy else 400)))
    for i in idx:
        drops[i:i + 120] += RNG.uniform(0.2, 1) * np.exp(-np.arange(120) / 18) * RNG.choice([-1, 1])
    out = base / np.abs(base).max() * 0.5 + fft_filter(drops, 1500, 12000) * 0.6
    return out / np.abs(out).max()


def river(sec: float) -> np.ndarray:
    x = fft_filter(noise(sec), 120, 2500)
    wob = 0.7 + 0.3 * np.sin(np.linspace(0, sec * 2 * np.pi * 0.3, len(x)))
    return x * wob / np.abs(x).max()


def thunder(sec: float = 3.5, near: bool = False) -> np.ndarray:
    n = int(sec * SR)
    x = fft_filter(noise(sec), 25, 400 if not near else 1400)
    t = np.arange(n) / SR
    shape = np.exp(-t / (1.2 if not near else 0.7)) * (1 - np.exp(-t / 0.03))
    rumble = 1 + 0.6 * np.sin(2 * np.pi * 3.1 * t) * np.sin(2 * np.pi * 0.7 * t)
    y = x * shape * rumble
    if near:
        y[: int(0.08 * SR)] += fft_filter(noise(0.08), 800, 8000) * np.linspace(1, 0, int(0.08 * SR)) * 3
    return y / np.abs(y).max()


def wiper() -> np.ndarray:
    sec = 0.55
    x = fft_filter(noise(sec), 300, 2500) * env(int(sec * SR), 0.15, 0.3) * 0.5
    thump = np.sin(2 * np.pi * 70 * np.arange(int(0.12 * SR)) / SR) * np.exp(-np.arange(int(0.12 * SR)) / (0.03 * SR))
    x[-len(thump):] += thump
    return x / np.abs(x).max()


def tone(freq: float, sec: float, harmonics: tuple[float, ...] = (1, 0.4, 0.15), decay: float = 0.4) -> np.ndarray:
    t = np.arange(int(sec * SR)) / SR
    y = sum(a * np.sin(2 * np.pi * freq * (k + 1) * t) for k, a in enumerate(harmonics))
    return y * np.exp(-t / decay) * (1 - np.exp(-t / 0.005))


def chime() -> np.ndarray:
    low = tone(1046.5, 2.2, (1, 0.5, 0.2, 0.1), 0.8)
    high = np.pad(tone(1568, 2.0, (1, 0.4), 0.8), (int(0.12 * SR), 0))
    high = np.pad(high, (0, max(0, len(low) - len(high))))[: len(low)]
    return low + 0.7 * high


def alert_tone() -> np.ndarray:
    a = tone(880, 0.35, (1, 0.3), 0.25)
    b = tone(660, 0.5, (1, 0.3), 0.35)
    return np.concatenate([a, b, np.zeros(int(0.1 * SR)), a, b])


def phone_buzz() -> np.ndarray:
    t = np.arange(int(0.9 * SR)) / SR
    gate = ((t % 0.3) < 0.2).astype(float)
    y = (np.sin(2 * np.pi * 165 * t) + 0.5 * np.sign(np.sin(2 * np.pi * 82 * t))) * gate
    return fft_filter(y, 60, 900)


def tap() -> np.ndarray:
    n = int(0.05 * SR)
    return fft_filter(noise(0.05), 2000, 9000) * np.exp(-np.arange(n) / (0.006 * SR))


def shutter() -> np.ndarray:
    a = tap() * 1.2
    b = np.pad(fft_filter(noise(0.09), 1500, 7000) * np.exp(-np.arange(int(0.09 * SR)) / (0.02 * SR)), (int(0.07 * SR), 0))
    out = np.zeros(max(len(a), len(b)))
    out[: len(a)] += a
    out[: len(b)] += b
    return out


def whoosh(sec: float = 0.7) -> np.ndarray:
    n = int(sec * SR)
    x = noise(sec)
    out = np.zeros(n)
    for i, (lo, hi) in enumerate([(300, 900), (700, 2000), (1500, 4500), (3000, 8000)]):
        band = fft_filter(x, lo, hi)
        w = np.exp(-((np.linspace(0, 1, n) - (0.25 + i * 0.15)) ** 2) / 0.02)
        out += band * w
    return out / np.abs(out).max()


def step_tone(i: int) -> np.ndarray:
    return tone(330 * 2 ** (i / 12 * 2), 0.6, (1, 0.5, 0.25), 0.3)


# ---------- music bed ----------
def music(total: float, tension: tuple[float, float], resolve: float) -> np.ndarray:
    """Soft pads in D minor, a pulse that builds during the storm, resolving to D major for the ending."""
    n = int(total * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    minor = [(146.83, 174.61, 220.0), (116.54, 146.83, 174.61), (87.31, 130.81, 174.61), (130.81, 164.81, 196.0)]  # Dm Bb F C
    major = [(146.83, 185.0, 220.0), (98.0, 146.83, 196.0), (110.0, 138.59, 164.81), (146.83, 185.0, 220.0)]  # D G A D
    bar = 4.0
    for b in range(int(total / bar) + 1):
        start = b * bar
        chord = (major if start >= resolve else minor)[b % 4]
        seg = slice(int(start * SR), min(n, int((start + bar + 1.5) * SR)))
        tt = t[seg] - start
        e = np.clip(tt / 1.2, 0, 1) * np.clip((bar + 1.5 - tt) / 1.5, 0, 1)
        for fq in chord:
            for det in (-0.6, 0.6):
                out[seg] += (np.sin(2 * np.pi * (fq + det) * tt) + 0.3 * np.sin(4 * np.pi * (fq + det) * tt)) * e * 0.12
        out[seg] += np.sin(2 * np.pi * chord[0] / 2 * tt) * e * 0.18  # sub
    # pulse: eighth notes, louder as the storm builds
    a, z = tension
    pulse = np.zeros(n)
    for k in range(int((z - a) / 0.25)):
        s = a + k * 0.25
        i = int(s * SR)
        hit = tone(73.4, 0.22, (1, 0.6), 0.08) * (0.25 + 0.75 * k / ((z - a) / 0.25))
        pulse[i:i + len(hit)] += hit[: n - i]
    out += pulse * 0.5
    return out / np.abs(out).max()


def main() -> None:
    tl = json.loads((ROOT / "timeline.json").read_text(encoding="utf-8"))
    ed = json.loads((ROOT / "edit.json").read_text(encoding="utf-8"))
    total = tl["duration"]
    n = int(total * SR) + SR
    sc = {s["scene"]: s for s in tl["scenes"]}
    mark = {m["name"]: m["at"] for m in tl["markers"]}
    voice = np.zeros(n)
    sfx = np.zeros(n)

    def put(buf: np.ndarray, at: float, clip: np.ndarray, gain_db: float, fade: float = 0.0) -> None:
        i = int(at * SR)
        c = clip[: max(0, n - i)] * db(gain_db)
        if fade:
            c = c * env(len(c), fade, fade)
        buf[i:i + len(c)] += c

    for c in tl["cues"]:
        put(voice, c["start"], load(ROOT / "audio" / "voice" / f"{c['id']}.wav"), 0)

    # beds
    put(sfx, sc[2]["start"], rain(sc[2]["end"] - sc[2]["start"]), -20, 0.8)
    put(sfx, sc[5]["start"], rain(sc[5]["end"] - sc[5]["start"]), -24, 0.4)
    put(sfx, sc[3]["start"], river(sc[3]["end"] - sc[3]["start"]), -24, 0.8)
    put(sfx, sc[8]["start"], rain(4.6, heavy=False), -24, 0.4)
    # sting and lightning
    put(sfx, 0.3, thunder(4.0), -18, 0.05)
    put(sfx, mark["lightning"] + 0.12, thunder(3.5, near=True), -12)
    put(sfx, sc[2]["start"] + 0.2, thunder(4.0), -24)
    # wipers in the car scenes (one sweep per 1.9 s)
    for s in (2, 5):
        t = sc[s]["start"] + 0.3
        while t < sc[s]["end"] - 0.5:
            put(sfx, t, wiper(), -28)
            t += 0.95
    # whooshes into the main scenes
    for s in (3, 4, 6, 8):
        put(sfx, sc[s]["start"] - 0.35, whoosh(), -24)
    # node: LED steps, then its real buzzer (recorded quietly by the phone, so lifted)
    for i, seg in enumerate(x for x in ed["segments"] if x["scene"] == 3):
        put(sfx, seg["start"], step_tone(i * 2), -26)
        if seg.get("audio"):
            clip = load(ROOT / "footage" / seg["file"])[int(seg["from"] * SR): int(seg["to"] * SR)]
            put(sfx, seg["start"], clip * 0.9 / max(1e-6, np.abs(clip).max()), -10, 0.05)
    # storm steps in the app (stormScenario.ts step times, 15 s storm)
    storm0 = sc[4]["start"] + 5.0
    for i, k in enumerate((0, 0.12, 0.25, 0.38, 0.53, 0.8, 0.9)):
        put(sfx, storm0 + k * 15, step_tone(i), -24)
    # alert in the car
    put(sfx, sc[5]["start"] + mark["phone_buzz"] - sc[5]["start"], phone_buzz(), -14)
    put(sfx, sc[5]["start"] + mark["phone_buzz"] - sc[5]["start"] + 0.1, alert_tone(), -18)
    # taps on the phone
    for t in ed["taps"]:
        put(sfx, t["t"], tap(), -20)
    # arrival chime when the dialog appears (end of the 8 s drive)
    put(sfx, ed["events"]["arrived"], chime(), -18)
    # report: shutter on the sample photo, pings for the AI answer and the person's check, whoosh for the area
    s8 = sc[8]["start"]
    put(sfx, s8 + 4.9, shutter(), -16)
    put(sfx, s8 + 7.9, tone(1318.5, 0.6, (1, 0.3), 0.2), -20)
    put(sfx, s8 + 13.1, tone(1568, 0.8, (1, 0.3), 0.3), -18)
    put(sfx, s8 + 15.4, whoosh(1.0), -22)

    # music, ducked under the voice
    bed = np.zeros(n)
    m = music(total + 1, (sc[4]["start"] + 5.0, sc[5]["end"]), sc[7]["start"])
    bed[: len(m)] = m[:n]
    duck = np.ones(n)
    for c in tl["cues"]:
        a, z = int((c["start"] - 0.15) * SR), int((c["end"] + 0.25) * SR)
        duck[max(0, a):z] = db(-8)
    k = int(0.15 * SR)
    duck = np.convolve(duck, np.ones(k) / k, mode="same")
    fade_out = np.clip((total - np.arange(n) / SR) / 2.5, 0, 1)
    bed *= duck * fade_out * db(-24 + 6)  # bed peaks normalised to 1; -18 dBFS peaks ~ -24 dB under the voice

    meter = pyln.Meter(SR)
    v_lufs = meter.integrated_loudness(voice[voice != 0]) if np.any(voice) else -16
    voice *= db(-16 - v_lufs)
    mix = voice + sfx + bed
    stereo_lufs = lambda x: meter.integrated_loudness(np.stack([x, x], axis=1))  # the file is stereo: L = R
    mix *= db(-14 - stereo_lufs(mix))
    peak = np.abs(mix).max()
    ceiling = db(-1.5)  # headroom for AAC overshoot
    if peak > ceiling:  # soft limit only the rare peaks
        mix = np.where(np.abs(mix) > ceiling * 0.8, np.sign(mix) * (ceiling * 0.8 + (ceiling * 0.2) * np.tanh((np.abs(mix) - ceiling * 0.8) / (ceiling * 0.2))), mix)
    mix = mix[: int(total * SR)]
    stereo = np.stack([mix, mix], axis=1)
    out = ROOT / "audio" / "mix.wav"
    sf.write(out, stereo, SR, subtype="PCM_24")
    dst = ROOT / "remotion" / "public" / "audio" / "mix.wav"
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy(out, dst)
    print(f"mix {len(mix) / SR:.1f}s, {stereo_lufs(mix):.1f} LUFS (stereo), peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS")


if __name__ == "__main__":
    main()
