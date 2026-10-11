# MATA48 booth loop: code-based motion design playbook

This is how the 30-second MATA48 booth loop was built, entirely from code: brief, tools, architecture, motion system, rendering, audio, verification, what went wrong, and how to repeat it. It is written so the next build (or the next agent) can start from facts instead of re-deriving them.

Project: MATA48, Maritime AI Threat Awareness. SEDIC 2026 Track II (Project Guardian), Grand Finale, MITEC Kuala Lumpur, 7 Oct 2026. Output plays silently on a 50-inch TV at the booth, from an offline laptop over HDMI.

---

## 1. The brief, reduced to hard requirements

| Area | Requirement |
|---|---|
| Deliverables | `booth/loop/index.html` (self-contained), `render.mjs` (MP4 export), `README.md` |
| Scope fence | Create files only in `booth/loop/`. No git commands. Don't touch the React/FastAPI app. |
| Runtime | Double-click `index.html` over `file://`: no network, no CDN, no web fonts, no npm at runtime |
| Architecture | `window.renderFrame(t)`, pure function of `t` in [0, 30). No accumulated state, no `Math.random`, no clock in drawing code |
| Canvas | 1920×1080 virtual space, letterboxed; animate transforms, opacity, stroke-dashoffset only |
| Performance | 60 fps on an integrated-GPU laptop; no blur, shadow or filter effects |
| Controls | F fullscreen, Space pause, ←/→ scrub 1 s, `?t=12.5`, `?debug`, cursor hides after 2 s, wake lock |
| Loop | frame(29.99) flows into frame(0); any drift travels a whole number of grid cells in 30 s |
| Palette | forest green `#335543`, cream `#EDE8D8`, hairlines cream 18%, attention `#C1543C`, standard `#5B7FA6`, routine cream 60% |
| Style | flat fills, 1 px hairlines, blueprint grid (32 px), compass rose, coastline linework, corner-bracket viewfinders |
| Type | titles ≥ 140 px, stat numbers ≥ 180 px, labels ≥ 36 px, nothing < 32 px, 5% safe margins |
| Vessels | generic hull silhouettes drawn in SVG; no real ships, flags or emblems |
| Content | only approved numbers: 96.5%, 87.1%, 94.74%, 36/38, ~51 FPS, 19.6 ms, 3,764, 8 classes, 0.70, 10+45+26+8 = 89 |
| Vocabulary | approved: attention, priority, flagged for review, unidentified, operator, decision support. A forbidden-word list is grep-checked in every file and output. |
| Honesty | "ILLUSTRATIVE ANIMATION" tag on S2–S5; S6 is the only scene with measured results |

## 2. Where the facts came from (analyse the repo first)

Before designing, read the project's own documents so every label matches the real system:

| Fact | Source in this repo |
|---|---|
| 8 classes, canonical order: container_ship, tanker, cargo, passenger_ferry, yacht, speedboat, fishing_boat, military_vessel | `ai.md`, `PROJECT_CONTEXT.md` (`VesselClass` type), `src/types/detection.ts` |
| Origin labels Malaysian / Foreign / Unidentified; attention levels elevated / standard / routine | `PROJECT_CONTEXT.md`, `src/types/detection.ts` |
| Rule tokens and points: base 10, MILITARY_CLASS +45, UNIDENTIFIED_ORIGIN +26, confidence ≥ 0.90 +8 | `PROJECT_CONTEXT.md` §6, `backend/app/services/attention_service.py` |
| 0.70 uncertainty gate, forcing Unidentified | `PROJECT_CONTEXT.md` §6, `MATA_CANVA_PRESENTATION_SLIDES.md` |
| Case B example: 57.89% Malaysian / 42.11% Foreign | `TECHNICAL_BRIEF.md` (worked example) |
| Stage 1 YOLOv8-m, Stage 2 ResNet-50 origin classifier | `TECHNICAL_BRIEF.md`, slides |
| Verified results: military precision 96.5%, recall 87.1%, origin 94.74% (36/38), 19.6 ms (~51 FPS), 3,764 validation images | `MATA_TECHNICAL_SUBMISSION_REPORT_FINAL.md`, `TECHNICAL_BRIEF.md` |
| Yacht recall is 0%, so yacht is never shown as detected | technical report §3.5 |

