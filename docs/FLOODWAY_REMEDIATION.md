# FloodWay remediation log

What was changed for each finding in `FLOODWAY_FULL_AUDIT.md`, where, and how it was checked. Commits on branch
`ccr-693c90f8-qu560k`: `dad81a2` (web and backend fixes), `5ff2ba3` (Android app and shared level rules), and the
cleartext commit after it.

## Fixed

### F1 · Error boundary
- `frontend/src/components/common/ErrorBoundary.tsx` (new): catches a crash in one screen and shows "This screen
  stopped working" with Try again, Go to Home and a 999 reminder. `hasWebGL()` checks for a WebGL context.
- `frontend/src/App.tsx`: one boundary around the routes, keyed on the path so moving to another screen clears it. The
  3D studio has its own boundary and a plain message when WebGL is missing.
- Checked: forced crash (F2) showed the boundary instead of a white page; route audit 0 page errors.

### F2 · Malformed saved profile
- `frontend/src/contexts/AuthContext.tsx`: the saved profile is used only when `name` and `email` are strings; anything
  else (bad JSON, wrong types) falls back to the demo profile.
- Checked in Chromium with three bad values (`{"name":1,"email":null}`, `not json`, `[]`): `/home` loads, 0 page
  errors, error screen not shown.

### F3 · Unsigned telemetry
- `backend/app/routes/telemetry.py`: `/ingest` reads the `Authorization` header. A signed reading must come from a
  device that has a secret, the signature must match, and `|now - ts|` must be within `MAX_SKEW_SECONDS` (120).
  An unsigned reading needs `require_write_token`.
- `backend/tests/test_ingest_auth.py` (new, 4 tests): a signed reading is accepted, an unsigned one needs the write
  token when one is set, a wrong or stale signature is refused, and `/predict` rejects out-of-range input (F4).
- Guard rails kept: no vision threshold changed; the write-token dependency is the same one the other routes use.

### F4 · Bounded forecast inputs
- `backend/app/routes/predict.py`: Pydantic field bounds (water level 0-20 m, rainfall 0-500 mm/h). Out-of-range
  input gets 422 instead of a confident-looking forecast.

### F5 · Header bell
- `frontend/src/components/layout/Header.tsx`: a link to `/live`; the red dot shows only when an alert is under one hour
  old (`useVisionStore` alerts, `useNow(60000)`).

### F6 · Report Share
- `frontend/src/components/reports/ReportFeed.tsx`: `navigator.share` when available, else copies the text, and says
  which happened (or that neither worked).

### F7 · Leaflet CSS
- `frontend/index.html`: unpkg link removed. `frontend/src/main.tsx`: `import 'leaflet/dist/leaflet.css'`.

### F8 · API timeouts
- `frontend/src/services/vision/visionApi.ts`: `request()` takes `timeoutMs` (default 12 000) through
  `AbortSignal.timeout`. Camera create, analyse and test 30 s; upload 60 s; preview 30 s; storm-lab run 60 s.

### F9 · Touch targets
- `min-h-11` (44 px) on Report page header buttons, filter tabs and mode switcher, report confirmations, Home "View all"
  links and filter pills, the map scenario chip, the turn-by-turn exit button; bottom-sheet handle `h-11`.
- Map markers: 44 px hit area around the drawn pin (`mapIcons.ts`, `BarrierLayer.tsx`). Home overview map markers are
  `interactive={false}` because that map is a picture, not a control.
- Checked: route audit 0 targets under 44 px at 320, 360, 390 and 430 px widths.

### F10 · First download
- `frontend/src/App.tsx`: Map, Live Vision, Reports, Navigation, Profile, Control Room and the 3D studio load with
  `React.lazy` behind a loading state. Welcome and Home stay in the main chunk.
- Measured: 782.8 kB → 529.7 kB (gzip 229.9 → 165.9 kB).

### Shared level rules (for the Android app)
- `frontend/src/lib/vision/levelRules.ts` (new): `LEVELS`, `levelRank`, `isAlertLevel`, `LEVEL_PALETTE`,
  `SAMPLE_THRESHOLDS`, `ratioToLevel`, with no icon library import. `levels.ts` re-exports them and keeps the
  lucide icons. Values unchanged (thresholds are a guard rail).

## Added: Android app (`mobile/`)

Details in `FLOODWAY_ARCHITECTURE.md` and `FLOODWAY_MOBILE_SETUP.md`. Safety-relevant choices:
- Location is asked for only when the user taps "Use my location", foreground only.
  `ACCESS_BACKGROUND_LOCATION` is removed from the manifest; so are overlay and legacy storage permissions.
- Every reading shows whether it is live or saved, and how old it is.
- Demo flood-prone areas never count towards "your risk".
- Family screen sends your location only through the share sheet, each time, and shows nobody else.
- Notifications are local, only while the app runs, and the Alerts screen says so.
- Plain `http://` allowed in development and preview builds (LAN demo backend), not in the production app bundle
  (`mobile/app.config.js`; verified in both generated manifests).

## Not fixed: recommended next steps

| # | Recommended fix | Effort |
|---|---|---|
| O1 | Fail start-up when `ENV=production` and `VISION_WRITE_TOKEN` is unset | Small |
| O2 | Read device secrets from env (`FW_DEVICE_SECRETS` JSON), keep the demo values only for tests | Small; firmware sketches need the new secret |
| O3 | Set `CORS_ORIGINS` in the deploy script and Dockerfile docs | Small |
| O4 | Revoke and rotate the OpenRouter key and the Telegram bot token | Owner only |
| O7 | Run the AI photo check once with network access and record the result | Small |
| O9 | Send `createdAt` (ISO) from `/api/v1/reports` | Small |
| O10 | Accounts and opt-in location sharing for the family map (server, auth, retention rules) | Large |
| Mobile | Build the preview APK and test on a phone (location, notifications, map, share, call) | Needs SDK or EAS |
| Mobile | Push notifications to a closed app (FCM credentials, a server-side sender) | Medium |
