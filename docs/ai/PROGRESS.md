# PROGRESS: the anchor file for every AI agent

Read this before you change anything. Update it before you stop (rules in `/AGENTS.md`). Keep it short: detail goes in `docs/ai/CHANGELOG.md`.

**Last updated:** 2026-10-12 · **Branch:** `live-ui-upgrade` · **Checks:** frontend 120 tests + build, backend 130 passed (via scripts/check.ps1)

## Status board

| Area | State | Notes |
|---|---|---|
| Live Vision page `/live` | Done | iPhone-style phone UI, one countdown, photo upload (`POST /cameras/upload`), 11-viewport check clean |
| Map and evacuation | Done | KL only: 8 demo relief centres, 16 flood-prone areas, stored OSM routes (`node frontend/scripts/build_kl_routes.mjs` to rebuild) |
| Sample media | Done 2026-10-12 | 60 photographic frames (5 cameras x 12-rung ladder); the page shows the rung matching the reading. Read by `ReferenceDiffAnalyzer` against each camera's dry frame; `check_ladder` PASS (4 cameras 12 of 12, drain 11 of 12). Details and limits: `backend/app/vision/sample_media/README.md` |
| Feed overlays | Done | Photo shows clean by default (lines and waterline); the Zone and Water toggles remain |
| Preliminary round pack | Done 2026-10-12 | `docs/product/preliminary-round/`: `MEETING_SUMMARY.pdf` (and `.md`), `PITCH_SCRIPT.md` (three speakers, about 4:30), `poster/FloodWay_Poster_1920x1080.png` (one slide: Problem, Solution, Impact; QR to the live demo), `transcript/` |
| Motion film | Done 2026-10-12 | `booth/floodway-live-film/`: 45 s, 1920x1080, 30 fps. `out/floodway-live-vision-sound.mp4` (with procedural score) and the silent master. Hook, gap, Live Vision (real ladder frames, number and level in sync), safe route, phone alert, impact, brand + QR. Rebuild steps in its README |
| Live demo on Cloudflare | **Live 2026-10-12 (laptop-hosted)** | `powershell -File scripts/public-demo.ps1` starts a read-only public backend on this laptop (port 8090, no Telegram, own data folder, write token in `%LOCALAPPDATA%\floodway-public\write-token.txt`), opens a Cloudflare quick tunnel, rebuilds the frontend with that address and deploys it to `floodway-huawei.pages.dev`. Verified: /live shows "Live 5/6 online" with the new frames. The laptop must stay on; every restart gives a new tunnel address, so re-run the script (`-Stop` to stop). Earlier note, kept for history: | `https://floodway-huawei.pages.dev` serves a 2-week-old build with no backend (it calls `localhost:8080`). Newer `main` builds on Cloudflare fail. Ready: `backend/Dockerfile` + `.dockerignore`, `CORS_ORIGINS` env, production frontend build (secrets blanked, verified out of the bundle). Needs: a hosting account, then the backend URL. The QR on the poster points here |
| Forecast | Rule-based | `backend/app/services/forecaster.py` is a formula and says so. `models/ml_pipeline` holds a synthetic-data GRU that nothing loads |
| Huawei Cloud | Designed, not called | ModelArts package prepared in `models/ml_pipeline/modelarts_pkg`; nothing deployed |
| Other pages' touch targets | Open | Home, map, reports, profile still have targets under 44 px on phones |

## Open work, in order

1. User: re-deploy the frontend with `VITE_API_BASE` set to a hosted backend (or accept a sample-only demo on the QR link), then check the pages URL. Confirm the one-slide rule and team requirements by email (see `docs/product/preliminary-round/MEETING_SUMMARY.md`).
2. User: restart the backend on :8080. The running one predates the analyser change and still reports `classical-v1` for the sample cameras.
2. A learned water segmenter for user-added cameras: the classical analyser cannot read photographic water (see `sample_media/README.md`). Needs labelled frames and `analysis/yolo_seg.py`.
3. User: delete `docs/_to-delete/` once happy (it holds the superseded docs, duplicate `assets/` and duplicate model folders; all are also in git history or were byte-identical copies).
4. User: rotate the OpenRouter key (`VITE_OPENROUTER_API_KEY` was in the browser bundle) and the Telegram bot token. Neither was rotated by an agent.
5. Phone touch-target pass on Home, Map, Reports, Profile.

## File map (where things live)