Decision taken from this: the S4 tag reads "STAGE 2 · ORIGIN CLASSIFIER", with no architecture name. "ResNet-50" would put the number 50 on screen, which is not on the approved list.

## 3. Machine and tools (what was found, what was installed)

Checked before choosing tools (Windows, PowerShell):

| Tool | Version / location | Used for |
|---|---|---|
| Node.js / npm | 22.14 / 10.9 | `render.mjs` exporter |
| Chrome / Edge | installed (Program Files) | kiosk playback, exporter fallback |
| Playwright Chromium | cache `chromium-1223` = Playwright 1.60.0 | headless rendering, no browser download needed |
| Python (conda base) | 3.13, with Playwright 1.60, numpy, Pillow, matplotlib, openai-whisper, torch | QA scripts only (screenshots, frame diffs, transcripts) |
| ffmpeg / ffprobe | 8.1.1 (WinGet Gyan build), on PATH | encoding, audio mixing, probing, loudness |
| curl.exe | Windows built-in | model downloads |

Installed, all inside `booth/loop` (all git-ignored):

| Item | Why | Size |
|---|---|---|
| `package.json` + `playwright-core@1.60.0` (pinned, dev) | exporter; matches the cached Chromium, so nothing else downloads | small |
| `.venv` with `kokoro-onnx==0.6.1` (onnxruntime 1.30.0, numpy 2.5.3, espeakng-loader 0.2.4, phonemizer 3.4.0) | offline text-to-speech | ~150 MB |
| `models/kokoro-v1.0.onnx` SHA-256 `7D5DF8ECF7D4B1878015A32686053FD0EEBE2BC377234608764CC0EF3636A6C5` | Kokoro-82M weights | 310.5 MB |
| `models/voices-v1.0.bin` SHA-256 `BCA610B8308E8D99F32E6FE4197E7EC01679264EFED0CAC9140FE9C29F1FBF7D` | 54 voice styles | 26.9 MB |

Why a local `package.json`: the root `package.json` has no workspaces, so a bare `npm install` in `booth/loop` would have written into the repo root, breaking the scope fence.

## 4. Architecture of `index.html`

One SVG (`viewBox 0 0 1920 1080`, `preserveAspectRatio xMidYMid meet`) inside a black page. CSS sizes it to `min(100vw, 100vh*16/9)`, so it letterboxes to any screen.

- **Build once, then only update attributes.** About 980 SVG nodes are created at load. `renderFrame(t)` only writes `transform`, `opacity`, `display` and `stroke-dashoffset`. A write-through cache (`sa()`) skips identical DOM writes. Fully transparent elements get `display:none`, so they cost nothing.
- **Pure function of time.**
  - `renderFrame(t)` wraps `t` into [0, 30) and every renderer derives its whole state from `t` alone.
  - Randomness comes from a seeded PRNG (`mulberry32(4848)`), so the same `t` always gives the same frame, which makes scrubbing and export deterministic.
- **Scene-oriented renderers**, each writing every property it owns on every frame it is live:
  - `renderGrid`, `renderChart` (S1–S2 chart world and its markers), `scene1` … `scene7`
  - `brackets` (the travelling corner brackets), `cropLayer` (the S3→S4 crop), `chromeLayer` (tags and corner marks)
- **Layer order:** background, grid, chart, markers, ghosts, S1, S2, S3, S4, crop, brackets, S5, S6, S7, chrome.
- **Font safety.**
  - Text uses the stack "Inter", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif. Every line is measured at load (`getComputedTextLength`) and shrinks to fit if a fallback font runs wider.
  - The MATA48 wordmark is drawn as custom vector glyphs (M, A, T, A, 4, 8 paths), so the hero title looks identical everywhere.
