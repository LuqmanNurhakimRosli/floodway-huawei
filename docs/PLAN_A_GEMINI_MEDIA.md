# PLAN A: Gemini media generation for FloodWay

Hand this whole file to Gemini 3.8 Flash (high) in Antigravity. It creates images, a video and calibration data.
It does not change app code.

---

## 0. Copy-paste block for Gemini (read first)

```
ROLE: You generate AI-simulated image and video assets for the FloodWay flood-prevention demo (Malaysia).
You also measure calibration numbers on the images you generate. You do NOT change application code.

ORDER OF WORK
1. Read sections 1-3 of this plan (inventory, asset list, honesty rules).

2. Generate the 20 water-level frames (section 4) and check them against the rules.
3. Generate the one video (section 5) or build it with the ffmpeg fallback.
4. Measure calibration for every camera (section 6) and write calibration.json.
5. Run the check script (section 6.3). Report the real hit rate. Do not change thresholds to pass it.
6. Save the verification screenshots (section 8).
7. Report back using the template in section 9.

WRITE ONLY TO THESE PATHS
- backend/app/vision/sample_media/            (frames, calibration.json, check_frames.py, README.md)
- frontend/public/media/                      (the same images as WebP, plus the demo video and posters)
- docs/screenshots/media-check/               (verification screenshots)
Anything else is out of scope. If you think code must change, write it into your report as a request. Do not edit it.

DO NOT
- add any real agency name, logo, crest or branding (JPS, DBKL, Huawei, Bomba, MET, etc.)
- add readable number plates, real-looking names, or identifiable faces
- add timestamps, watermarks, camera logos or on-screen text (the app draws its own labels)
- claim, in any file, that these are real government CCTV feeds
- use an API key or call a paid service unless the user has supplied one in the session

REPORT BACK: the list in section 9, including the real hit rate of the check script.
```

---

## 1. Context you need

FloodWay is a life-safety demo. Its **Live Vision** page (`/live`) shows river and drain cameras, each analysed for
water level. The analyser (`backend/app/vision/analysis/classical.py`) finds water by colour and smoothness inside a
drawn zone, and turns the waterline into a height ratio against three reference lines (Normal, Warning, Danger).

**Right now every sample camera is a drawn vector scene** (`backend/app/vision/sources/synthetic.py` and
`frontend/src/components/live/feed/RiverScene.tsx`). It looks like a diagram, not a camera. That is what this plan fixes.

**Everything you make is AI-generated simulation.** It is not a real feed and must never be presented as one.

---

## 2. Inventory of every media reference (verified in the code)

