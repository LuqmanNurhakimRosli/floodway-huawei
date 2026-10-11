# FloodWay demo audit (pre-final, 2026-10-11)

Branch: `demo-polish` (from `live-vision-polish`). Read-only audit. No app source changed.

## Method and honest limits

- **Tool used:** Playwright driving the installed Chrome (the chrome-devtools MCP and Claude in Chrome were not
  attached in this session). Both servers responded: backend `:8080`, frontend `:5173`.
- **Crawl (done):** every route in `App.tsx` at 1440×900, 1024×768 and 390×844 (`/`, `/home`, `/map`, `/reports`,
  `/live`, `/profile`, `/studio`). Screenshots in `docs/screenshots/demo-before/` and `crawl.json` alongside.
  Recorded: `NaN` / `undefined` / `null` text, console errors, failed requests, horizontal overflow, text under 12px,
  and whether the page loaded. **The basemap watermark is not detected by the script** (it is drawn into the tile images,
  so `crawl.json` reports `apiKey: false` even when it is visible). Watermark findings were confirmed by looking at the
  screenshots.
- **Not done:** I did **not** click every button, filter, tab, toggle and form. The crawl only proves each page loads
  and looks as recorded. Interactive coverage is the first gap for the next session (listed in finding A-35).
- **Not done:** no `/map` mobile bottom-sheet pass, and no performance profile with all layers on.
- **Console:** the crawl counts `console.error` only. Warnings (for example the three.js warnings on `/studio`) are
  recorded from an earlier session and marked as such.

Totals from the crawl: 21 page loads. `NaN` on `/home` (3 sizes) and `/map` (desktop). Basemap watermark on
`/home` (3 sizes). Zero console errors and zero failed requests on any route. Horizontal overflow on none.
Text under 12px: 1 node on the welcome page at each size, 2 on `/studio`, 1–5 on `/live` and `/profile`, and 22–38 on `/home`, `/map` and `/reports`.

Severity: **S1** = a judge would notice in under 10 seconds or it reads as broken or dishonest.
**S2** = visible polish or credibility issue. **S3** = minor or hygiene.

## Findings