- **Offline guarantee.** A CSP `<meta>` (`default-src 'none'`) blocks every network request. The favicon is `data:,` to stop the automatic favicon fetch.
- **Controls.** The live loop only feeds `renderFrame(clock % 30)`; pause/scrub adjust the clock base. `?render` builds the stage with no clock (for export), and `window.MATA_READY` signals that the build finished. `?debug` shows the timecode, scene and per-frame script cost.

### Reusable helpers (the motion toolkit)

| Helper | Purpose |
|---|---|
| `clamp01`, `lerp`, `prog(t, start, dur)` | normalised scene/element progress |
| `outExpo`, `inExpo`, `outCubic`, `inCubic`, `inOutCubic`, `smooth` | one easing family (expo/cubic) |
| `spring(x, zeta, omega)` | damped spring that lands exactly on 1 at x = 1 (brackets, rose, chips) |
| `hermite(t, keys)` | smooth keyframed values (probability bars) |
| `kline()` | kinetic type: masked word/letter reveals with stagger in and out, auto-fit width |
| `makeBox()` | corner-bracket frame built from rects driven only by transforms |
| `odometer()` | rolling digit columns inside one clip band (score and results tiles) |
| `typed()` | typewriter reveal through a clip that steps per measured character, blinking cursor |
| `prepDraw()` / `drawOn()` | line draw-on via `stroke-dasharray` / `stroke-dashoffset` |
| `makeShip()` | generic hull silhouettes from polygons (cargo, tanker, fishing, two military shapes) |
| `plate(t, tin, tout)` | the camera push profile shared by all scenes (section 5) |

## 5. Motion system

### One continuous camera push

Every scene is a "plate" at the origin (960, 540). `plate()` gives each plate:
- a slow in-scene push, `exp(0.009·t)`
- on exit, an accelerating push-through (`inOutCubic` over TD = 0.8 s to 1.3×) while it fades
- on entry, the next plate arrives from 1/1.3× scale

Because all plates share one profile, the hand-offs read as one uninterrupted camera move. The S1 title uses a stronger exit (1.75×), so it passes the chart with parallax.

Hand-off times (`TL`): 3.1, 7.55, 13.45, 19.1, 22.6, 26.6, and 28.95 (the final exit).

### Special transitions (spatial continuity)

- **S2 → S3 dive.** The chart camera zooms 7× into the flagged vessel and solves the camera position so the vessel travels smoothly to the viewfinder centre. The red corner brackets that marked the vessel grow and morph into the EO-camera viewfinder corners.
- **S3 → S4 lift.** The military detection box lifts out of the frame and scales into the S4 panel, carrying a live crop of the vessel (a clip-path whose rectangle follows the box).
- **Case A → Case B.** Inside the panel, the confident vessel slides out and a hazier one slides in: the harder case.

### Timeline (30.000 s)

| Scene | Window | Hero moment |
|---|---|---|
| S1 Title | 0–3.5 | coastlines draw on, rose settles on a spring, MATA48 glyphs rise through masks (0.32 + 0.075 s each), initials of the subtitle at full ink spell MATA |
| S2 Problem | 3.5–8.0 | 40 markers drift in two lanes plus a fishing area; three go dark at 5.0 / 5.45 / 5.9 s (ping ring, dashed trail, "NO AIS SIGNAL"); "One strait. Thousands of vessels." then "One operator." + eye icon; at 7.0 s the military marker turns red and brackets converge |
| S3 Detect | 8.0–14.0 | boxes snap on (spring from 1.35×) for cargo 8.8, tanker 9.3, fishing_boat 9.8, military_vessel 10.7 (red); class list lights as each is detected, yacht never lights |
| S4 Origin + gate | 14.0–19.5 | MALAYSIAN / FOREIGN bars against the 0.70 line; Case A clears it (blue MALAYSIAN · STANDARD ATTENTION); Case B settles 0.58 / 0.42, shutter closes at 17.45, "UNIDENTIFIED — FLAGGED FOR REVIEW" + eye; "It doesn't guess. It asks a human." |
| S5 Score | 19.5–23.0 | four rule chips stack in and feed a bus; odometer 10 → 55 → 81 → 89; ELEVATED at 20.6; reason types at 62 chars/s; "Every flag explained." |
| S6 Results | 23.0–27.0 | four tiles roll up, staggered 0.22 s: 96.5%, 87.1%, 94.74% (36/38), ~51 FPS (19.6 ms); caption "Military vessel · 3,764 held-out validation images · raw model.val() output" |
| S7 Close | 27.0–30.0 | "Explainable. Human-in-the-loop. Fully offline." + team line; everything exits by 29.45 s, leaving the S1 opening state (grid only) |

