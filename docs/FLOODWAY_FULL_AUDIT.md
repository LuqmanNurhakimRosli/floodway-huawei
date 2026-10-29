# FloodWay full audit

**Date:** 2026-10-19 · **Branch:** `ccr-693c90f8-qu560k` · **Scope:** web app (`frontend/`), backend (`backend/`), new Android app (`mobile/`)

This audit records what was checked, what was found, and what state each finding is in now. Fixes are recorded in
`docs/ai/PROGRESS.md` (change log, 2026-10-19); the commands and their output are in `FLOODWAY_TEST_REPORT.md`.

## 1. How the audit was done

| Method | What it covers |
|---|---|
| Baseline checks | `npm run check` (tsc, vitest, build) and `pytest -q`, before any change |
| Route audit (`frontend/scripts/route-audit.mjs`, new) | Every route at 9 viewports (320x640 to 1920x1080) in headless Chromium: uncaught errors, console errors, failed requests split into the app's own and outside hosts, HTTP errors from the app's own server, horizontal scroll, broken images, blank pages, touch targets under 44x44 px on phones |
| Code reading | Each backend route that writes state, the API client, auth and storage code, map and routing code |
| Forced failure | A malformed saved profile in `localStorage`, to see whether one bad value can take the app down (it could) |
| Bundle measurement | `vite build` before and after, same machine |

### Limits of this environment

- The sandbox network policy blocks every outside host except the npm registry. Map tiles (CARTO, OpenStreetMap),
  openrouter.ai (the AI photo check), dl.google.com (Android SDK) and api.expo.dev (EAS builds) could not be reached.
  Results that depend on them are marked **Blocked**, not passed.
- No Android SDK, emulator or phone is available, so the Android app was **not run on a device**. See section 4.

## 2. Baseline

| Check | Result before changes |
|---|---|
| Frontend tsc + vitest + build | Passed, 167 tests |
| Backend pytest | Passed, 148 tests |
| Route audit (12 routes x 9 sizes) | 108 loads, 5 marked failing. All 5 were map-tile images from blocked outside hosts that the first version of the script counted as broken; the script now reports outside images apart. No runtime errors. 8 touch targets under 44 px on Home at every phone width, more on Map (markers 38-40 px) and Reports |
| Main JS chunk | 782.8 kB (229.9 kB gzip): every page, including the three.js studio code paths, loaded up front |

## 3. Findings

Severity: **High** can take the app down or let someone change state they should not. **Medium** misleads the user
or breaks a feature. **Low** is cost or polish. **Info** is a fact a reviewer must know, not a defect.

### 3.1 Fixed

| # | Sev | Finding | Evidence | Status |
|---|---|---|---|---|
| F1 | High | No error boundary: an exception in any screen blanked the whole app | No boundary in `App.tsx`; the F2 crash blanked every route | Fixed: boundary per route, resets on navigation; WebGL check for `/studio` |
| F2 | High | A malformed saved profile (`floodway_user` in localStorage) crashed every screen on load | Forced with a saved profile whose fields were not strings; every route went blank | Fixed: profile used only when `name` and `email` are strings, else the demo profile. Re-tested with 3 bad values: no crash |
| F3 | High | `POST /api/v1/telemetry/ingest` accepted unsigned readings without the write token. A reading can drive the simulated underpass barrier to close. `MAX_SKEW_SECONDS` was defined but never checked, so a captured signed reading could be replayed | Code reading of `routes/telemetry.py` | Fixed: a signature must be valid and within 120 s, or the request needs the write token. 4 tests |
| F4 | Medium | `POST /api/v1/predict` took unbounded numbers | Code reading | Fixed: level 0-20 m, rainfall 0-500 mm, 422 otherwise |
| F5 | Medium | Header bell did nothing and always showed an unread dot | Code reading: no handler, dot hard-coded | Fixed: opens Live Vision alerts; dot only for alerts in the last hour |
| F6 | Medium | Report "Share" button did nothing | Code reading: no handler | Fixed: system share sheet, else copy to clipboard, with a status message |
| F7 | Medium | Leaflet CSS loaded from unpkg.com on every page: a third-party dependency and a broken map when offline | Request log | Fixed: bundled from the installed package |
| F8 | Medium | Vision API calls had no timeout; a hung server left screens loading forever | Code reading of `visionApi.ts` | Fixed: 12 s default, 30-60 s for uploads, analysis and storm-lab runs |
| F9 | Medium | Touch targets under 44 px on phones (Home, Map markers, Reports tabs and buttons, bottom-sheet handle, turn-by-turn exit) | Route audit | Fixed: 0 small targets in 117 loads |
| F10 | Low | Main JS chunk 782.8 kB | `vite build` | Fixed: pages load on demand, main chunk 529.7 kB (165.9 kB gzip). The 3D studio chunk (921.7 kB) loads only on `/studio` |