| Asset id | Where it is used (verified) | Size / aspect | Format | Target path | Filename the code expects / will expect |
|---|---|---|---|---|---|
| CAM-KLANG | Live Vision cards and feed for `sample-klang-jamek` (`backend/app/vision/seed.py` SAMPLES, `frontend/src/services/vision/mockVision.ts` SPECS) | 640×360 (16:9) | JPEG ≤300 KB, plus WebP | `backend/app/vision/sample_media/klang-{normal,watch,warning,danger}.jpg` and `frontend/public/media/live/klang-{level}.webp` | `klang-*.jpg` |
| CAM-GOMBAK | Live Vision, `sample-gombak-tun-razak` | 640×360 | as above | `…/gombak-{level}.jpg` | `gombak-*.jpg` |
| CAM-SMART | Live Vision, `sample-smart-tunnel` | 640×360 | as above | `…/smart-{level}.jpg` | `smart-*.jpg` |
| CAM-BATU | Live Vision, `sample-batu-sentul` | 640×360 | as above | `…/batu-{level}.jpg` | `batu-*.jpg` |
| CAM-DRAIN | Live Vision, `sample-kampung-baru-drain` | 640×360 | as above | `…/drain-{level}.jpg` | `drain-*.jpg` |
| CAM-BACKYARD | Live Vision, `sample-backyard-stream`. **Offline by design**, so no frame is shown. | none | none | none | none |
| VIDEO-KLANG | Demo playback loop for `sample-klang-jamek` (new: nothing uses it yet; Plan B task P1-04 wires it) | 640×360, 8–15 s loop | MP4 H.264 ≤3 MB | `frontend/public/media/live/klang-rise.mp4` and `…/klang-rise-poster.webp` | `klang-rise.mp4` |
| REPORT-DRAIN | Report card photo (`frontend/src/services/api.ts:241` `imageUrl: '/banjir_drain.jpg'`). **Out of scope this round:** Plan B does not switch report images. Do not make these unless Plan B adds a task. | 4:3 | WebP ≤300 KB | `frontend/public/media/reports/evidence-drain.webp` | (not made) |
| REPORT-UNDERPASS | `api.ts:218` `/banjir_underpass.jpg`. Out of scope this round (see REPORT-DRAIN). | 4:3 | WebP | `frontend/public/media/reports/evidence-underpass.webp` | (not made) |
| REPORT-KG | `api.ts:165` `/banjir2.jpg`, and `LiveCCTVModal.tsx:35`. Out of scope this round. | 4:3 | WebP | `frontend/public/media/reports/evidence-kampung-baru.webp` | (not made) |
| REPORT-SRI-MUDA | `api.ts:195` `/banjir3.jfif`. Out of scope this round. | 4:3 | WebP | `frontend/public/media/reports/evidence-sri-muda.webp` | (not made) |
| CCTV-STILL-OLD | `LiveCCTVModal.tsx:27` `/cctv image.jpg` (captioned "Klang River CCTV") | — | — | **Replace.** Do not reuse the old file. Use CAM-KLANG frames, and say "AI-generated sample" in the caption. | |
| HERO-WELCOME | `frontend/src/pages/WelcomePage.tsx` (landing). **Out of scope this round:** Plan B has no hero task. Skip. | 16:9 | WebP | `frontend/public/media/hero/welcome-hero.webp` | (not made) |
| OG-IMAGE | `frontend/index.html` has no `og:image` (verified: only the favicon link at line 5). Plan B task P4-06 adds the tags. | 1200×630 | JPEG ≤300 KB | `frontend/public/media/og/floodway-og.jpg` | `floodway-og.jpg` |
| BASEMAP-NOTE | Not an image. Map tiles come from OpenStreetMap / Carto URLs. Plan B fixes them. | — | — | — | — |

Existing files in `frontend/public/` you must not overwrite: `floodway logo.png`, `floodway_architecture.png`,
`favicon.svg`, `otter-mascot.svg`, `city.glb`, `terrain.json`, `water-level.png`. Only write under `media/`.

---

## 3. Honesty and content rules (mandatory)

1. Every frame and the video are **AI-generated sample imagery**. Put that exact phrase in every file's metadata
   description (`exiftool` or the WebP comment) and in `backend/app/vision/sample_media/README.md`.
2. The app labels cameras `SAMPLE`, and the video `PLAYBACK`. Do not draw any label into the images.
3. No agency name, crest, uniform, vehicle livery, logo, flag or sign with a government name.
4. No readable number plates, names, phone numbers or street signs that look like real addresses. Use blank or
   unreadable signage.
5. No identifiable people. If a person must appear, make them small, out of focus, or back-turned, with no face visible.
6. Do not make the scenes look like a specific real place. Generic Malaysian drains, concrete channels and bridges are
   fine. Do not copy a recognisable landmark.
7. The About/credits text the app will show (Plan B task P1-07) must include: **"AI-generated sample imagery. Not
   real camera footage."** Put the same line in `sample_media/README.md`.

---

## 4. The 20 water-level frames (5 cameras × 4 levels)

### 4.1 The idea: same camera, only the water changes

The analyser compares one fixed view across levels. So for each camera you produce **four frames with identical
framing**: the same camera position, lens, crop, lighting and background. Only the water height changes.

**How to keep framing identical:**
1. Generate the **NORMAL** frame first. Keep it as the reference image.
2. For WATCH, WARNING and DANGER, use that reference as the image input (or as the base in image-to-image), with the
   prompt "same camera, same framing, same lighting, only the water level rises".