### Loop seam rules

- Frame 0 and frame 29.98 are both "grid only": nothing is visible at either end of the loop.
- The vertical grid drifts exactly 128 px (4 cells) per 30 s, and each step is snapped to device pixels so lines stay crisp.
- Measured result: frames at 29.98, 29.99 and 29.999 s are pixel-identical to frame 0.

### Motion vocabulary (from the motion-design guidance used)

| Move | Easing | Why |
|---|---|---|
| Entrances | outExpo / outCubic | fast start, calm landing |
| Morphs, pushes | inOutCubic | reads as physical movement |
| Settles (brackets, rose, chips) | damped spring, no bounce beyond a gentle overshoot | organic, not toy-like |
| Staggers | 0.03–0.08 s per unit | kinetic type without clutter |
| Exits | inExpo, faster than entries | things leave quickly |
| Never | scale from 0 | reads as synthetic; entries start at 0.4–0.9 scale |

## 6. Rendering to MP4 (`render.mjs`)

- `playwright-core` opens `index.html?render` at exactly 1920×1080, `deviceScaleFactor 1`.
- For each of the 900 frames it calls `renderFrame(i / 30)`, takes a lossless PNG screenshot and pipes it into ffmpeg. Nothing is captured in real time, so the video is frame-exact on any machine.
- **Browser fallback order:** Playwright cache, then `CHROME_PATH`, then installed Chrome, then Edge.
- **Encode:** libx264 High@4.1, `-preset slow -tune animation -crf 16`, yuv420p, BT.709 limited range, `+faststart`.
- **Colour-tag gotcha (ffmpeg 8):** encoder flags alone left the primaries and transfer tags as "unknown". The fix is a `setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv` filter, so the frames themselves carry the tags.
- **Modes:** `node render.mjs` (MP4), `--stills [t,...]` (PNG checkpoints), `--bench` (frame cost).

| Result (silent master `out/mata48-loop.mp4`) | Value |
|---|---|
| Stream | H.264 High, 1920×1080, yuv420p, 30/1 fps, 900 frames, 30.000 s, no audio |
| Size / export time | 7.53 MB / ~90 s |
| SHA-256 | `064FD5EE08BAE801FAFCA2DDE44EC9056C0D5A22EC114FD7FD89A5D5DD388336` |
| Accuracy | decoded frames match the stills at 40–44 dB PSNR, neighbouring frames 29–39 dB (no off-by-one); background decodes 50.7/84.7/65.7 vs 51/85/67, attention red 191/83/58 vs 193/84/60 |
| Determinism | 17 stills rendered twice in separate browser launches: bit-identical |

## 7. Audio: from ElevenLabs to fully open source

### What failed

The first voice plan used the ElevenLabs API (server-side Node script, key in `.env`, clips cached). On the first text-to-speech request the free tier returned `401 detected_unusual_activity` (free access disabled on the account). The script stopped with no retries and no clips.

Two lessons:
- A hosted free tier is not dependable for a deadline.
- Anything needing an account, key or network is a liability for an offline booth.

### What replaced it (free, open source, local)

