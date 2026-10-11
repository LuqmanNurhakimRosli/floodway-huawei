# FloodWay 60-second product film

A premium 60-second product film for Malaysian users. It shows who FloodWay is for, the problem, how it works, and what you can do with it. It is rendered entirely from code, deterministic and offline. The creative brief and claims policy are in [BRIEF.md](BRIEF.md).

| Output | What it is |
|---|---|
| `index.html` | Self-contained film (no network, no dependencies). Double-click to play; silent. |
| `out/floodway-loop.mp4` | Silent master: H.264 High, 1920×1080, 30 fps, 1,800 frames, 60.000 s, BT.709. |
| `out/floodway-loop-voiced.mp4` | Same video stream (copied bit for bit) plus narration and score, about −16 LUFS, ≤ −1.5 dBTP. |

## Scenes
S1 Malaysia in the rain (0–7) · S2 The problem (7–13) · S3 FloodWay arrives (13–19) · S4 See the water (19–27) · S5 Find a safer route (27–35) · S6 Family Ping (35–42) · S7 How it works (42–49) · S8 Different journeys (49–55) · S9 Final hero (55–60). Every time lives in `src/timeline.json`, which drives both the visuals and the soundtrack.

## Files
| File | Purpose |
|---|---|
| `src/shell.html` | Page shell, CSP, stage (three canvases: world, phone, overlay). |
| `src/01-core.js` | CONFIG, easing, seeded PRNG, canvas + kinetic type helpers. |
| `src/02-art.js` | Art kit: sky, city, bokeh, rain, splashes, glass drops, rim-lit people, cars, the wave mark. |
| `src/03-shots.js` | The illustrative Malaysian rain shots (generic places, no real locations). |
| `src/04-phone.js` | Generic hero phone (CSS 3D) and the FloodWay screens: lock alert, 3D Twin, map, Family Ping, home. |
| `src/05-scenes.js` | Scene backgrounds, journey cards, pipeline, all type, tags, letterbox, grade. |
| `src/06-main.js` | `renderFrame(t)` and playback controls. |
| `build.mjs` | Concatenates `src/` and embeds Outfit into `index.html`. |
| `render.mjs` | Exporter and QA (Playwright + ffmpeg). |
| `make_audio.py` | Offline narration (Kokoro) and procedural score, then mix and mux. |
| `audit-claims.mjs` | Forbidden-term and on-screen-number audit. |
| `legacy-30s/`, `out/legacy-30s/` | The previous 30-second loop, kept for reference. |

## Playing it
Open `index.html` in Chrome or Edge.

| Key / query | Action |
|---|---|
| `F` | Fullscreen |
| `Space` | Pause / resume |
| `←` / `→` | Scrub 1 s |
| `?t=25` | Start at 25 s |
| `?debug` | Timecode, scene and per-frame script cost |

The cursor hides after 2 s and a screen wake lock is requested. For the booth, play `out/floodway-loop-voiced.mp4` (or the silent master) on repeat. The film ends on the brand card and fades to navy, so the repeat cut is clean.

Kiosk (Chrome, separate profile):
```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --no-first-run --disable-session-crashed-bubble `
  --user-data-dir="$env:TEMP\floodway-kiosk" "file:///C:/path/to/booth/floodway-loop/index.html"
powercfg /change standby-timeout-ac 0; powercfg /change monitor-timeout-ac 0
```
Set the TV to "Just Scan" / 1:1 with motion smoothing off. Watch one full pass on the booth laptop first.

## Build, QA and export
From `booth/floodway-loop`:
```powershell
npm install                        # playwright-core 1.60.0 + @fontsource/outfit 5.3.0 (build time only)
node build.mjs                     # src/ -> index.html (+ out/timeline.json)
node render.mjs --qa               # console/network errors, NaN draw args over 1,800 frames, determinism, purity
node audit-claims.mjs              # claims policy
node render.mjs --stills 0,25,59.98
node render.mjs --sheet 3,15,25,35,42,50,59
node render.mjs                    # silent master, ~15 min (lossless PNG per frame into x264)
```

## Audio (fully offline, open source)
- **Narration:** Kokoro-82M (Apache-2.0) via `kokoro-onnx` 0.6.1 (MIT), voice `bm_george` (en-GB).
  - Each line's first syllable lands on its beat.
  - A line that overruns its slot is re-synthesised faster (up to 1.25×). If it still doesn't fit, the script stops rather than moving picture timings.
  - Takes are cached in `audio-tts/`.
- **Score:** synthesised with NumPy.
  - Rain ambience and a low drone for the opening.
  - A warm D-major pad and pulse from the reveal onward.
  - UI cues locked to the same timeline: one blip per 0.01 m of water, the button chime, the route glide, family "seen" chimes, pipeline pings, card flips, and the end resolve.
  - The score ducks 7 dB under speech.
- **Mix:**
  - Voice at −17 LUFS alone and score at −27 LUFS, then the sum is trimmed to −16 LUFS.
  - The `alimiter` ceiling is iterated until true peak ≤ −1.5 dBTP.
  - AAC 192 kbps. `-c:v copy` keeps the video identical, and the script checks that the silent master's hash is unchanged.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install kokoro-onnx==0.6.1
New-Item -ItemType Directory -Force models
curl.exe -L -o models/kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl.exe -L -o models/voices-v1.0.bin  https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
.\.venv\Scripts\python.exe make_audio.py            # --voice am_michael --lang en-us for an alternative
```
Model SHA-256: `kokoro-v1.0.onnx` 7D5DF8EC…6A6C5, `voices-v1.0.bin` BCA610B8…F1FBF7D (checked by the script).

## Honesty and claims
- Real-world scenes carry "Illustrative dramatization", and the S8 cards carry "Illustrative personas".
- "Always follow official warnings (MetMalaysia / JPS)" stays on screen from S1 to S6.
- No agency endorsement is implied.
- No performance metrics are shown.
- The only numbers on screen are the twin gauge (0.00–0.30 m) and the app's shelter card ETA (~7 min · 1.2 km).
