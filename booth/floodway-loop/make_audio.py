#!/usr/bin/env python3
"""FloodWay 60 s film: offline soundtrack (free, open source, local, no network).

Reads the silent master out/floodway-loop.mp4 (never writes it) and adds a NEW file:
  out/floodway-loop-voiced.mp4   narration + procedural score, about -16 LUFS integrated, <= -1.5 dBTP
Video is stream-copied, so frames are bit-identical to the silent master.

  .venv\\Scripts\\python.exe make_audio.py [--voice bm_george] [--lang en-gb]

Narration: Kokoro-82M (Apache-2.0) via kokoro-onnx (MIT), cached in audio-tts/. Each line's first syllable
lands on its beat from out/timeline.json (written by build.mjs from src/timeline.json, the same file the
visuals use). Score: NumPy synthesis; every cue time comes from the same timeline, not hand-copied.
"""
import argparse, hashlib, json, os, re, subprocess, sys
from pathlib import Path
import numpy as np

HERE = Path(__file__).resolve().parent
OUT, CACHE = HERE / "out", HERE / "audio-tts"
MODELS = HERE / "models" if (HERE / "models").exists() else HERE.parent.parent / "loop" / "models"
MASTER, VOICED = OUT / "floodway-loop.mp4", OUT / "floodway-loop-voiced.mp4"
CUES_OUT, REPORT = OUT / "floodway-audio-cues.json", OUT / "floodway-audio-report.json"
TIMELINE = json.loads((HERE / "src" / "timeline.json").read_text(encoding="utf-8"))
MODEL_SHA = {"kokoro-v1.0.onnx": "7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5",
             "voices-v1.0.bin": "bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d"}
FFMPEG, FFPROBE = os.environ.get("FFMPEG_PATH", "ffmpeg"), os.environ.get("FFPROBE_PATH", "ffprobe")

SR, DUR = 48000, float(TIMELINE["duration"])
N = int(SR * DUR)                                     # 2,880,000 samples = exactly 60.000 s
CU = TIMELINE["cues"]
AIM_VOICED, AIM_VOICE_ALONE, AIM_SCORE = -16.0, -17.0, -27.0     # integrated LUFS
TP_MAX, DUCK_DB = -1.5, -7.0
GAP, MAX_SPEED, KSR = 0.25, 1.25, 24000
BPM = 90.0
BEAT = 60.0 / BPM


def log(*a):
    print(*a, flush=True)