| Layer | Tool | Licence |
|---|---|---|
| Narration | Kokoro-82M via `kokoro-onnx` 0.6.1 on CPU (onnxruntime) | weights Apache-2.0, wrapper MIT: no attribution needed |
| Phonemes | espeak-ng (bundled by `espeakng-loader`) + phonemizer | GPL-3.0 / GPL-3.0 (used as tools) |
| Score and sound design | NumPy, synthesised procedurally | own code |
| Mixing, loudness, encode | ffmpeg (`ebur128`, `alimiter`, AAC) | LGPL/GPL build |
| Intelligibility check | openai-whisper `base.en` (model downloaded to TEMP, deleted after) | MIT |

### Kokoro facts measured on this machine

- API: `create(text, voice, speed=1.0, lang='en-us', is_phonemes=False, trim=True, sentence_pause=0.25, clause_pause=0.1, continuous=False)`. It returns 24 kHz float32.
- About 3 s of synthesis per line on CPU; roughly 14 spoken characters per second at speed 1.0.
- There is no SSML break tag. A line that needs a pause landing on a visual cue is split into two separate takes, each placed on its own beat.
- Phonemes are available through `kokoro.tokenizer.phonemize(text, 'en-us')`, and can be edited and passed back with `is_phonemes=True`.
- **Pronunciation fixes:**
  - "Mata" came out as `mˈɑːɾə` (American flap-T). Replacing it with `mˈɑːtə` gives a clear t.
  - "AI" → `ˌeɪˈaɪ` and "YOLO V8" → `jˈoʊloʊ vˈiː ˈeɪt` were already correct.
- **English voices available:**
  - female: af_alloy, af_aoede, af_bella, af_heart, af_jessica, af_kore, af_nicole, af_nova, af_river, af_sarah, af_sky, bf_alice, bf_emma, bf_isabella, bf_lily
  - male: am_adam, am_echo, am_eric, am_fenrir, am_liam, am_michael, am_onyx, am_puck, am_santa, bm_daniel, bm_fable, bm_george, bm_lewis

### Next time: use a male voice

The build used `af_heart` (female). For the next build use a male narrator: `am_michael` (calm American) first, or `bm_george` (British broadcast tone). Plan for these differences:

- **Male voices speak slower.** Measured on the S3 line: af_heart 4.07 s, am_michael 4.52 s (+11%), bm_george 4.74 s (+16%).
- **Some lines will need speed-up.** The tight slots (s01, s02a, s05a, s05b, s06, s07) will likely need about 1.05–1.2× speed with a male voice. The auto-fit handles this up to 1.25×. If a line still doesn't fit, shorten the text rather than moving scene timings. For example, drop "fully" from s07.
- **Voice is a single argument** (`--voice am_michael`). It is part of the cache key, so switching voices regenerates the takes once and caches them.
- **Re-check the phonemes.** A British voice (`bm_*`) needs `lang='en-gb'`, whose phonemes differ, so re-check "Mata" and "YOLO V8" with `tokenizer.phonemize(text, 'en-gb')`.
- **Re-run the Whisper check** after switching.

### Narration script and beats (speech onset lands on the beat)

| id | Beat (s) | Line | Visual it lands on |
|---|---|---|---|
| s01 | 0.30 | Mata forty-eight. Maritime AI Threat Awareness. | wordmark assembling |
| s02a | 3.90 | One strait. Thousands of vessels. | S2 headline |
| s02b | 6.50 | One operator. | third line + eye icon |
| s03 | 8.50 | Stage one: YOLO V8 detects vessels across eight classes. | first detection boxes |
| s04a | 14.30 | Stage two classifies origin. | gate line draws |
| s04b | 17.20 | It doesn't guess. It asks a human. | shutter closes at 17.45 |
| s05a | 20.30 | Scored by rules. | chips summing |
| s05b | 21.75 | Every flag explained. | caption at 21.7 |
| s06 | 23.40 | Military precision: ninety-six point five percent. | first tile rolling |
| s07 | 26.95 | Explainable, human-in-the-loop, fully offline. | closing lines |