```
AGENTS.md  CLAUDE.md            agent rules (CLAUDE.md just imports AGENTS.md)
README.md                       public readme
backend/app/vision/             Live Vision: engine, analysis/ (classical, waterline), levels.py, seed.py, sources/, sample_media/
backend/app/routes, services/   reports, alerts, SOS, forecast (rule-based), twin
backend/tests/                  pytest
frontend/src/pages, components/ React pages; components/live/ is Live Vision; components/brand/ is the logo
frontend/public/media/live/     webp copies of the sample frames, klang-rise.mp4
frontend/scripts/               layout-check.mjs, map-fps.mjs, build_kl_routes.mjs
models/ml_pipeline/             GRU forecaster code, notebooks nb1-nb4, trained weights (synthetic), ModelArts package
models/legacy_ann/              first Keras ANN on the Malaysia rainfall CSV (datasets/)
scripts/                        check.ps1, public-demo.ps1, public_backend.py, render-poster.mjs, make_og_image.py, generate_image.py
docs/ai/                        this file, CHANGELOG.md (detail)
docs/architecture/              system spec, API, DB, IoT, tech stack, conventions (some FYP-era: verify before trusting)
docs/product/                   preliminary-round/ (poster, pitch script, meeting summary, transcript), pitch deck PDFs
docs/ops/                       DEMO_RUNBOOK.md (what is real, simulated, not built; demo script; failure table)
docs/plans/                     active plans only
docs/reference/                 competition rules and forms, 3D house reference
docs/screenshots/               evidence (after-c = latest, media-check = media plan)
booth/                          film project (floodway-live-film/), MATA48 booth assets
firmware/                       ESP32 sensor sketch
docs/_to-delete/                quarantine, safe to remove
```

## Run and check

- All checks: `powershell -File scripts/check.ps1`
- Backend: `cd backend; .venv\Scripts\python.exe run.py` (port 8080) · tests: `.venv\Scripts\python.exe -m pytest -q`
- Frontend: `cd frontend; npm run dev` (5173) · `npm run check` · `npm run layout-check`
- Media scripts (from `backend/`): `python -m app.vision.sample_media.check_ladder | check_frames | check_realism | export_ladder | make_loop`
- Poster: `node scripts/capture-poster-shots.mjs` then `node scripts/render-poster.mjs phone|landscape` (needs Chrome and the dev servers; fonts load once from Google Fonts)

## Poster

`docs/product/preliminary-round/poster/poster.html` is 1080 px wide and about 9100 px tall (a phone scroll poster); the render is `FloodWay_Poster_Phone.png`. A 1920 x 1080 landscape version (`poster-landscape.html` to `FloodWay_Poster_1920x1080.png`) shares the same assets and content, trimmed to fit. Content comes from the pitch deck (`docs/product/pitch/FloodWay Five42 Slide Deck.pdf`) with the 3D twin replaced by Live Vision; the footer says which parts are designed, not built. Refresh after the media fix: start both dev servers, then `node scripts/capture-poster-shots.mjs` (writes `assets/{home,live,map}-phone.jpg`) and `node scripts/render-poster.mjs`.

## Honesty ledger (one glance)

Real: camera pipeline, user cameras and photo upload, alerts, restart recovery, OSM road routes. Simulated: sample cameras and frames, rainfall and river numbers, forecast, shelters, flood-prone areas, reports. Not built or not claimed: government camera feeds, agency verification, any Huawei Cloud call, field-validated accuracy. Full table: `docs/ops/DEMO_RUNBOOK.md` section 1.

## Change log (newest first; one line each)

- 2026-10-12 · Public demo & preliminary pack: scripts/public-demo.ps1 (laptop backend via Cloudflare tunnel, wrangler pages deploy), preliminary-round pack, booth motion film, Dockerfile. Check: frontend 120 tests + build, backend 130 passed.
- 2026-10-12 · Media V2 wired (Claude, Part 2): `nearest_rung` ladder source; `ReferenceDiffAnalyzer` per sample camera (`waterline.py` gained `row_fraction` and `gap_rows`, defaults unchanged); zones re-fitted in `calibration.json`; overlays off by default; `make_water.py` moved to `docs/_to-delete/retired-code/`; `check.ps1` prefers the backend venv; master PNGs gitignored. Backend +10 tests, frontend +1.
- 2026-10-12 · Live Vision Media V2 Part 1 (Gemini): 60 photorealistic master PNGs (1280x720), 80 JPEGs, 81 WebPs, klang-rise.mp4 loop (353 KB), check_realism 0/15 flagged, verification contact sheets and screenshots. Ready for Claude Part 2.
- 2026-10-12 · Restructured docs into `ai/ architecture/ product/ ops/ plans/ reference/`; moved superseded docs and duplicates to `docs/_to-delete/`; added AGENTS.md, this file, `models/README.md`; wrote the Gemini media plan V2 with `check_ladder.py`, `export_ladder.py`, `make_loop.py` (`check_ladder` fails the old 4-photo set as designed: 5 to 8 of 12 rungs read right); rebuilt the poster phone-first.
- 2026-10-12 · Live UI upgrade (Plan C, executed): upload, iPhone UI, logo, procedural water frames, poster v1, pitch script. Detail in `docs/ai/CHANGELOG.md`.
- 2026-10-11 · Plan B (demo polish): map overhaul, seed from sample media, header at 360 px, write-token protection, Telegram token out of the browser.