3. Use the **same seed** for all four, if the model supports it.
4. Check by eye: the bank edges, the structures and the sky line must sit at the same pixel positions in all four.
   If not, regenerate the four from the reference.

### 4.2 Shared style for all five cameras

- Fixed CCTV look: slightly wide lens, eye-level or mounted, 640×360 framing, no fisheye.
- Daylight, tropical, overcast or late-afternoon monsoon light. Mild haze. No night, no infrared.
- Concrete channel walls, grey and textured. Water is brown-green or muddy in NORMAL, and rises to the bank in DANGER.
- Vegetation at the edges: tropical trees, grass, a little litter. Not dense.
- No people in the main frame. No vehicles with readable plates.
- Output size 640×360 for the analyser, and a 1280×720 master if you can (downscale to 640×360 for the app).

### 4.3 The five cameras and their angles

Each camera has a unique angle so the page does not look like one photo repeated.

| Camera id | Scene (for the prompt) | Angle | Water levels (the visible story) |
|---|---|---|---|
| `sample-klang-jamek` (**CAM-KLANG, also the video**) | Concrete river channel with a footbridge deck at the top of frame, looking **down-river** | Elevated, from the bridge deck, slight downward tilt | Water rises from a low bed to within a hand's width of the bank top in DANGER |
| `sample-gombak-tun-razak` (CAM-GOMBAK) | Side-on concrete channel with a **staff gauge** (a numbered measuring rod on the wall, numbers unreadable at this scale) | Side-on, eye level | Water passes the gauge's middle marks at WARNING |
| `sample-smart-tunnel` (CAM-SMART) | Road underpass or culvert inlet, dark concrete mouth at the top, the water approaching the mouth | Low, from the road side, looking into the inlet | Water approaches the inlet lip at DANGER |
| `sample-batu-sentul` (CAM-BATU) | Riverside walkway edge, concrete parapet at the bottom of frame, water in the mid-ground | Low angle, close to the walkway | Water covers the lower bank, reaching the parapet line at DANGER |
| `sample-kampung-baru-drain` (CAM-DRAIN) | Urban drain or box channel with a metal grate at the front | High pole-mount looking down into the drain | Water fills the drain to the upper lip at DANGER |

### 4.4 The four levels for every camera

| Level | What the frame shows | Notional water height (for your reference only) |
|---|---|---|
| NORMAL | Water low, well below the Normal line | about 20% of bank height |
| WATCH | Water near the Normal line, slightly higher | about 45% |
| WARNING | Water at or just past the amber Warning line | about 65% |
| DANGER | Water at or above the red Danger line, near the bank top | about 95% |

Filenames use the word `watch`. The app shows that level as **ADVISORY**. The check script maps `watch` to ADVISORY.

### 4.5 Prompt template (one per frame; replace the braces)

```
A fixed CCTV-style photograph of {SCENE}, taken from {ANGLE}, for a Malaysian urban river or drain.
Concrete channel walls, tropical vegetation at the edges, overcast monsoon daylight, slight haze.
Water level: {LEVEL_DESCRIPTION}.
Same camera, same framing, same lighting as the reference image. Only the water height changes.
No people in the centre of frame. No readable signs, plates, logos or text. No watermark. No timestamp.
Realistic photographic look, not an illustration. 640x360 framing, 16:9.
```

`{LEVEL_DESCRIPTION}` for each level:
- NORMAL: "low and clear, sitting well below the concrete step lines"
- WATCH: "slightly raised, just above the normal water line, still well inside the channel"
- WARNING: "high, reaching the amber painted line on the wall, brown and turbulent"
- DANGER: "almost at the top of the bank, nearly overtopping, brown and fast"

### 4.6 File naming and output

```
backend/app/vision/sample_media/klang-normal.jpg
backend/app/vision/sample_media/klang-watch.jpg
backend/app/vision/sample_media/klang-warning.jpg
backend/app/vision/sample_media/klang-danger.jpg
… (same pattern for gombak, smart, batu, drain)
```

Also write the same 20 as WebP to `frontend/public/media/live/{camera}-{level}.webp` (quality about 80, ≤300 KB each).

---

## 5. The one video (VIDEO-KLANG)