- **Slot rule:** each line must end 0.20 s before the next beat; the last line must end by 29.80 s.
- **Auto-fit:** synthesise at speed 1.0 and measure the speech span (10 ms RMS frames within 35 dB of the peak). If it overruns, re-synthesise at `speed × needed/room × 1.02`, capped at 1.25×; if it still doesn't fit, stop with an error.
- **With af_heart all ten lines fitted at speed 1.00.**
- **Cache:** `audio-tts/<sha256(voice|speed|model-sha|phonemes)[:20]>.npy` plus `manifest.json`, so re-runs synthesise nothing.
- **Upsampling:** 24 kHz → 48 kHz with a band-limited zero-padded FFT, padded first so there is no wrap-around.

### Procedural score (NumPy, 48 kHz, circular 30.000 s buffer, N = 1,440,000 samples)

**Seamless-loop rules:**
1. Every event is added to a circular bus: anything running past 30 s wraps to 0 s.
2. Filters and reverb are FFTs over the whole buffer, so they are circular too (the reverb tail at 29.9 s rings into 0.1 s).
3. Every sustained tone and LFO is quantised to a multiple of 1/30 Hz (`q(f) = round(f·30)/30`), so it completes whole cycles in 30 s. At 110 Hz that shifts pitch by under half a cent. Chorus detune is ±0.2 Hz (= 6/30).
4. All noise is seeded, so the result is deterministic.

**Beds:**
- **Pads:** Am (wrapping 28.95 → 3.1), F 3.1, C 7.55, Dm 13.45, Esus4 19.1, E 20.6 (the ELEVATED stamp), F 22.6, G 26.6, Am 28.95.
  - Chord windows are raised-cosine crossfades that sum to one.
  - Each note's envelope is the sum of the windows of the chords that contain it, so shared tones hold steady instead of bumping by 3 dB.
- **Low pedal:** A (55 / 110 / 165 Hz) with a 2-cycles-per-loop breath.
- **Noise:** sea band 110–800 Hz and air band 3–10 kHz, with slow swells.

**Cues** (times derived from the `index.html` constants, not guessed; pans from on-screen x positions):

| Scene | Cues |
|---|---|
| S1 | coastline draw hiss; guide-line zip outward L/R; one mallet note per glyph (A-minor pentatonic A4 C5 D5 E5 G5 A5 at 0.52 + 0.075 s each, panned by glyph x); compass ratchet: one tick per 5° notch the spring rotation passes (computed from the same spring as the visual); subtitle shimmer |
| S2 | 40 marker ticks sweeping left → right; per vessel going dark: falling C6 → A5 ping + echo + label tick, panned by its chart position; operator-eye bloom; red mark on the flagged vessel at 7.0 s |
| S3 | viewfinder settle; class-list ticks; per detection: snap + ping + confidence chirp whose end pitch rises with the confidence; military_vessel: low thud + A/E dyad; a low engine hum that pans with the military vessel's path |
| S4 | gate tick; a tone that follows the leading (top-1) origin probability and reaches A4 exactly at 0.70; F-major chime when Case A crosses the gate; swap whoosh; shutter whoosh + clunk (thump + metallic ring) at 17.58; suspended A/D dyad for "flagged for review" |
| S5 | four chip ticks; odometer ticks (one per digit passing, computed from the same easing); ELEVATED stamp (thud + E/B dyad); one key click per typed character at 62 chars/s |
| S6 | per tile: roll ticks decelerating with the digits, then a settle chime (A5, C6, F6, A6) when the leading digit reads; bracket draw swish |
| S7 | G-major chimes on the three lines; rule swish; team-line chime; exit whoosh; a quiet "breath" that wraps across the loop point |
| Every hand-off | noise whoosh whose brightness follows its loudness; sub drop on the S2→S3 dive; rising lift on the S3→S4 crop |