| ID | Sev | Route / size | Finding | Evidence (screenshot) | Source (verified) |
|---|---|---|---|---|---|
| A-01 | S1 | /home, all sizes | Basemap shows the watermark "API KEY REQUIRED · carto.com/basemaps/apikey" across the map. | `docs/screenshots/demo-before/home-1440x900.png` (map card, centre-left) | `frontend/src/components/dashboard/FloodRiskMiniMap.tsx:84` uses `basemaps.cartocdn.com/rastertiles/voyager` |
| A-02 | S1 | /home, all sizes | Map card subtitle says "OpenStreetMap live evacuation corridor" but the tiles are Carto Voyager. A false attribution. | `home-1440x900.png` | `FloodRiskMiniMap.tsx:60` |
| A-03 | S1 | /home 1440, 1024, 390 | Nearest refuge reads `km · ~ min (by car)`: distance and travel time are blank. | `home-1440x900.png` (refuge card) | `components/dashboard/NearestShelterCard.tsx:46` reads `primaryShelter.distanceKm` / `travelTimeMin`; backend has neither field (`backend/app/services/shelters_data.py`, `GET /api/v1/shelters`) |
| A-04 | S1 | /home 1440, 1024, 390 | Shelter occupancy renders `/ (NaN%)`. | `home-1440x900.png` | `NearestShelterCard.tsx:21,62`: backend sends `current_capacity` / `max_capacity` (snake_case), code reads camelCase |
| A-05 | S1 | /map 1440, 1024 | Every shelter card shows `km · ~14 min (car)` and `Capacity (NaN%)`. | `map-1440x900.png` (right panel) | `ShelterMapView.tsx` shelter list; same snake/camel mismatch as A-04 |
| A-06 | S1 | /reports all sizes | Report water depth is blank: `cm` with no number on every card. | `reports-1440x900.png` (card "WATER DEPTH") | `components/reports/ReportFeed.tsx:120,146` reads `waterDepthCm`; backend returns `water_depth_cm` (verified with `GET /api/v1/reports`) |
| A-07 | S1 | /reports all sizes | Reports show no photos. Backend returns `image_url`, the page reads `imageUrl`, so evidence images never render. | `reports-1440x900.png` (no image on either card) | `ReportFeed.tsx:125` (`report.imageUrl`); backend key `image_url` |
| A-08 | S1 | /map 1440, 1024 | Banner says "0 Hazards" while the live Vision layer shows flood zones. It is hard-coded text, not a count. | `map-1440x900.png` (amber banner, right) | `ShelterMapView.tsx:956` (literal `0 Hazards`); `:947` says "Hazard avoidance active" regardless of data |
| A-09 | S1 | /map 1440, 1024 | Legend says "5 Flood Basins (Warning)" as a fixed string, not a count of data. | `map-1440x900.png` (legend, bottom) | `ShelterMapView.tsx:840` |
| A-10 | S1 | /home, /map, /live | "Live Telemetry · 14 Sensors Active" and "IoT 12/14 Online" are static strings, not telemetry. A judge who asks "where are the 14 sensors" gets no answer. | `home-1440x900.png` (header), `map-1440x900.png` | `components/layout/Header.tsx:69`, `components/dashboard/IoTHeaderPopover.tsx:24` |
| A-11 | S1 | /profile 390 | The Telegram bot token is a `VITE_` variable, so it ships in the browser bundle. | `profile-390x844.png` (Telegram section) | `frontend/src/services/telegramService.ts:5` reads `VITE_TELEGRAM_BOT_TOKEN` |
| A-12 | S1 | /live all sizes | Sample cameras have no picture. They are drawn with vector shapes, so the "CCTV" looks like a diagram. | `docs/screenshots/after/live-1366x768.png` | `backend/app/vision/sources/synthetic.py` (cv2 drawing), `frontend/src/components/live/feed/RiverScene.tsx` |
| A-13 | S1 | /reports | "Live CCTV" modal uses a photo named `cctv image.jpg` and captions it "Klang River CCTV" and "Taman Sri Muda CCTV". This presents a stock or demo photo as a live government camera. | (modal, not captured) | `frontend/src/components/reports/LiveCCTVModal.tsx:27,35` |
| A-14 | S1 | /home | Headline numbers (1.20 m water, 1.65 m forecast, 95 mm/h rain, 87% confidence, "14 active sensors") are hard-coded and presented as live. They must be labelled as sample or simulated or removed. | `home-1440x900.png` (risk panel) | Static values in `components/dashboard/*` (to be confirmed per component in Plan B task P1-02) |
| A-15 | S2 | /home 1440 | The page is a stack of cards with one risk banner. There is no at-a-glance chart, no ranked list and no trend. It reads as a form, not a command centre. | `home-1440x900.png` | layout only |
| A-16 | S2 | /home 390 | The risk panel fills the first screen; the nearest refuge card and map start below the fold. The one primary action is hard to reach on a phone. | `home-390x844.png` | `components/dashboard/*` order |
| A-17 | S2 | /home 390 | Forecast "1.65 m" wraps to "1.65 / m" and "P50 Median" wraps beside it. Hero numbers break across lines. | `home-390x844.png` (forecast tile) | risk panel |
| A-18 | S2 | /home 390 | "Full Map" button label wraps to two lines on the map card header. | `home-390x844.png` | `FloodRiskMiniMap.tsx:68` |
| A-19 | S2 | /home 1440 | "Full Map" and "Start Navigation" compete; "All Shelters" is a grey pill with no clear hierarchy. | `home-1440x900.png` | `NearestShelterCard.tsx` |
| A-20 | S2 | /home, /map, /reports | 22–38 text nodes under 12px per page. Labels like "WATER LEVEL (CURRENT)" and occupancy are 10–11px. | crawl numbers in `crawl.json` | multiple |
| A-21 | S2 | /reports 1440 | Stats say "AI SCREENED 0" and "PENDING REVIEW 0", but both cards say "AI Verified" and the header says "Live Community Alerts". The counts contradict the cards. | `reports-1440x900.png` (stat row) | `ReportFeed.tsx:159` ("AI Verified"); stat row fed by the same mismatched data |
| A-22 | S2 | /reports 1440 | Both reports say "PENDING" while "LIVE PUBLISHED 2" is shown. The status model is contradictory. | `reports-1440x900.png` | `ReportFeed.tsx` |
| A-23 | S2 | /reports 1440 | Two cards in a 1440 wide page: the grid leaves the right two-thirds empty. Poor use of space for a judge-facing feed. | `reports-1440x900.png` | layout |
| A-24 | S2 | /reports 390 | Report card text sizes are 10–11px in the metric tiles ("WATER DEPTH", "ROAD RISK", "VERIFICATION"). | crawl: 24 small nodes | `ReportFeed.tsx` |
| A-25 | S2 | /map 390 | Map and shelter list stack on phones; the route polyline and the shelter bottom sheet fight for the same space. (Not fully tested.) | `map-390x844.png` | `ShelterMapView.tsx` layout |
| A-26 | S2 | /map 1440 | The route line runs through the Kuala Lumpur city centre and past roads with no road-network check. "Route Safe" on /home and "Corridor Clear" on /map are a geometric approximation, presented as routing. | `map-1440x900.png` (dashed route), `home-1440x900.png` | `ShelterMapView.tsx:225` `calculateRouteForShelter`: hard-coded waypoints |
| A-27 | S2 | /map 1440 | Vision hazard zones and the static flood basins overlap in the same colours (amber). A user cannot tell which is which. | `map-1440x900.png` | `ShelterMapView.tsx` basins; `VisionHazardLayer.tsx` |
| A-28 | S2 | /studio all sizes | Invalid colour `#decebfff` (8-digit hex) causes a three.js warning. Visually harmless; a console warning a judge could see in DevTools. | recorded earlier (console warning, not an error) | `frontend/src/components/sandbox/HouseStudio360.tsx:43` |
| A-29 | S2 | /studio all sizes | Three.js deprecation warning (`THREE.Clock` deprecated). | recorded earlier | `HouseStudio360.tsx` |
| A-30 | S2 | /live 360 | Header overlaps itself: the location button and the telemetry chip collide. | `docs/screenshots/after/live-360x740.png` (top bar) | `components/layout/Header.tsx` (no breakpoint for the chip at 360) |
| A-31 | S2 | /live (after restart) | Cameras vanish after a cold restart when `VISION_SEED_SAMPLES=0` (current `backend/.env`). A presenter who restarts the backend shows an empty page. | (not captured; reproduced by reading `backend/app/vision/seed.py`) | `backend/.env`, `seed.py` |
| A-32 | S2 | /live (backend down) | "Analysing…" can persist up to about 16 s with the server dead before "stale" appears. | `docs/screenshots/after/state-1366x768-reconnecting.png` | `hooks/vision/useCaptureCycle.ts` thresholds |
| A-33 | S2 | global | Write endpoints for cameras (add, remove, preview, test) have no authentication. Anyone who can reach the server can add cameras or remove user cameras. | (API test) | `backend/app/vision/routes.py` (no dependency on writes) |
| A-34 | S2 | global | Engineering: no test script and no vitest in `package.json`. Frontend tests exist but are never run by `npm`. | `frontend/package.json` | `frontend/package.json` |
| A-35 | S1 | global | Interactive coverage not done: the click-through of every control on every route is still outstanding. | (this audit's method section) | n/a |
| A-36 | S3 | /home, /map | Map attribution on /map is OpenStreetMap (correct). On /home it is Carto (see A-01/A-02). The two maps disagree. | `home-1440x900.png`, `map-1440x900.png` | `ShelterMapView.tsx:557` vs `FloodRiskMiniMap.tsx:84` |
| A-37 | S3 | /map 1440 | Shelter list header says "4 / 6 Shown" while the filter reads "All (6)". The counts do not agree on screen. | `map-1440x900.png` (right panel) | `ShelterMapView.tsx` list filter (count logic not yet read) |
| A-38 | S3 | index.html | No `og:image`, no `apple-touch-icon`, favicon is the Vite SVG. A shared link has no preview image. | `frontend/index.html` | `frontend/index.html:5` only has the favicon |
| A-39 | S3 | global | The sample name "Kampung Baru Drain" sits in the live list with a "SAMPLE" badge, but the same name appears as a verified report on `/reports`. A judge can read that as a real verified incident. | `docs/screenshots/after/live-1366x768.png`, `reports-1440x900.png` | sample seed + `services/api.ts` report fallbacks |
| A-40 | S3 | /profile 390 | Telegram chat ID field is prefilled with a channel name (`@FloodWaySafetyAlerts`) that is not a real account. | `profile-390x844.png` | `components/profile/*` (to be confirmed) |

## Summary of severities

- **S1 (15):** A-01 to A-14 and A-35.
- **S2 (20):** A-15 to A-34.
- **S3 (5):** A-36 to A-40.
- **Total 40.**

## Honesty flags that the pitch must respect

1. The live cameras are generated scenes, not feeds. Every camera says SAMPLE.
2. The "14 sensors" and "IoT 12/14 Online" counts are static text (A-10). Do not repeat them as telemetry.
3. The route and "0 hazards" banners are approximate geometry (A-08, A-26). Routing is not road-aware.
4. The forecast and confidence numbers on /home are hard-coded (A-14). Label them as model output on simulated data.
5. The 100% routing-avoidance figure is simulation-only. 95.34% is segmentation pixel accuracy, not forecast accuracy.