def sha256(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def ebur128(args, stdin=None):
    """Integrated loudness (LUFS) and true peak (dBTP) via ffmpeg's EBU R128 scanner."""
    r = subprocess.run([FFMPEG, "-hide_banner", "-nostats", *args, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       input=stdin, capture_output=True)
    err = r.stderr.decode("utf-8", "replace")
    i = re.findall(r"I:\s+(-?[\d.]+|-inf) LUFS", err)
    p = re.findall(r"Peak:\s+(-?[\d.]+|-inf) dBFS", err)
    if not i:
        raise RuntimeError("ebur128 failed: " + err[-400:])
    f = lambda s: -120.0 if s == "-inf" else float(s)
    return f(i[-1]), (f(p[-1]) if p else 0.0)


def loud(x):
    """x: (N, 2) float -> (LUFS, dBTP)."""
    raw = np.ascontiguousarray(x, dtype=np.float32).tobytes()
    return ebur128(["-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "pipe:0"], raw)


def db(x):
    return 10.0 ** (x / 20.0)


def speech_span(x, sr):
    """(onset s, end s) of speech: 10 ms RMS frames within 35 dB of the loudest frame."""
    f = int(sr * 0.01)
    n = len(x) // f
    r = np.sqrt(np.mean(x[: n * f].reshape(n, f) ** 2, axis=1) + 1e-12)
    idx = np.where(20 * np.log10(r / r.max()) > -35)[0]
    return (idx[0] * 0.01, (idx[-1] + 1) * 0.01) if len(idx) else (0.0, 0.0)


def upsample2(x):
    """24 kHz -> 48 kHz with a band-limited zero-padded FFT (padded first so nothing wraps)."""
    pad = 2400
    y = np.concatenate([np.zeros(pad), x, np.zeros(pad)])
    X = np.fft.rfft(y)
    Z = np.zeros(len(y) + 1, dtype=complex)
    Z[: len(X)] = X
    out = np.fft.irfft(Z, n=len(y) * 2) * 2.0
    return out[pad * 2: pad * 2 + len(x) * 2]


# ------------------------------------------------------------------ narration (Kokoro, cached, auto-fit)
def load_kokoro():
    for name, want in MODEL_SHA.items():
        p = MODELS / name
        if not p.exists():
            sys.exit("Missing model " + str(p) + " (see README: Audio).")
        if sha256(p) != want:
            sys.exit("Model checksum mismatch: " + name)
    from kokoro_onnx import Kokoro
    return Kokoro(str(MODELS / "kokoro-v1.0.onnx"), str(MODELS / "voices-v1.0.bin"))


def take(kok, text, voice, lang, speed, manifest):
    key = hashlib.sha256("|".join([voice, lang, "%.3f" % speed, MODEL_SHA["kokoro-v1.0.onnx"], text]).encode()).hexdigest()[:20]
    f = CACHE / (key + ".npy")
    if f.exists():
        return np.load(f)
    s, sr = kok.create(text, voice=voice, speed=speed, lang=lang)
    assert sr == KSR, sr
    a = np.asarray(s, dtype=np.float32)
    np.save(f, a)
    manifest["takes"][key] = {"text": text, "voice": voice, "lang": lang, "speed": round(speed, 3)}
    return a


def narration(voice, lang):
    """Returns the 48 kHz mono voice bus and the placed speech spans [(id, start, end, speed)]."""
    CACHE.mkdir(exist_ok=True)
    mf = CACHE / "manifest.json"
    manifest = json.loads(mf.read_text(encoding="utf-8")) if mf.exists() else {"takes": {}}
    kok = load_kokoro()
    lines = TIMELINE["narration"]
    bus, spans = np.zeros(N), []
    for i, ln in enumerate(lines):
        limit = lines[i + 1]["at"] - GAP if i + 1 < len(lines) else TIMELINE["lastSpeechEnd"]
        room = limit - ln["at"]
        speed = 1.0
        a = take(kok, ln["text"], voice, lang, speed, manifest)
        on, off = speech_span(a, KSR)
        if off - on > room:
            speed = min(MAX_SPEED, (off - on) / room * 1.03)
            a = take(kok, ln["text"], voice, lang, speed, manifest)
            on, off = speech_span(a, KSR)
            if off - on > room:
                sys.exit("Line %s does not fit its slot (%.2f s > %.2f s) even at %.2fx; shorten the text." % (ln["id"], off - on, room, speed))
        pre = 0.04                                                   # keep the consonant attack
        seg = a[max(0, int((on - pre) * KSR)): int((off + 0.12) * KSR)].astype(np.float64)
        fade = int(0.01 * KSR)
        seg[:fade] *= np.linspace(0, 1, fade)
        seg[-fade:] *= np.linspace(1, 0, fade)
        y = upsample2(seg)
        s0 = int((ln["at"] - pre) * SR)
        e0 = min(N, s0 + len(y))
        bus[s0:e0] += y[: e0 - s0]
        spans.append((ln["id"], ln["at"], ln["at"] + (off - on), speed))
        log("  %-3s %6.2f -> %6.2f s  (room %.2f, speed %.2f)  %s" % (ln["id"], ln["at"], ln["at"] + off - on, room, speed, ln["text"]))
    mf.write_text(json.dumps(manifest, indent=1), encoding="utf-8")
    return bus, spans


# ------------------------------------------------------------------ score: synthesis kit
RNG = np.random.default_rng(6060)
T = np.arange(N) / SR


def mtof(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


NOTE = {n: i for i, n in enumerate(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}


def nf(name):                                        # "F#5" -> Hz
    m = re.match(r"([A-G]#?)(-?\d)", name)
    return mtof(NOTE[m.group(1)] + 12 * (int(m.group(2)) + 1))


class Bus:
    def __init__(self):
        self.x = np.zeros((N, 2))

    def add(self, t0, sig, gain_db=0.0, pan=0.0):
        """Place a mono (n,) or stereo (n,2) signal at t0 seconds, equal-power pan in [-1, 1]."""
        s0 = int(round(t0 * SR))
        if s0 >= N:
            return
        sig = np.asarray(sig, dtype=np.float64)
        if s0 < 0:
            sig, s0 = sig[-s0:], 0
        n = min(len(sig), N - s0)
        g = db(gain_db)
        if sig.ndim == 1:
            a = (pan + 1) * np.pi / 4
            self.x[s0:s0 + n, 0] += sig[:n] * g * np.cos(a)
            self.x[s0:s0 + n, 1] += sig[:n] * g * np.sin(a)
        else:
            self.x[s0:s0 + n] += sig[:n] * g


def fft_filter(x, lo, hi, tilt=0.0):
    """Zero-phase band filter with soft skirts; tilt in dB/octave around 1 kHz (negative = darker)."""
    n = len(x)
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    m = np.ones_like(f)
    if lo:
        m *= 1 / (1 + (lo / np.maximum(f, 1e-3)) ** 4)
    if hi:
        m *= 1 / (1 + (f / hi) ** 4)
    if tilt:
        m *= (np.maximum(f, 20) / 1000.0) ** (tilt / 6.02)
    return np.fft.irfft(X * m, n=n)


def noise(n, lo, hi, tilt=0.0):
    y = fft_filter(RNG.standard_normal(n), lo, hi, tilt)
    return y / (np.sqrt(np.mean(y ** 2)) + 1e-12)


def keys_db(keys):
    """Piecewise-linear dB envelope over the whole film from [(t, dB)] keys -> linear gain per sample."""
    ts, vs = zip(*keys)
    return db(np.interp(T, ts, vs))


def tone(freq, dur, partials=((1, 1.0, 3.0),), attack=0.004):
    """Sum of partials (ratio, amp, decay per s); returns mono."""
    t = np.arange(int(dur * SR)) / SR
    y = np.zeros_like(t)
    for r, a, d in partials:
        y += a * np.sin(2 * np.pi * freq * r * t) * np.exp(-d * t)
    y *= np.minimum(1, t / attack)
    y[-64:] *= np.linspace(1, 0, 64)
    return y


def pluck(f, dur=1.2):
    return tone(f, dur, ((1, 1.0, 4.0), (2, 0.45, 7.0), (3, 0.2, 11.0), (4, 0.08, 16.0)))


def bell(f, dur=2.5):
    return tone(f, dur, ((1, 1.0, 1.6), (2.0, 0.35, 2.6), (2.76, 0.3, 3.5), (5.4, 0.12, 6.0)), attack=0.002)


def blip(f, dur=0.12):
    return tone(f, dur, ((1, 1.0, 30.0), (2, 0.2, 45.0)), attack=0.002)


def click(dur=0.03):
    n = int(dur * SR)
    return noise(n, 1500, 9000) * np.exp(-np.arange(n) / SR * 160) * 0.5


def kick(dur=0.45):
    t = np.arange(int(dur * SR)) / SR
    ph = 2 * np.pi * np.cumsum(46 + 70 * np.exp(-t * 28)) / SR
    return np.sin(ph) * np.exp(-t * 7.5) * np.minimum(1, t / 0.002)


def hat(dur=0.06):
    n = int(dur * SR)
    return noise(n, 6500, 15000) * np.exp(-np.arange(n) / SR * 70)


def whoosh(dur=0.9, rise=True):
    """Filtered noise swell; brightness follows loudness; stereo drift."""
    n = int(dur * SR)
    u = np.linspace(0, 1, n)
    e = np.sin(np.pi * (u ** (0.7 if rise else 1.4))) ** 2
    lo, hi = noise(n, 200, 1500), noise(n, 1500, 7000)
    m = lo * e + hi * e ** 2 * 0.6
    pan = np.linspace(-0.5, 0.5, n) if rise else np.linspace(0.5, -0.5, n)
    a = (pan + 1) * np.pi / 4
    return np.stack([m * np.cos(a), m * np.sin(a)], axis=1)


def sub_drop(dur=1.2):
    t = np.arange(int(dur * SR)) / SR
    return np.sin(2 * np.pi * np.cumsum(70 * np.exp(-t * 2.2) + 32) / SR) * np.exp(-t * 2.6) * np.minimum(1, t / 0.01)


def pad_note(f, t0, t1, fade=0.7):
    """Warm detuned additive pad voice from t0 to t1 with raised-cosine fades; stereo."""
    n = int((t1 - t0 + fade) * SR)
    t = np.arange(n) / SR
    y = np.zeros((n, 2))
    for k in range(1, 7):
        amp = 1.0 / k ** 1.7
        for ch, det in ((0, 0.9985), (1, 1.0015)):
            y[:, ch] += amp * np.sin(2 * np.pi * f * k * det * t + k * 1.3 + ch)
    env = np.ones(n)
    fi = int(fade * SR)
    env[:fi] = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, fi))
    env[-fi:] = 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, fi))
    return y * env[:, None], t0 - fade / 2


# ------------------------------------------------------------------ score: composition (times from the timeline)
CHORDS = {  # pad voicing, bass root
    "Bm": (["D4", "F#4", "B4", "C#5"], "B1"), "G": (["D4", "G4", "B4", "F#5"], "G1"),
    "D": (["D4", "F#4", "A4", "E5"], "D2"), "A": (["C#4", "E4", "A4", "E5"], "A1"),
    "Em": (["E4", "G4", "B4", "D5"], "E2"),
}
PROG = [(13.0, 16.0, "Bm"), (16.0, 19.0, "G"),
        (19, 21, "D"), (21, 23, "A"), (23, 25, "Bm"), (25, 27, "G"),
        (27, 29, "D"), (29, 31, "A"), (31, 33, "Bm"), (33, 35, "G"),
        (35, 36.75, "G"), (36.75, 38.5, "D"), (38.5, 40.25, "Em"), (40.25, 42, "A"),
        (42, 43.75, "Bm"), (43.75, 45.5, "G"), (45.5, 47.25, "D"), (47.25, 49, "A"),
        (49, 50.5, "G"), (50.5, 52, "A"), (52, 53.5, "Bm"), (53.5, 55, "D"),
        (55, 56.5, "G"), (56.5, 58, "A"), (58, 60.4, "D")]


def ease_io(x):
    x = np.clip(x, 0, 1)
    return np.where(x < 0.5, 4 * x ** 3, 1 - (-2 * x + 2) ** 3 / 2)


def water_crossings(step=0.01):
    """Times at which the twin gauge passes each 0.01 m (same inOutCubic curve as index.html)."""
    t = np.linspace(CU["waterStart"], CU["waterEnd"], 4000)
    lv = CU["waterMax"] * ease_io((t - CU["waterStart"]) / (CU["waterEnd"] - CU["waterStart"]))
    out = []
    for k in range(1, int(round(CU["waterMax"] / step)) + 1):
        i = int(np.argmax(lv >= k * step - 1e-9))
        out.append((k * step, float(t[i])))
    return out


def beats(t0, t1, div=1):
    k = np.arange(int(np.ceil((t0 - 13.0) / (BEAT / div) - 1e-9)), int(np.floor((t1 - 13.0) / (BEAT / div) - 1e-9)) + 1)
    return [13.0 + i * BEAT / div for i in k if t0 - 1e-9 <= 13.0 + i * BEAT / div < t1]


def chord_at(t):
    for a, b, c in PROG:
        if a <= t < b:
            return c
    return "D"


def score():
    beds, cues, cue_log = Bus(), Bus(), []

    def cue(name, t0, sig, g, pan=0.0):
        cues.add(t0, sig, g, pan)
        cue_log.append({"t": round(t0, 3), "cue": name})

    # rain ambience across the film (restrained; loudest in the real-world scenes)
    rain_env = keys_db([(0, -70), (0.5, -24), (12.6, -24), (13.6, -36), (19, -42), (34.8, -42), (35.6, -31), (41.6, -31),
                        (42.4, -44), (49, -44), (49.6, -35), (54.8, -35), (55.4, -44), (59.5, -44), (60, -80)])
    for ch in (0, 1):
        beds.x[:, ch] += noise(N, 250, 9000, tilt=-3.0) * rain_env
    drops = RNG.uniform(0, DUR, 900)
    for d in drops:
        if rain_env[int(d * SR)] > db(-38):
            beds.add(d, click(0.012) * 0.6, -26 + 20 * np.log10(rain_env[int(d * SR)] / db(-24) + 1e-9), RNG.uniform(-0.8, 0.8))
    # low drone for the opening (calm -> concerned)
    drone = (np.sin(2 * np.pi * nf("D2") * T) + 0.6 * np.sin(2 * np.pi * nf("A2") * T)) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.1 * T))
    denv = keys_db([(0, -80), (2.5, -40), (7, -36), (12.4, -37), (13.6, -80), (60, -80)])
    beds.x += (drone * denv)[:, None]
    # pads + bass
    pad = Bus()
    for a, b, c in PROG:
        notes, root = CHORDS[c]
        for nm in notes:
            y, s = pad_note(nf(nm), a, b)
            pad.add(s, y, -6)
        if 19 <= a < 58.8:
            y, s = pad_note(nf(root), a, min(b, 58.8))
            pad.add(s, y[:, :1].repeat(2, axis=1) * np.array([1.0, 1.0]), -1)
    penv = keys_db([(0, -80), (12.9, -80), (14.4, -30), (19, -28), (35, -27), (42, -30), (49, -26), (55, -28), (59.4, -30), (60, -80)])
    padx = np.stack([fft_filter(pad.x[:, 0], 60, 2600), fft_filter(pad.x[:, 1], 60, 2600)], axis=1)
    beds.x += padx * penv[:, None]
    # rhythm
    for b in beats(19, 35):
        cue("kick", b, kick(), -15)
        cue("hat", b + BEAT / 2, hat(), -31, 0.3)
    for b in beats(35, 42, 2):
        cue("shaker", b, hat(0.04), -36, -0.2)
    for b in beats(42, 49):
        cue("kick", b, kick(), -13)
    for i, b in enumerate(beats(42, 49, 4)):
        cue("hat", b, hat(0.04), -33 + (4 if i % 2 else 0), 0.25)
    for b in beats(55, 58.2):
        cue("kick", b, kick(), -16)
    for rng_, div, g in (((27, 35), 2, -29), ((42, 49), 2, -25), ((49, 55), 1, -29)):
        for i, b in enumerate(beats(rng_[0], rng_[1], div)):
            notes, _ = CHORDS[chord_at(b)]
            cue("arp", b, pluck(nf(notes[i % 4]) * 2, 0.9), g, (-0.4, 0.4)[i % 2])
    # transitions
    for s in TIMELINE["shots"][1:8]:
        cue("cut", s - 0.35, whoosh(0.7), -32)
    cue("lift", 12.3, whoosh(1.1), -22); cue("drop", 13.0, sub_drop(), -18)
    for t0, g in ((13.0, -24), (18.85, -24), (CU["mapIn"], -26), (34.3, -26), (41.6, -26), (CU["finalPhone"], -24)):
        cue("whoosh", t0, whoosh(0.9), g)
    cue("drop", 42.0, sub_drop(), -20)
    # S3 reveal
    cue("alert", CU["phoneRise"] + 1.0, bell(nf("A5")), -22); cue("alert", CU["phoneRise"] + 1.12, bell(nf("E6")), -24)
    for i, n in enumerate(["D6", "F#6", "A6"]):
        cue("logo", CU["logo"] + i * 0.08, bell(nf(n), 2.0), -27, -0.3 + i * 0.3)
    for i, n in enumerate(["D5", "E5", "F#5", "A5", "B5", "D6", "E6", "F#6"]):
        cue("letter", CU["wordmark"] + i * 0.045, pluck(nf(n), 0.7), -29, -0.5 + i / 7)
    cue("tagline", CU["tagline"], pluck(nf("A5"), 1.2), -30)
    cue("tap", CU["tapAlert"], click(), -20)
    # S4 water: one soft blip per 0.01 m, rising in pitch; amber two-note at the caution line
    for lv, tt in water_crossings():
        cue("water", tt, blip(lerp_f(nf("C5"), nf("C6"), lv / CU["waterMax"])), -33, 0.2)
        if abs(lv - CU["caution"]) < 1e-6:
            cue("caution", tt, pluck(nf("E5")), -24); cue("caution", tt + 0.14, pluck(nf("C5")), -25)
    for i, n in enumerate(["D5", "A5", "D6"]):
        cue("button", CU["button"] + i * 0.07, pluck(nf(n)), -22)
    cue("pulse", CU["button"] + 0.6, bell(nf("A5"), 1.4), -32)
    cue("tap", CU["tapButton"], click(), -20); cue("confirm", CU["tapButton"] + 0.05, bell(nf("D6"), 1.6), -24)
    # S5 route
    cue("direct", CU["directLine"], blip(nf("E5")), -28)
    cue("blocked", CU["blocked"], pluck(nf("A3"), 0.5), -22); cue("blocked", CU["blocked"] + 0.16, pluck(nf("G#3"), 0.6), -22)
    d = CU["routeEnd"] - CU["routeStart"]
    t = np.arange(int(d * SR)) / SR
    glide = np.sin(2 * np.pi * np.cumsum(330 * 2 ** (ease_io(t / d))) / SR) * np.sin(np.pi * t / d) * (0.8 + 0.2 * np.sin(2 * np.pi * 9 * t))
    cue("route", CU["routeStart"], glide, -31)
    cue("arrive", CU["routeEnd"], bell(nf("A5")), -22); cue("eta", CU["eta"], pluck(nf("D6")), -26)
    # S6 Family Ping (warm)
    cue("sos", CU["sosTap"], kick(0.5), -16)
    for i in range(3):
        cue("ripple", CU["sosTap"] + i * 0.25, bell(nf("E5"), 1.2), -28 - 3 * i)
    for tt in CU["contacts"]:
        cue("row", tt, click(), -30)
    for tt in CU["delivered"]:
        cue("delivered", tt, blip(nf("A5")), -32)
    for tt, n in zip(CU["seen"], ["G5", "B5", "D6"]):
        cue("seen", tt, bell(nf(n)), -22)
    for i, n in enumerate(["G4", "B4", "D5", "G5"]):
        cue("family", CU["familyOk"] + i * 0.04, bell(nf(n), 3.0), -25)
    # S7 pipeline
    for tt, n in zip(CU["nodes"], ["A5", "C#6", "E6"]):
        cue("node", tt, bell(nf(n)), -22)
    for tt in CU["pulses"]:
        cue("pulse", tt, blip(nf("A6")), -30)
    cue("community", CU["community"], pluck(nf("F#5")), -26)
    for i, n in enumerate(["D6", "E6", "F#6"]):
        cue("output", CU["outputs"] + i * 0.15, blip(nf(n)), -28, 0.4)
    # S8 journeys
    for tt, n in zip(CU["cards"], ["B4", "D5", "F#5", "A5"]):
        cue("card", tt, pluck(nf(n)), -28)
    for i, (tt, n) in enumerate(zip(CU["flips"], ["D5", "F#5", "A5", "D6"])):
        cue("flip", tt, bell(nf(n)), -22, -0.6 + i * 0.4)
    # S9 resolve
    for i, n in enumerate(["D5", "E5", "F#5", "A5", "B5", "D6", "E6", "F#6"]):
        cue("letter", CU["finalWord"] + i * 0.04, pluck(nf(n), 0.7), -30, -0.5 + i / 7)
    for i, n in enumerate(["D3", "D5", "F#5", "A5", "D6"]):
        cue("end", CU["endCard"] + i * 0.05, bell(nf(n), 3.2), -20 if i == 0 else -22)
    # a touch of room on cues + pads
    ir_n = int(2.0 * SR)
    ir = RNG.standard_normal((ir_n, 2)) * np.exp(-np.arange(ir_n) / SR * 3.2)[:, None]
    ir[: int(0.012 * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2, axis=0))
    wet_in = cues.x + padx * penv[:, None] * 0.5
    L = 1 << int(np.ceil(np.log2(N + ir_n)))
    wet = np.stack([np.fft.irfft(np.fft.rfft(wet_in[:, ch], L) * np.fft.rfft(ir[:, ch], L), L)[:N] for ch in (0, 1)], axis=1)
    mix = beds.x + cues.x + wet * db(-14)
    return mix, cue_log