### 3.2 Open (not fixed in this pass, with the reason)

| # | Sev | Finding | Why open / what is needed |
|---|---|---|---|
| O1 | High (deploy) | `require_write_token` allows every write when `VISION_WRITE_TOKEN` is unset, which is the default for local development | Intended for a laptop demo. Any public deployment must set the variable. `scripts/public-demo.ps1` already does |
| O2 | Medium | Demo device secrets for HMAC signing are written in `backend/app/config.py` (`fw-secret-2026` and two more). The repository is public, so those signatures prove nothing | Move device secrets to environment variables before any real sensor is connected. Not changed here because the firmware sketches and tests use the same values |
| O3 | Medium (deploy) | CORS defaults to `*` (`CORS_ORIGINS` env) | Set `CORS_ORIGINS` to the frontend origin in deployment |
| O4 | Medium | The OpenRouter key was once in the browser bundle (`VITE_OPENROUTER_API_KEY`), and keys were pasted into chat sessions | Owner must revoke and rotate them. No key is in the repository or in these docs |
| O5 | Info | The forecast is a rule-based formula (`services/forecaster.py`), not a trained model. The GRU in `models/ml_pipeline` is trained on synthetic data and nothing loads it | Do not present the forecast as machine learning |
| O6 | Info | Evacuation routes are stored OpenStreetMap routes. "Avoids flooding" is judged only against flood areas the app knows (camera zones, verified reports, simulated barriers, demo areas), not live road closures | Say so in demos; the map tells users their maps app does not know where floods are |
| O7 | Blocked | The AI photo check was not exercised end to end: openrouter.ai is blocked here. The no-key and failure paths were exercised and say so honestly | Run once on a machine with network access |
| O8 | Info | Telegram alerts return `sent: false, simulated: true` when the bot is not configured, and the UI shows that. Verified in `routes/alerts.py` | None |
| O9 | Low | The backend does not send `createdAt` on reports, so the age fade for verified areas uses parsed display times | Add `createdAt` to the reports route |
| O10 | Info | The family circle on the web map is simulated except "You". There is no account or location-sharing backend | Mobile app shows nobody else and says why |
| O11 | Low | The HouseStudio360 chunk is 921.7 kB | Loads only on `/studio`; acceptable for a demo |

## 4. Android app (new) audit

| Item | State |
|---|---|
| TypeScript (strict) | Clean (`npx tsc --noEmit`) |
| Unit tests | 16 of 16 pass (cache and freshness, server URL, contacts, alert notifications, flood zones and risk) |
| Metro Android bundle | Builds: 1273 modules, 3.0 MB Hermes bytecode, including the shared web modules |
| Native project (`expo prebuild`) | Generates. Manifest checked: coarse and fine location, notifications, internet; background location, overlay and legacy storage permissions removed |
| Screens rendered | All six screens rendered without errors through react-native-web against the local backend (a smoke test only; the WebView map cannot run on web) |
| Map page | Leaflet page tested in Chromium: draws zones and centres, falls back to offline roads when tiles fail, posts ready, basemap and tap messages, writes labels as text |
| APK / AAB | **Not built.** No Android SDK; dl.google.com and api.expo.dev are blocked. Build configuration is in place (`eas.json`, `app.config.js`); steps in `FLOODWAY_MOBILE_SETUP.md` |
| On-device test | **Not done.** Location prompt, notifications, WebView map, share sheet and calls need a phone or emulator |

## 5. Honesty check

- Sample cameras and frames are labelled "Sample camera(s)" on web and mobile. No screen calls them live or official.
- Demo flood-prone areas are drawn dashed and labelled illustrative. Mobile "your risk" ignores them.
- Relief centres are labelled as a demo list, not an official register.
- Cached data always shows its age ("Saved 3 h ago, not live").
- No agency names or logos were added. No accuracy number was added.