**Mix and encode:**
- **Levels:** narration about -16.5 LUFS on its own; the score at -25 LUFS under it, ducked 6 dB around speech (0.12 s in, 0.35 s out, built from the known speech spans, so no detector is needed). The final trim puts the voiced mix at -16 LUFS; the score-only mix is -20 LUFS.
- **Loudness measurement:** raw float32 stereo is piped into `ffmpeg -af ebur128=peak=true`, and the last "I:" and "Peak:" values in the summary are parsed. Never print the raw ebur128 log: its per-frame lines contain a word from the forbidden list.
- **Encode:** `-c:v copy` (video bit-identical to the master), `alimiter` ceiling -2 dBFS with `latency=true` (no sync shift), AAC 192 kbps 48 kHz stereo, `+faststart`. It writes to `.part.mp4`, then renames. If the true peak exceeds -1 dBTP, it re-encodes with a lower ceiling.
- **Bed balance fix:** the first spectrogram showed the pads masking the cues, so the beds were lowered 5–6 dB (pad -29, pedal -32, sea -40, air -50 dBFS RMS).

**Results achieved in the build** (before the revert, section 10):

| Check | Voiced | Score only |
|---|---|---|
| Video stream vs master | bit-identical | bit-identical |
| Duration | 30.000 s video and audio (+768 AAC padding samples after the end) | same |
| Loudness / true peak | -16.1 LUFS / -1.8 dBTP | -20.0 LUFS / -3.5 dBTP |
| Loop-seam jump vs 99.9th-percentile step | 0.007 vs 0.25 | 0.011 vs 0.10 |
| Whisper `base.en` transcript | every word recognised, including "Mata 48", "YOLO V8", "human in the loop", "96.5%" ("strait" heard as its homophone "straight") | n/a |

- **Seam gotcha:** the decoded AAC is 768 samples longer than 30 s (the codec fills its last 1024-sample block), while the container still reports 30.000 s. Measure the loop seam on the first N samples, not on the full decoded array.

## 8. Verification method (how quality was checked without eyes or ears on the TV)

| What | How |
|---|---|
| Runtime errors, network | headless Chromium with `pageerror`, `console` and `request` listeners; must be zero |
| Purity / NaN | step all 900 frames and scan every attribute for NaN / Infinity / undefined |
| Flicker | per element, the shortest visible run must be ≥ 3 frames |
| Dead elements | list elements never visible in the whole loop (only the 4 unlit class squares are, by design) |
| Timing map | log the first and last visible time of every text line; confirms each scene owns its window |
| Layout | text bounding boxes against the 5% safe area; cross-group text overlaps; boxes inside the viewfinder; minimum rendered font size |
| Jumps | mean absolute frame-to-frame difference over all 900 frames at 1080p; flag spikes more than 3× their neighbours, excluding the planned 1 px grid steps |
| Seam | pixel diff of 29.98 / 29.99 / 29.999 against 0: must be 0.0 |
| Contact sheets | tile checkpoints (0, 1.5, 3.4, 6, 7.5, 8.4, 10, 13, 14, 16, 18.5, 21, 25, 28.5, 29.5, 29.98) and view them; downscale to 480 px to test TV legibility |
| Performance | `render.mjs --bench`: renderFrame median 0.30 ms / p95 0.70 ms, main-thread total 2.62 ms per frame; headless rAF median 16.7 ms, about 2% of frames at 33 ms, all at hand-offs (software raster; test on the booth laptop) |
| Vocabulary | grep every booth file for the forbidden list after every edit |
| Audio | loudness and true peak on the decoded output, video hash, durations, seam delta, Whisper word timestamps against the beats, spectrogram with scene lines and cue ticks |

**Defects found by these checks and fixed:**
1. S2 line swap overlapped.
2. A "NO AIS SIGNAL" label crossed the safe margin.
3. Only 30 of 40 markers were ever on screen.
4. The zoomed chart lingered into S3.
5. The score flashed "00".
6. Tiles showed a static "00.0%".
7. The illustrative tag ended before S5 content left.
8. Orphan words near the seam.
9. Scene tags collided with outgoing labels.
10. Missing BT.709 colour tags.
11. AAC seam measurement.
12. Beds too loud.