- **Camera:** `sample-klang-jamek` (CAM-KLANG). It is the only video. Say so in the README.
- **Content:** the same bridge-deck view as the NORMAL frame, with the water **rising from NORMAL to DANGER over
  about 10 seconds**, then **falling back** to NORMAL over the next 5 seconds, so it loops with no jump.
- **Length:** 12–15 s total, seamless loop.
- **Format:** MP4, H.264, 640×360, 25 fps, ≤3 MB, no audio. Name it `klang-rise.mp4`.
- **Poster:** the NORMAL frame as WebP, `klang-rise-poster.webp`.

### 5.1 If your video tool cannot make the loop: ffmpeg fallback

Build it from the four CAM-KLANG frames (normal, watch, warning, danger), with crossfades. Run from the folder with
the four JPEGs:

```bash
ffmpeg -y \
  -loop 1 -t 3 -i klang-normal.jpg \
  -loop 1 -t 3 -i klang-watch.jpg \
  -loop 1 -t 3 -i klang-warning.jpg \
  -loop 1 -t 3 -i klang-danger.jpg \
  -loop 1 -t 3 -i klang-warning.jpg \
  -loop 1 -t 3 -i klang-normal.jpg \
  -filter_complex "\
[0][1]xfade=transition=fade:duration=1:offset=2[a1];\
[a1][2]xfade=transition=fade:duration=1:offset=4[a2];\
[a2][3]xfade=transition=fade:duration=1:offset=6[a3];\
[a3][4]xfade=transition=fade:duration=1:offset=8[a4];\
[a4][5]xfade=transition=fade:duration=1:offset=10[a5];\
[a5][0]xfade=transition=fade:duration=1:offset=12,format=yuv420p[v]" \
  -map "[v]" -r 25 -c:v libx264 -crf 28 -preset slow -movflags +faststart -an klang-rise.mp4

ffmpeg -y -i klang-normal.jpg -c:v libwebp -quality 80 klang-rise-poster.webp
ls -l klang-rise.mp4        # must be <= 3 MB, otherwise raise -crf to 30
```

Check that the loop joins smoothly: play the file, and make sure the last second flows into the first.

---

## 6. Calibration: measure the lines on each frame

The analyser needs three things per camera: a **ROI** (the polygon of the water channel) and three **reference
lines** (Normal, Warning, Danger), each as a height in the frame. All numbers are fractions of the frame, `0.0` at the
top and `1.0` at the bottom.

### 6.1 What to measure

For **each camera**, open the NORMAL frame and note:
- the **ROI polygon**: 4 corners around the water channel, excluding road, sky and walkway. Use the wet channel
  only. Typical: the bed at the bottom, the bank top at the top.
- the **Normal line**, **Warning line** and **Danger line**: the y-position where the bank marking or the bank top
  sits. Danger = bank top. Warning = mid-bank. Normal = the usual water line in NORMAL.

Then open WARNING and DANGER and confirm the water edge sits near the right line. Adjust once if needed, and note
the change. Do not change the lines after the check script has run.

### 6.2 calibration.json

Write `backend/app/vision/sample_media/calibration.json` in this exact shape (one object per camera id):

```json
{
  "sample-klang-jamek": {
    "roi": [[0.20, 0.30], [0.80, 0.30], [0.80, 0.92], [0.20, 0.92]],
    "lines": { "normal": 0.80, "warning": 0.62, "danger": 0.40 },
    "notes": "bridge deck view; danger = bank top"
  }
}
```

Rules:
- `roi` has 3 to 32 points, each `[x, y]` with both values between 0 and 1.
- `lines` must satisfy **danger < warning < normal** (smaller y is higher water) and each must be below the bed.
- Fill one entry for each of: `sample-klang-jamek`, `sample-gombak-tun-razak`, `sample-smart-tunnel`,
  `sample-batu-sentul`, `sample-kampung-baru-drain`.
- Do not add an entry for `sample-backyard-stream`. It has no frames.

### 6.3 The check script (run it; do not edit the analyser)

Save this as `backend/app/vision/sample_media/check_frames.py`. It uses the project's own classical analyser and the
project's own threshold rules. It writes a report. It does not change any threshold.

