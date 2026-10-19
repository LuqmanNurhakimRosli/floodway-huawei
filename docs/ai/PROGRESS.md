# PROGRESS: the anchor file for every AI agent

Read this before you change anything. Update it before you stop (rules in `/AGENTS.md`). Keep it short: detail goes in `docs/ai/CHANGELOG.md`.

**Last updated:** 2026-10-19 · **Branch:** `ccr-693c90f8-qu560k` · **Checks:** frontend 167 tests + tsc + build, backend 152 passed, mobile tsc + 16 jest tests (npm run check; pytest -q; mobile npm run check)

## Status board

| Area | State | Notes |
|---|---|---|
| Live Vision page `/live` | Done | iPhone-style phone UI, one countdown, photo upload (`POST /cameras/upload`), 11-viewport check clean |
| Underpass barrier loop | Done 2026-10-18 (simulated barriers) | `vision/barriers.py`: DANGER from a linked camera or depth node closes, ADVISORY or below reopens, operator override, event log, WebSocket push. B-01 follows the Klang sample camera, B-02 follows street depth node fw-node-03. Routing lists blocked routes last (`lib/routing.ts`). Bench servo: `firmware/floodway_barrier.ino`. No real barrier is connected |
| Sensor fault filter + lead-time log | Done 2026-10-18 | `vision/fault_filter.py` holds a jump larger than water can rise until the next reading agrees (also on `/ingest`). Alerts carry `detection_delay_s`; `GET /lead-times`. No threshold in `levels.py` changed |
| Storm lab | Done 2026-10-18 | `vision/storm_lab.py`: scripted synthetic storms replayed in simulated time through the live analyser, filter, tracker and barrier rules, filter on and off. Recorded copy for offline use: `frontend/src/data/stormLabRecorded.json`. Timing behaviour only, not field accuracy |
| Depth from photo + evidence check | Done 2026-10-18 | Report flow rebuilt (`ReportModal.tsx`): landmark or tap-to-measure depth gives a range (`lib/depthFromPhoto.ts`), compared with the nearest camera, depth node and the AI opinion. No verdict; a person still reviews |
| Control room `/control` | Done 2026-10-18 | Barriers, log, fault filter health, storm lab, live alert timing |
| PENYU robot concept | Concept only, outside the app | Shared as a standalone 3D artifact on request (not in the app). Labelled CONCEPT · NOT BUILT; all numbers are design targets |
| Live AI photo check | Blocked here | The cloud sandbox network policy refuses openrouter.ai, so the AI check could not be exercised end to end in this session. The no-key and failure paths were exercised and say so honestly |
| Basemap failover | Done 2026-10-19 | `components/map/BaseMap.tsx`: CARTO Voyager, then OpenStreetMap, then an offline street map drawn from the stored routes with place names (re-probes tiles every minute). Fonts are bundled with @fontsource instead of Google Fonts |
| App demo film | Done 2026-10-19 | `booth/floodway-app-demo/`: 1:56 walkthrough of every feature on a phone, real app captures with motion graphics and a generated score. Rebuild steps in its README; the MP4 is not committed (booth `out/` is ignored) |
| Map and evacuation | Done | KL only: 8 demo relief centres, 16 flood-prone areas, stored OSM routes (`node frontend/scripts/build_kl_routes.mjs` to rebuild) |
| Sample media | Done 2026-10-12 | 60 photographic frames (5 cameras x 12-rung ladder); the page shows the rung matching the reading. Read by `ReferenceDiffAnalyzer` against each camera's dry frame; `check_ladder` PASS (4 cameras 12 of 12, drain 11 of 12). Details and limits: `backend/app/vision/sample_media/README.md` |
| Feed overlays | Done | Photo shows clean by default (lines and waterline); the Zone and Water toggles remain |
| Poster (advisor edits) + PowerPoint | Done 2026-10-12 | Dr Azliza's edits: UiTM, 7 Dekad UiTM and Huawei logos in the header; the prototype footer removed (benchmark source moved into the Proof card); a Huawei technology block (ModelArts, OBS, ECS, SMN) in the centre Solution card. Editable one-slide `poster/FloodWay_Poster_1920x1080.pptx` (174 native shapes, text and pictures) built by `node scripts/poster-to-pptx.mjs`; checked by rendering in PowerPoint. Needs Outfit and Inter fonts (installed per-user on this laptop; Canva has both) |
| Preliminary round pack | Done 2026-10-12 | `docs/product/preliminary-round/`: `MEETING_SUMMARY.pdf` (and `.md`), `PITCH_SCRIPT.md` (three speakers, about 4:30), `poster/FloodWay_Poster_1920x1080.png` (one slide: Problem, Solution, Impact; QR to the live demo), `transcript/` |
| Motion film | Done 2026-10-12 | `booth/floodway-live-film/`: 45 s, 1920x1080, 30 fps. `out/floodway-live-vision-sound.mp4` (with procedural score) and the silent master. Hook, gap, Live Vision (real ladder frames, number and level in sync), safe route, phone alert, impact, brand + QR. Rebuild steps in its README |
| Sample photos on the public page | Done 2026-10-12 | With no backend running, the Live page now shows each sample camera's photo for its water level (`lib/vision/samplePhoto.ts`), instead of the old drawn scene. Pushed to GitHub `live-ui-upgrade` (`295482a`) and deployed to Cloudflare Pages production with no backend address. Checked on the public `/live`: Klang shows the new frame at 61%. |
| Live demo on Cloudflare | **Live 2026-10-12 (laptop-hosted)** | `powershell -File scripts/public-demo.ps1` starts a read-only public backend on this laptop (port 8090, no Telegram, own data folder, write token in `%LOCALAPPDATA%\floodway-public\write-token.txt`), opens a Cloudflare quick tunnel, rebuilds the frontend with that address and deploys it to `floodway-huawei.pages.dev`. Verified: /live shows "Live 5/6 online" with the new frames. The laptop must stay on; every restart gives a new tunnel address, so re-run the script (`-Stop` to stop). Earlier note, kept for history: | `https://floodway-huawei.pages.dev` serves a 2-week-old build with no backend (it calls `localhost:8080`). Newer `main` builds on Cloudflare fail. Ready: `backend/Dockerfile` + `.dockerignore`, `CORS_ORIGINS` env, production frontend build (secrets blanked, verified out of the bundle). Needs: a hosting account, then the backend URL. The QR on the poster points here |
| Forecast | Rule-based | `backend/app/services/forecaster.py` is a formula and says so. `models/ml_pipeline` holds a synthetic-data GRU that nothing loads |
| Huawei Cloud | Designed, not called | ModelArts package prepared in `models/ml_pipeline/modelarts_pkg`; nothing deployed |
| Brand and visual design | Done 2026-10-18 (blue again) | Original logo blue restored app-wide (accent #1677FF, filled #0958D9, dark #003EB3, sidebar #071426, page #F4F7FB); the short teal refresh is gone. 20px cards, Outfit headings, Plus Jakarta Sans body. Home: greeting + search, family card (`FamilyCard`), Near you carousel, relief list. Profile rebuilt as a settings list (personal info, family circle and location, emergency contacts, Telegram, operator token, log out) |
| Family circle (Life360-style) | Done 2026-10-18 (simulated members) | `/map` is now a full-screen family map on phones: circle switcher (Family, Neighbours), member pins with battery and flood status, Check in, hold-to-send SOS (Telegram via the backend when set up), activity feed, places with arrival/leave alerts, Safety tab (in or within 300 m of a flood area), Route tab = the evacuation planner, for you or for a member. Only "You" can be real (phone GPS, opt-in, never uploaded); everyone else, their movement and replies are simulated and labelled. `lib/family.ts`, `services/family/familyStore.ts`, `hooks/useFamily.ts`, `components/family/`. Flood scenario moved to AppContext so Home and the map agree |
| Welcome animation | Done 2026-10-18 | `components/brand/EvacuationLoop.tsx`: 8 s seamless SVG loop (rain, rising water, a family walking the safe route to a relief centre, alert and arrival chips). Drawn shapes only, no flood photos. Reduced motion shows one still frame |
| Verified-report areas | Done 2026-10-19 (demo data) | Circles from verified reports on the map; routing, the Safety tab and Home avoid them (`useFloodZones`). Last 6 h only, fading after 1 h; AI-assessed reports named in the label. Backend does not send `createdAt` yet |
| Phone touch targets | Done 2026-10-19 | Route audit: 0 targets under 44 px on 13 routes at 4 phone widths |
| Route audit + audit fixes | Done 2026-10-19 | `frontend/scripts/route-audit.mjs` (13 routes x 9 viewports, 117 loads, 0 failing). Fixed: error boundary per route, malformed saved profile crash, inert bell and Share, unpkg Leaflet CSS, API timeouts, lazy pages (main chunk 782.8 -> 529.7 kB), `/ingest` signature + skew check, `/predict` bounds. Full list: `docs/FLOODWAY_FULL_AUDIT.md` |
| Android app `mobile/` | Code done 2026-10-19 · **no APK yet, not run on a device** | Expo 58 / RN 0.88: Home, Map (Leaflet WebView, offline roads), Family (share location, contacts), Alerts (local notifications while open), Guide, Settings (server URL). Reuses web logic via `src/shared.ts`. Offline cache marked with its age; location opt-in, foreground only. tsc clean, 16 jest tests, Android bundle builds, prebuild manifest checked. APK blocked here (no Android SDK; dl.google.com and api.expo.dev refused). Steps: `docs/FLOODWAY_MOBILE_SETUP.md` |

## Open work, in order

1. User: re-deploy the frontend with `VITE_API_BASE` set to a hosted backend (or accept a sample-only demo on the QR link), then check the pages URL. Confirm the one-slide rule and team requirements by email (see `docs/product/preliminary-round/MEETING_SUMMARY.md`).
2. User: restart the backend on :8080. The running one predates the analyser change and still reports `classical-v1` for the sample cameras.
2. A learned water segmenter for user-added cameras: the classical analyser cannot read photographic water (see `sample_media/README.md`). Needs labelled frames and `analysis/yolo_seg.py`.
3. User: delete `docs/_to-delete/` once happy (it holds the superseded docs, duplicate `assets/` and duplicate model folders; all are also in git history or were byte-identical copies).
4. User: rotate the OpenRouter key (`VITE_OPENROUTER_API_KEY` was in the browser bundle) and the Telegram bot token. Neither was rotated by an agent.
5. Android: build the preview APK (`npx eas-cli build -p android --profile preview`, after setting the backend in `mobile/eas.json`) and run the device checklist in `docs/FLOODWAY_MOBILE_SETUP.md` section 6. Record the results in `docs/FLOODWAY_TEST_REPORT.md`.
6. Before any public deploy: set `VISION_WRITE_TOKEN` and `CORS_ORIGINS`; move device HMAC secrets out of `backend/app/config.py` (audit O1-O3).

## File map (where things live)

```
AGENTS.md  CLAUDE.md            agent rules (CLAUDE.md just imports AGENTS.md)
README.md                       public readme
backend/app/vision/             Live Vision: engine, analysis/ (classical, waterline), levels.py, seed.py, sources/, sample_media/,
                                fault_filter.py, barriers.py, storm_lab.py
backend/app/routes, services/   reports, alerts, SOS, forecast (rule-based), twin
backend/tests/                  pytest
frontend/src/pages, components/ React pages; components/live/ is Live Vision; components/control/ is the control room;
                                components/family/ is the family map (pins, tabs, SOS, check-in); components/brand/ is the logo
                                and the Welcome animation; lib/family.ts + services/family/ hold the family circle
frontend/public/media/live/     webp copies of the sample frames, klang-rise.mp4
frontend/scripts/               layout-check.mjs, route-audit.mjs, map-fps.mjs, build_kl_routes.mjs
mobile/                         Android app (Expo): src/app/ screens (expo-router), src/lib/ api, cache, data, location, notify,
                                zones; src/map/ Leaflet WebView page (+ generated assets); src/shared.ts = code from frontend/src;
                                app.json, app.config.js, eas.json build config
models/ml_pipeline/             GRU forecaster code, notebooks nb1-nb4, trained weights (synthetic), ModelArts package
models/legacy_ann/              first Keras ANN on the Malaysia rainfall CSV (datasets/)
scripts/                        check.ps1, public-demo.ps1, public_backend.py, render-poster.mjs, make_og_image.py, generate_image.py
docs/ai/                        this file, CHANGELOG.md (detail)
docs/FLOODWAY_*.md              2026-10-19 audit set: FULL_AUDIT, REMEDIATION, ARCHITECTURE, MOBILE_SETUP, TEST_REPORT
docs/architecture/              system spec, API, DB, IoT, tech stack, conventions (some FYP-era: verify before trusting)
docs/product/                   preliminary-round/ (poster, pitch script, meeting summary, transcript), pitch deck PDFs
docs/ops/                       DEMO_RUNBOOK.md (what is real, simulated, not built; demo script; failure table)
docs/plans/                     active plans only
docs/reference/                 competition rules and forms, 3D house reference
docs/screenshots/               evidence (after-c = latest, media-check = media plan, mobile-2026-10-19 = Android app renders)
booth/                          film project (floodway-live-film/), MATA48 booth assets
firmware/                       ESP32 depth node sketch, ESP32 bench barrier sketch (floodway_barrier.ino)
docs/_to-delete/                quarantine, safe to remove
```

## Run and check

- All checks: `powershell -File scripts/check.ps1`
- Backend: `cd backend; .venv\Scripts\python.exe run.py` (port 8080) · tests: `.venv\Scripts\python.exe -m pytest -q`
- Frontend: `cd frontend; npm run dev` (5173) · `npm run check` · `npm run layout-check`
- Mobile: `cd mobile; npm install; npm run check` · `npx expo start` (press a for the emulator) · APK steps in `docs/FLOODWAY_MOBILE_SETUP.md`
- Route audit: dev servers running, then `cd frontend; node scripts/route-audit.mjs` (`CHROME_PATH=` when Chrome is not installed)
- Media scripts (from `backend/`): `python -m app.vision.sample_media.check_ladder | check_frames | check_realism | export_ladder | make_loop`
- Poster: `node scripts/capture-poster-shots.mjs` then `node scripts/render-poster.mjs phone|landscape`, then `node scripts/poster-to-pptx.mjs` for the editable PowerPoint (first time: `cd scripts/pptx-tool && npm install`) (needs Chrome and the dev servers; fonts load once from Google Fonts)

## Poster

`docs/product/preliminary-round/poster/poster.html` is 1080 px wide and about 9100 px tall (a phone scroll poster); the render is `FloodWay_Poster_Phone.png`. A 1920 x 1080 landscape version (`poster-landscape.html` to `FloodWay_Poster_1920x1080.png`) shares the same assets and content, trimmed to fit. Content comes from the pitch deck (`docs/product/pitch/FloodWay Five42 Slide Deck.pdf`) with the 3D twin replaced by Live Vision; the footer says which parts are designed, not built. Refresh after the media fix: start both dev servers, then `node scripts/capture-poster-shots.mjs` (writes `assets/{home,live,map}-phone.jpg`) and `node scripts/render-poster.mjs`.

## Honesty ledger (one glance)

Real: camera pipeline, user cameras and photo upload, alerts, restart recovery, OSM road routes. Simulated: sample cameras and frames, rainfall and river numbers, forecast, shelters, flood-prone areas, reports. Not built or not claimed: government camera feeds, agency verification, any Huawei Cloud call, field-validated accuracy. Full table: `docs/ops/DEMO_RUNBOOK.md` section 1.

## Change log (newest first; one line each)

- 2026-10-19 · Android app in `mobile/` (Expo 58, RN 0.88, TypeScript strict) sharing UI-free web logic (`lib/vision/levelRules.ts` split out of `levels.ts`); preview builds allow http to a LAN backend, production https only; `scripts/check.ps1` runs the mobile check; five audit docs `docs/FLOODWAY_*.md`. Check: frontend 167 tests + tsc + build, backend 152 passed, mobile tsc + 16/16 jest, Android bundle 1273 modules, route audit 117/0. No APK: no Android SDK and build hosts blocked.
- 2026-10-19 · Audit fixes (commit dad81a2): route-audit.mjs, ErrorBoundary + WebGL check, profile validation, live bell and Share, bundled Leaflet CSS, API timeouts, 44 px targets, lazy pages, `/ingest` signature + skew, `/predict` bounds (test_ingest_auth.py). Check: frontend 167 tests + tsc + build, backend 152 passed, route audit 117 loads 0 failing.

- 2026-10-19 · Map never blank: BaseMap provider chain + offline street map, zoom-aware labels; fonts self-hosted (@fontsource, Google Fonts link removed); duplicate pin CSS removed; mapConfig test. App demo film (booth/floodway-app-demo: capture.mjs, film.html, render.mjs, make_audio.py). Check: frontend 167 tests + tsc + build, backend 148 passed, layout check clean on 7 routes x 4 sizes. Live AI check still not run: the sandbox blocks openrouter.ai.
- 2026-10-19 · Verified-report areas now drive routing and safety (useFloodZones), fade with age (reports gain createdAt; reportTime parses older strings; 6 h window, fading after 1 h), and label AI-assessed reports. Files: lib/verifiedReports.ts, VerifiedReportLayer, MapPanel, useFamily, mappers, api seed, ReportModal, types. Check: frontend 165 tests + tsc + build; layout check clean on /map /home at 3 sizes.
- 2026-10-19 · Verified-report areas on the map (lib/verifiedReports.ts, components/map/VerifiedReportLayer.tsx): circles from verified reports sized by independent reporters and depth (500 m to 5 km), shaded by reporter count, labelled with count, depth and radius; unverified reports are grey pins only. Removed "prototype"/"mock" wording from three labels (kept demo/sample/simulated). Handover in docs/ai/HANDOVER.md. Check: frontend 161 tests + tsc + build.
- 2026-10-18 · Blue brand back (reverse of the teal swap); Life360-style family map on /map (family circle, check-in, SOS, places, safety, activity, route tab), FamilyCard on Home, Profile as a settings list, animated Welcome (EvacuationLoop, no photos); legend moved into the Layers sheet; InPageActionDock removed; layout-check takes CHROME_PATH. Files: lib/family.ts, data/familyDemo.ts, services/family/familyStore.ts, hooks/useFamily.ts, components/family/*, ShelterMapView, MapPanel, BottomSheet, MapLegend, WelcomePage, ProfileSettings, AppContext, telegramService, index.css. Check: frontend 152 tests + tsc + build; layout check clean on / /home /map /reports /live /profile /control at 4-5 sizes.
- 2026-10-18 · Upgrade: underpass barrier loop (barriers.py, BarrierLayer, routing blocks closed barriers, /control), sensor fault filter + lead-time log (fault_filter.py, /lead-times), storm lab (storm_lab.py, recorded JSON), depth from photo + evidence check (ReportModal, DepthFromPhoto, EvidenceCheck, depthFromPhoto.ts), bench barrier firmware, POST /reports guarded by the write token. Check: frontend 144 tests + build, backend 148 passed; layout check clean on /control /reports /live /map /home at 5 sizes.
- 2026-10-18 · Visual refresh to a deep teal, travel-app style (reference supplied by the user): tokens, fonts, BottomNav, HomePage + HomeGreeting/NearYou/ReliefList, WelcomePage; CameraStatusRow removed. Check: frontend 144 tests + build; layout check clean on /home /map /reports /live /control /profile at 4 sizes.
- 2026-10-18 · PENYU robot concept removed from the app (page, route, nav) and shared as a standalone 3D artifact instead, at the user's request.
- 2026-10-17 · System documentation (published artifact, not a repo file): problem, architecture, AI/ML map, IPO, workflows, API, honesty ledger, claims to correct. Checked against code: no A* or Firestore code, GRU not imported, report POST has no write token, skew limit not enforced. Repo checks not re-run (no backend venv here).
- 2026-10-12 · Public demo & preliminary pack: scripts/public-demo.ps1 (laptop backend via Cloudflare tunnel, wrangler pages deploy), preliminary-round pack, booth motion film, Dockerfile. Check: frontend 120 tests + build, backend 130 passed.
- 2026-10-12 · Media V2 wired (Claude, Part 2): `nearest_rung` ladder source; `ReferenceDiffAnalyzer` per sample camera (`waterline.py` gained `row_fraction` and `gap_rows`, defaults unchanged); zones re-fitted in `calibration.json`; overlays off by default; `make_water.py` moved to `docs/_to-delete/retired-code/`; `check.ps1` prefers the backend venv; master PNGs gitignored. Backend +10 tests, frontend +1.
- 2026-10-12 · Live Vision Media V2 Part 1 (Gemini): 60 photorealistic master PNGs (1280x720), 80 JPEGs, 81 WebPs, klang-rise.mp4 loop (353 KB), check_realism 0/15 flagged, verification contact sheets and screenshots. Ready for Claude Part 2.
- 2026-10-12 · Restructured docs into `ai/ architecture/ product/ ops/ plans/ reference/`; moved superseded docs and duplicates to `docs/_to-delete/`; added AGENTS.md, this file, `models/README.md`; wrote the Gemini media plan V2 with `check_ladder.py`, `export_ladder.py`, `make_loop.py` (`check_ladder` fails the old 4-photo set as designed: 5 to 8 of 12 rungs read right); rebuilt the poster phone-first.
- 2026-10-12 · Live UI upgrade (Plan C, executed): upload, iPhone UI, logo, procedural water frames, poster v1, pitch script. Detail in `docs/ai/CHANGELOG.md`.
- 2026-10-11 · Plan B (demo polish): map overhaul, seed from sample media, header at 360 px, write-token protection, Telegram token out of the browser.