## 9. Process lessons (how to run an agent on this kind of job)

- **Build first, judge second, polish third.** Phases: 1 build, 2 functional verification, 3 render, 3.5 audio, 4 visual QA (top 5 fixes), 5 polish (max 10 changes), 6 final QA. Each phase has a stop condition and a short report.
- **Write big files in chunks of ~50 lines.** One ~1,000-line write exceeded the per-response output limit twice and nothing was saved. Chunked writes worked every time.
- **Don't over-plan.** One session spent its entire budget designing every sound cue mentally and wrote zero lines. Write the file, run it, fix real errors.
- **Windows specifics:**
  - Piping a script into a venv `python.exe` via stdin exits silently; write the script to a file and run it.
  - Files written under `%TEMP%` by the editor tool can take a moment to appear; check `Test-Path` before running.
  - `$env:TEMP` expands to the short path `LUQMAN~1`; use full paths in scripts.
- **Keep secrets out of reach.** Check `git ls-files .env` before using any key. Add `.env`, `.env.*`, `!.env.example` to `.gitignore` before the key is read. Scan the tree for the key's bytes without printing it. Prefer designs that need no key at all.
- **Guard the master.** Hash the silent master before and after every audio step, and only ever stream-copy its video.

## 10. Current state on disk and what is missing

A later revert restored several files. As of this writing, `booth/loop` contains:

| Item | State |
|---|---|
| `index.html`, `render.mjs`, `package.json`, `package-lock.json`, `node_modules/` | present (Phases 1–3) |
| `out/mata48-loop.mp4` | present, SHA-256 unchanged (064FD5EE…8336) |
| `out/mata48-loop-voiced.mp4`, `out/mata48-loop-sfx.mp4`, `out/mata48-audio-cues.json`, `out/audio-check.png` | present from the audio build |
| `.venv/`, `models/`, `audio-tts/` | present (toolchain, Kokoro model, cached af_heart takes) |
| `make_audio.py` | reverted to a 47-line partial (header and constants only); the full script must be rewritten from sections 7–8 |
| `generate-voice.mjs`, `.env.example` | back on disk (the ElevenLabs version); delete them again if staying fully open source |
| `package.json` scripts | still lists the ElevenLabs `voice:plan`, `voice`, `voice:mix` scripts; remove them |
| `.gitignore` (booth) | ignores out/, node_modules/, .venv/, models/, audio/, .env*; add `audio-tts/` and `__pycache__/` |
| `README.md` | still documents the ElevenLabs variant; replace with the make_audio.py section |
| root `.gitignore` | has `.env`, `.env.*`, `!.env.example` (keep) |

## 11. Rebuild checklist

```powershell
# from booth/loop
npm install                                   # playwright-core 1.60.0 only
node render.mjs                               # silent master: out/mata48-loop.mp4
node render.mjs --stills 0,6,10,16,21,25,29.98
node render.mjs --bench

python -m venv .venv
.\.venv\Scripts\python.exe -m pip install kokoro-onnx==0.6.1
New-Item -ItemType Directory -Force models
curl.exe -L -o models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl.exe -L -o models/voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
Get-FileHash models\* -Algorithm SHA256        # compare with section 3
.\.venv\Scripts\python.exe make_audio.py --voice am_michael   # male narrator next time

# booth playback (kiosk, separate profile so it applies even if Chrome is open)
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --no-first-run --disable-session-crashed-bubble `
  --user-data-dir="$env:TEMP\mata48-kiosk" "file:///C:/path/to/booth/loop/index.html"
powercfg /change standby-timeout-ac 0; powercfg /change monitor-timeout-ac 0
```

**Before the doors open:**
- Watch one full loop on the booth laptop and TV (hand-offs are where frames can drop).
- Set the TV to "Just Scan" / 1:1 with motion smoothing off.
- Turn off notifications and pause Windows Update.
- If hand-offs stutter live, play `out/mata48-loop.mp4` on repeat instead.