def lerp_f(a, b, p):
    return a + (b - a) * p


# ------------------------------------------------------------------ mix, encode, verify
def duck_env(spans):
    """Score gain: DUCK_DB under speech, 0.12 s in / 0.35 s out, built from the known speech spans."""
    g = np.zeros(N)
    for _, a, b, _ in spans:
        g[max(0, int((a - 0.12) * SR)): min(N, int((b + 0.35) * SR))] = 1.0
    k = int(0.15 * SR)
    g = np.convolve(g, np.hanning(k) / np.hanning(k).sum(), mode="same")
    return db(DUCK_DB * np.clip(g, 0, 1))


def edge_fades(x):
    fi, fo = int(0.5 * SR), int((DUR - CU["fadeOut"]) * SR)
    x[:fi] *= np.linspace(0, 1, fi)[:, None]
    x[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2
    return x


def encode(mix, ceiling_db):
    part = VOICED.with_suffix(".part.mp4")
    lim = db(ceiling_db)
    cmd = [FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(MASTER),
           "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "pipe:0",
           "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy",
           "-af", "alimiter=limit=%.5f:attack=4:release=60:level=0:latency=1" % lim,
           "-c:a", "aac", "-b:a", "192k", "-ar", str(SR), "-movflags", "+faststart", str(part)]
    r = subprocess.run(cmd, input=np.ascontiguousarray(mix, dtype=np.float32).tobytes(), capture_output=True)
    if r.returncode:
        sys.exit("ffmpeg encode failed: " + r.stderr.decode("utf-8", "replace")[-600:])
    return part


def probe(p):
    r = subprocess.run([FFPROBE, "-v", "error", "-count_frames", "-show_entries",
                        "stream=codec_type,codec_name,nb_read_frames,duration,sample_rate,channels:format=duration", "-of", "json", str(p)],
                       capture_output=True, text=True)
    return json.loads(r.stdout)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="bm_george")
    ap.add_argument("--lang", default="en-gb")
    a = ap.parse_args()
    if not MASTER.exists():
        sys.exit("Render the silent master first: node render.mjs")
    master_hash = sha256(MASTER)
    log("narration (" + a.voice + ", " + a.lang + ")")
    voice, spans = narration(a.voice, a.lang)
    log("score")
    sc, cue_log = score()
    v2 = np.stack([voice, voice], axis=1)
    vl, _ = loud(v2)
    sl, _ = loud(sc)
    v2 *= db(AIM_VOICE_ALONE - vl)
    sc *= db(AIM_SCORE - sl)
    mix = edge_fades(v2 + sc * duck_env(spans)[:, None])
    ml, _ = loud(mix)
    mix *= db(AIM_VOICED - ml)
    ceiling = -2.0
    for it in range(4):
        part = encode(mix, ceiling)
        I, TP = ebur128(["-i", str(part), "-map", "0:a"])
        log("  pass %d: %.2f LUFS, %.2f dBTP (ceiling %.1f dB)" % (it + 1, I, TP, ceiling))
        if TP > TP_MAX:
            ceiling -= (TP - TP_MAX) + 0.2
            continue
        if abs(I - AIM_VOICED) > 0.3:
            mix *= db(AIM_VOICED - I)
            continue
        break
    if sha256(MASTER) != master_hash:
        sys.exit("Silent master changed; aborting.")
    os.replace(part, VOICED)
    info = probe(VOICED)
    vs = [s for s in info["streams"] if s["codec_type"] == "video"][0]
    au = [s for s in info["streams"] if s["codec_type"] == "audio"][0]
    rep = {"voice": a.voice, "lang": a.lang, "integrated_lufs": I, "true_peak_dbtp": TP,
           "video_frames": int(vs["nb_read_frames"]), "audio_duration_s": float(au["duration"]),
           "master_sha256": master_hash, "voiced_sha256": sha256(VOICED),
           "speech": [{"id": i, "start": round(s, 2), "end": round(e, 2), "speed": round(sp, 3)} for i, s, e, sp in spans]}
    REPORT.write_text(json.dumps(rep, indent=2), encoding="utf-8")
    CUES_OUT.write_text(json.dumps(cue_log, indent=1), encoding="utf-8")
    log("wrote %s  (%.2f LUFS, %.2f dBTP, %d video frames, audio %.3f s)" % (VOICED.relative_to(HERE), I, TP, rep["video_frames"], rep["audio_duration_s"]))


if __name__ == "__main__":
    main()