```python
"""Check that the sample frames classify at the level they were generated for.
Run from backend/:  python -m app.vision.sample_media.check_frames
Uses the project's real analyser and level rules. Do not change thresholds to pass."""
from __future__ import annotations

import json
from pathlib import Path

import cv2

from app.vision.analysis.classical import ClassicalWaterAnalyzer
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
analyzer = ClassicalWaterAnalyzer()
total = hits = 0
for short, cam_id in CAMERAS.items():
    cal = Calibration(roi=[tuple(p) for p in cal_all[cam_id]["roi"]], lines=cal_all[cam_id]["lines"])
    thr = thresholds_from_calibration(cal)
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
```

Expected output: one block per camera with the four results, and a final `TOTAL x/20`.

**Acceptance:** each camera gets **at least 3 of 4** frames right. If a camera fails, do not adjust the threshold
in `levels.py` or the analyser. Adjust the frame or the calibration numbers, rerun, and report every change. Report
the **real** hit rate in section 9 even if it is below target.

---

## 7. File layout and wiring

```
backend/app/vision/sample_media/
  README.md                  (what this is; AI-generated sample imagery; list of files; the one video)
  calibration.json           (section 6.2)
  check_frames.py            (section 6.3)
  klang-normal.jpg ... drain-danger.jpg   (20 frames, 640x360, each <=300 KB)

frontend/public/media/live/
  {camera}-{level}.webp      (20 WebP copies, <=300 KB each)
  klang-rise.mp4             (<=3 MB, H.264, no audio)
  klang-rise-poster.webp

frontend/public/media/og/        (OG-IMAGE only, used by Plan B task P4-06)
# Not in scope this round: frontend/public/media/reports/ and frontend/public/media/hero/ (no Plan B task uses them).
```

**Limits:** images ≤300 KB; video ≤3 MB; no file over 1 MB unless the section above allows it.

**Code that will read these (Plan B does the wiring; Gemini does not touch code):**
- The backend sample seed (`backend/app/vision/seed.py`) will load frames from `sample_media/` when they exist, and fall back to
  the vector scene when they do not (Plan B task P1-03).
- `calibration.json` replaces the hard-coded `sample_calibration()` values in `seed.py` (Plan B task P1-03).
- The frontend reads `/media/live/…` for the video and the poster on the `/live` page (Plan B task P1-04).

---

## 8. Verification (run after everything is generated, and after Plan B wires it)

Save every screenshot to `docs/screenshots/media-check/`.

1. Run the backend and the frontend. Confirm `http://localhost:8080/api/v1/vision/cameras` returns cameras.
2. Open `http://localhost:5173/live` at **1440×900** and **390×844**.
3. Check every camera card shows its thumbnail (not "Waiting…" or a grey box).
4. Open each camera's feed. The frame is an image, not the vector scene.
5. Check the video: it plays, loops with no jump, and shows the `PLAYBACK` badge.
6. Let the page run for at least 2 minutes. The levels must move between NORMAL and WARNING or DANGER for the
   cameras whose frames are wired to change. Note which cameras move.
7. Open the browser network log. There must be **no 404** for any `/media/` or `/api/` URL.
8. Confirm every camera still shows **SAMPLE**, and the video shows **PLAYBACK**.

---

## 9. What to report back (use this template exactly)

```
PLAN A REPORT
Files created: <count>, total size <MB>
Frames: <n>/20 created. Missing: <list or none>
Video: <created | ffmpeg fallback used | not created, reason>
Calibration: <n>/5 cameras written to calibration.json
CHECK SCRIPT RESULT: TOTAL <x>/20 frames at expected level (<percent>%)
  per camera: klang <x>/4, gombak <x>/4, smart <x>/4, batu <x>/4, drain <x>/4
Changes made to calibration after the first check: <list or none>
Verification screenshots: <list paths>
Policy checks: no agency branding [yes/no], no readable plates or faces [yes/no], "AI-generated sample imagery" in README and metadata [yes/no]
Anything you could not do, and why:
Requests for code changes (not made by you):
```
