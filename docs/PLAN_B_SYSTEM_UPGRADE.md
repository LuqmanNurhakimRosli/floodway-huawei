# PLAN B: FloodWay whole-system upgrade (demo-ready)

Hand this file to an implementation agent that has never seen the conversation. Everything it needs is here or in
`docs/DEMO_AUDIT.md` (finding IDs `A-nn`) and `docs/PLAN_A_GEMINI_MEDIA.md` (media, IDs `P1-03`, `P1-04`, `P1-07` are
referenced there and defined here).

Branch: `demo-polish` (already created from `live-vision-polish`). Commit small, one task per commit, and say the
task ID in the commit message. Do not merge, push or change `live-vision-polish` history.

---

## 🟢 Status Update: Plan A Execution Completed (Assets Generated & Verified)

Plan A (`docs/PLAN_A_GEMINI_MEDIA.md`) has been fully executed by Gemini 3.8 Flash (High):
- **Asset Generation (20 Frames):** 20 640×360 JPEG frames (≤300 KB each) across 5 cameras (`klang`, `gombak`, `smart`, `batu`, `drain`) and 4 alert levels (`normal`, `watch`, `warning`, `danger`) were generated and placed in `backend/app/vision/sample_media/`. Matching WebP copies (quality ~80) were saved to `frontend/public/media/live/`.
- **Demo Video Loop:** Generated `frontend/public/media/live/klang-rise.mp4` (H.264, 640×360, 25 fps, 186 KB) with seamless 15s rise-and-fall loop, along with its poster `klang-rise-poster.webp`.
- **Social OpenGraph Card:** Created `frontend/public/media/og/floodway-og.jpg` (1200×630, 93 KB).
- **Calibration Geometry:** Generated `backend/app/vision/sample_media/calibration.json` with accurate ROIs and water level threshold lines (`normal`, `warning`, `danger`) for all 5 cameras.
- **Verification & Check Script:** Executed `backend/app/vision/sample_media/check_frames.py` against `ClassicalWaterAnalyzer`. **Result: 20/20 (100%) frames classified at their exact expected alert level** (klang 4/4, gombak 4/4, smart 4/4, batu 4/4, drain 4/4).
- **Compliance & Honesty:** Documented in `backend/app/vision/sample_media/README.md`. No government agency logos, no license plates, no identifiable faces. Clearly flagged as **"AI-generated sample imagery. Not real camera footage."**
- **Ready for Wiring:** All files are verified, staged, and ready for Plan B implementation tasks (`P1-03`, `P1-04`, and `P4-06`).

---

## 0. Ground rules for the implementation agent

1. **Read `docs/DEMO_AUDIT.md` first.** Every task cites its finding IDs. If a task cannot be verified by reading the
   code it names, stop and say so; do not guess file names or line numbers.
2. **Verify before you change.** Each task lists a file. Open it, confirm the cited lines still match, then edit.
3. **Honesty is a requirement, not a nice-to-have.** Sample is labelled SAMPLE. Simulated is labelled simulated.
   Approximate is labelled approximate. Never show a number the code cannot back up.
4. **No new secrets in `VITE_` variables.** Ever. See P5-04.
5. **Each task ends with its acceptance check run.** Paste the command and its output in the commit body or the
   progress note.
6. **Commands you may run:** `npm run build`, `npx tsc -b`, `npx vitest run` (after P5-01), `pytest -q` in `backend/`,
   Playwright screenshots, `curl`. Do not run destructive git commands.

Priority: **P0** blocker (demo is unsafe or dishonest without it), **P1** judges will see it, **P2** nice to have.
Effort: **S** under half a day, **M** up to a day, **L** more.

---

## 1. Known truths (the presenters must keep these, and the UI must match them)

- There is **no confirmed public JPS or DBKL CCTV API.** Every camera in the demo is a sample or a user-added camera.
- The classical analyser is validated **only on synthetic scenes and AI-generated sample frames.** It is not validated on
  real river footage.
- The **100% routing-avoidance figure is simulation-only.** Route avoidance is a geometric approximation on the drawn
  line, not road-network routing (see A-26).
- **95.34% is segmentation pixel accuracy**, not forecast accuracy. Do not show it next to a forecast.
- Every sample camera carries a **SAMPLE** badge. The demo video carries **PLAYBACK**.
- The app's login is a **local demo user** (`frontend/src/contexts/AuthContext.tsx`). There is no backend identity.

---

## Phase 1: blockers (P0). Do these before anything pretty.

### P1-01: One shared basemap config, no API key (fixes A-01, A-02, A-36)

- **Why:** `frontend/src/components/dashboard/FloodRiskMiniMap.tsx:84` uses the Carto Voyager tiles, which print
  "API KEY REQUIRED" over the map. The card subtitle at `:60` says "OpenStreetMap", so it is also mislabelled.
  `frontend/src/components/map/ShelterMapView.tsx:557` already uses OpenStreetMap.
- **Recommendation:** OpenStreetMap standard tiles (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`) with the
  standard attribution, for this demo only. Their tile usage policy restricts heavy or bulk use; a demo with a few
  dozen views is within normal use, but the agent must **check the current policy on openstreetmap.org before the
  pitch** (this audit did not re-check it live). Alternative if OSM is blocked on the venue Wi-Fi: OpenFreeMap (no key
  required; verify its terms). Do not use a key-gated provider.
- **Change:** create `frontend/src/config/mapConfig.ts` exporting `BASEMAP_URL`, `BASEMAP_ATTRIBUTION`,
  `BASEMAP_MAX_ZOOM`. Use it in both `FloodRiskMiniMap.tsx` and `ShelterMapView.tsx` (and any future map). Make the
  subtitle say what the tiles actually are, read from the same constant.
- **Acceptance:** no `cartocdn` or `carto.com` string anywhere (`grep -rn cartocdn frontend/src` returns nothing).
  `/home` map shows no watermark: **look at the screenshot** (the watermark is drawn into the tile images, so a text check
  cannot catch it; `crawl.mjs` reported `apiKey: false` even while the watermark was visible). Attribution shown on both maps
  is identical.
- **Effort:** S. **Priority:** P0.

### P1-02: Shelter and report field mapping, and a NaN-proof formatter (fixes A-03, A-04, A-05, A-06, A-07)

- **Why (verified):** the backend returns **snake_case** and no distance or travel time.
  - `GET /api/v1/shelters` returns `id, name, lat, lon, category, address, contact, current_capacity, max_capacity,
    status, route_status, facilities, elevation_m`.
  - The UI reads `distanceKm`, `travelTimeMin`, `currentCapacity`, `maxCapacity` (`NearestShelterCard.tsx:21,46,62`).
  - `GET /api/v1/reports` returns `id, title, location, lat, lon, status, verified_by, timestamp_str, author, upvotes,
    image_url, water_depth_cm`. The UI reads `waterDepthCm` and `imageUrl` (`ReportFeed.tsx:30,59,120,146`,
    `:125`).
- **Change:**
  1. Create `frontend/src/lib/mappers.ts` with `mapShelter(raw)` and `mapReport(raw)` that convert snake_case to the
     camelCase types in `frontend/src/types/index.ts`. Keep the existing camelCase fallbacks in `services/api.ts`
     untouched.
  2. **Distance and travel time are not in the backend.** Compute distance with the existing `haversineKm` in
     `frontend/src/lib/vision/geo.ts` from the user's origin. Travel time is an **estimate**: distance divided by an
     assumed speed per mode (car 35 km/h, motorcycle 45, walk 4.5, matching `ShelterMapView.tsx` `getTransportDetails`).
     Label it "~est." in the UI. Do not show travel time as if it came from routing.
  3. Create `frontend/src/lib/format.ts` with `safeNumber`, `formatKm`, `formatMin`, `formatPct(current, max)` that return
     an em dash (`–`) for any missing, non-finite or zero-denominator input. **No `NaN`, `undefined` or empty
     string may ever render.**
  4. Replace the raw reads in `NearestShelterCard.tsx`, `ShelterMapView.tsx` (shelter cards, "Capacity (NaN%)"),
     and `ReportFeed.tsx` (water depth "cm" with no number) with the mappers and formatters.
  5. Add a unit test file `frontend/src/__tests__/format.test.ts` covering: missing field, `NaN`, zero max capacity,
     string numbers, and a real backend-shaped sample.
- **Acceptance:** `npx vitest run` passes. The crawl (`crawl.mjs`) shows **no `NaN`** on `/home` and `/map`, and the
  refuge card shows a distance and a labelled estimate. `/reports` shows a water depth number and the sample image when
  `image_url` is present.
- **Effort:** M. **Priority:** P0.

### P1-03: Wire Plan A media and calibration into the vision seed; decide the demo default (fixes A-12, A-31)

- **Why:** `backend/app/vision/seed.py` builds the five sample cameras with `SyntheticRiverSource` (a cv2 drawing,
  `backend/app/vision/sources/synthetic.py`) and a hard-coded `sample_calibration()`. `VISION_SEED_SAMPLES=0` in
  `backend/.env` means a cold restart shows **no cameras** (A-31). *(Plan A status: frames and `calibration.json` are already generated, validated 20/20 on check script, and present in `backend/app/vision/sample_media/`)*.
- **Change:**
  1. Add `backend/app/vision/sources/frameset.py`: a `FrameSetSource` that loads the four JPEGs for a camera from
     `backend/app/vision/sample_media/` and returns the frame whose level matches the simulated ratio, using the same
     sine ratio as `SyntheticRiverSource.ratio_at` so the level moves on its own. Nearest-level mapping:
     `ratio < 0.35 → normal`, `< 0.6 → watch`, `< 0.9 → warning`, otherwise `danger`.
  2. In `seed.py`, when `sample_media/calibration.json` and the four frames for a camera exist, use the `FrameSetSource`
     and that camera's calibration from the JSON. Otherwise fall back to the existing synthetic scene (so the code still
     works without media). Log which path each camera took.
  3. **Decide the demo default:** set `VISION_SEED_SAMPLES` default to `1` in `backend/app/vision/config.py` and in
     `backend/.env.example`, and document it in `docs/09_AI_HANDOVER.md` under warnings. Update the live `backend/.env`
     line to `1` **only with the user's OK** (it is the user's local file).
  4. Confirm user cameras survive a cold restart. `engine.py` already writes `cameras.json` (`_persist`) and loads it in
     `start` (`_load_user_cameras`). Write a test: add a camera, build a new engine on the same `data_dir`, assert the
     camera is back with its calibration.
- **Acceptance:** `pytest -q` passes, including the new persistence test. With the media present, `/live` shows frames
  (not vector scenes) and at least 3 of the 5 cameras change level within 2 minutes. Cold restart with
  `VISION_SEED_SAMPLES=1` shows five cameras within 10 s.
- **Effort:** M. **Priority:** P0.

### P1-04: Show the demo video on /live with the PLAYBACK badge (uses Plan A VIDEO-KLANG)

- **Why:** nothing plays video today. Plan A creates `frontend/public/media/live/klang-rise.mp4`. *(Plan A status: `klang-rise.mp4` and `klang-rise-poster.webp` are already created and present in `frontend/public/media/live/`)*.
- **Change:** in `frontend/src/components/live/feed/FeedViewer.tsx`, when `camera.id === 'sample-klang-jamek'` and the
  media file exists (probe with a `HEAD` request once, cache the result), render a `<video>` with `muted`, `loop`,
  `playsInline`, `poster="/media/live/klang-rise-poster.webp"` in place of the `<img>`. Keep the **PLAYBACK** badge (the
  existing `kind` logic already shows it for `is_playback` cameras). Use `prefers-reduced-motion` to show the poster only.
- **Acceptance:** the video plays and loops on desktop and phone. No 404 in the network log. The badge reads PLAYBACK.
- **Effort:** S. **Priority:** P1.

### P1-05: Header overlap at 360 px (fixes A-30)

- **Change:** in `frontend/src/components/layout/Header.tsx`, below 400 px hide the telemetry chip (the `hidden lg:flex`
  one at line ~67 already hides it below `lg`; check the other chip, `IoTHeaderPopover`, and the location button) and
  truncate the location to `max-w-[120px]`. Make sure the bottom nav does not overlap page content (`pb-16` on the page).
- **Acceptance:** screenshot at 360×740 of `/live`, `/home`, `/map`: no overlapping elements (run the overlap check
  script in P5-02).
- **Effort:** S. **Priority:** P0.

### P1-06: `/studio` invalid colour and deprecated clock (fixes A-28, A-29)

- **Change:** `frontend/src/components/sandbox/HouseStudio360.tsx:43`: change `#decebfff` to `#decebf`. Replace
  `THREE.Clock` with `THREE.Timer` (three r183) where it is used, or confirm it is only a warning and document it.
- **Acceptance:** `/studio` console shows no `THREE.Color` warning.
- **Effort:** S. **Priority:** P1.

### P1-07: Credits and About text, including the AI-generated line (required by Plan A section 3)

- **Change:** add a small "About this demo" block to the footer of `frontend/src/pages/WelcomePage.tsx` and to
  `frontend/src/pages/ProfilePage.tsx`. Text must include: **"AI-generated sample imagery. Not real camera footage. Sample
  cameras are for demonstration only."** and the list of data sources actually used.
- **Acceptance:** the sentence is visible on both pages at 390 px and 1440 px.
- **Effort:** S. **Priority:** P0 (honesty).

### P1-08: Remove or label every hard-coded "live" number (fixes A-08, A-09, A-10, A-14)

- **Why:** `ShelterMapView.tsx:956` prints a literal "0 Hazards"; `:840` prints a literal "5 Flood Basins"; `Header.tsx:69`
  and `IoTHeaderPopover.tsx:24` print "14 Sensors Active" and "IoT 12/14 Online"; the `/home` risk panel values
  (1.20 m, 1.65 m, 95 mm/h, 87%) are static.
- **Change:**
  1. Replace "0 Hazards" with the count from `useVisionHazards()` (already in the codebase) and the basin list with the
     count of basins whose level is WARNING or above in the basins data. If there is no data source for a count, do not
     show a count.
  2. For telemetry chips, either read the real count from the backend or label them "Demo sensors (simulated)".
  3. For `/home` headline values, either read them from a real endpoint or label the whole panel "Demo scenario
     (simulated)". Do not present static numbers as live.
- **Acceptance:** no literal count appears that is not computed from data or labelled simulated. Grep for
  `Hazards'`, `Sensors Active`, `Online` and check each.
- **Effort:** M. **Priority:** P0.

### P1-09: Remove the Telegram bot token from the browser bundle (fixes A-11)

- **Why:** `frontend/src/services/telegramService.ts:5` reads `VITE_TELEGRAM_BOT_TOKEN`, which is compiled into the
  bundle and visible to anyone who opens the site.
- **Change:** move the send to the backend. Add `POST /api/v1/alerts/telegram` in `backend/app/routes/` that reads the
  token from the backend `.env` (`TELEGRAM_BOT_TOKEN`, already present there). The frontend posts the message body only.
  Remove `VITE_TELEGRAM_BOT_TOKEN` from `frontend/.env` and `frontend/.env.example`.
- **Rotation:** treat the current token as **exposed**. The user must revoke it in BotFather and set a new one in
  `backend/.env`. Do not commit either.
- **Acceptance:** `grep -rn VITE_TELEGRAM_BOT_TOKEN frontend` returns nothing. Test message still arrives via the backend.
  The built bundle (`frontend/dist`) does not contain the old token string.
- **Effort:** M. **Priority:** P0.

### P1-10: Reports copy and the "Live CCTV" modal (fixes A-13, A-21, A-22, A-23)

- **Change:**
  1. `frontend/src/components/reports/LiveCCTVModal.tsx:27,35`: replace the photos with Plan A CAM-KLANG frames, and
     change the captions to include "AI-generated sample" and the SAMPLE badge. Remove the words "Klang River CCTV" and
     "Taman Sri Muda CCTV".
  2. `ReportFeed.tsx` and the stats row: make the counts computed from the same list (total, AI screened, pending,
     published) so they cannot contradict. Define the status model in one place: a report is "PENDING" until a human
     verifies it; "AI Verified" is a separate flag.
  3. Fix the grid so cards do not leave two-thirds of the page empty on desktop (use `grid-cols-1 md:grid-cols-2
     xl:grid-cols-3`, and let the count of cards drive it, not a fixed width).
- **Acceptance:** the stats add up to the cards shown; the modal shows no photo labelled as a real CCTV.
- **Effort:** M. **Priority:** P0 (honesty) and P1 (look).

### P1-11: Phone CTA and copy on `/home`, then the redesign (Phase 2)

Covered in Phase 2. Listed here so the blocker list is complete.

### P1-12: Crawl-level blockers (any remaining console error or failed request)

- **Change:** run `crawl.mjs` after P1-01 to P1-10. Fix any console error or failed request it reports.
- **Acceptance:** zero console errors and zero failed requests on every route at all three sizes.
- **Effort:** S. **Priority:** P0.

---

## Phase 2: `/home` redesign (P1). The judges' first screen.

Target: a command centre at a glance. One risk state, one primary action, calm cards. Reduce clutter rather than adding
boxes. Use the existing stack: React, Tailwind, Leaflet, hand-drawn SVG (see `components/live/shared/Sparkline.tsx` and
`components/live/analysis/LevelHistoryChart.tsx`). **No new chart library** unless a task below justifies one.

### P2-01: HeroStatus strip (replaces the big red banner and the stacked risk cards)

- **Layout:** one full-width strip at the top. Left: risk word (NORMAL / ADVISORY / WARNING / DANGER) in the colour
  scale from Phase 3, plus the area name. Right: "Updated 14:32:05" (from the newest data timestamp) and a freshness
  dot (green if < 60 s, amber if < 5 min, red otherwise). Below the strip only: the one primary button.
- **Data:** risk level = the highest level from `useVisionStore()` cameras with `online` true (sample cameras count, and
  the strip says "from sample cameras" when all sources are sample).
- **Acceptance:** risk word and colour match the highest camera level. The freshness dot changes when the feed stops.
- **Effort:** M. **Priority:** P1.

### P2-02: Primary action and nearest refuge (desktop and phone)

- **Layout:** one large primary button "Go to nearest refuge" (navigates to `/map?focus=<id>` or the navigation page).
  Secondary: "View map", "Report flood". The refuge card shows name, a **distance and a labelled estimated time** (P1-02),
  status, and an occupancy bar with a number ("12 of 180 places") or an em dash.
- **Phone first screen (390×844):** risk word, refuge name and distance, the primary button. Nothing else above the fold.
- **Acceptance:** at 390×844 the primary button is in the first viewport and tappable (44 px). No NaN.
- **Effort:** S. **Priority:** P1.

### P2-03: River level trend with the danger threshold

- **Component:** `RiverTrendSparkline` (new, hand-drawn SVG, same approach as `Sparkline.tsx`). Shows the last N
  readings of the highest-risk camera, with three reference lines (normal, warning, danger) labelled with the same
  words as Live Vision.
- **Data:** the vision store's `history` for that camera (already loaded by `loadHistory`).
- **Acceptance:** the line and the threshold line use the same scale; label the source "Sample camera: <name>".
- **Effort:** M. **Priority:** P1.

### P2-04: Risk by district (ranked bars)

- **Component:** `DistrictRiskBars` (new). A ranked list of districts with a bar and a level word. **Data source:** the
  same camera levels, grouped by a district field. If the data has no district field, group by the nearest place in
  `frontend/src/lib/vision/geo.ts` (`PLACES`) and say so in the label.
- **Acceptance:** ranking matches the camera levels; the label says how districts were derived.
- **Effort:** M. **Priority:** P1.

### P2-05: Camera-status tile row (from Live Vision)

- **Component:** `CameraStatusRow` (new). One small tile per camera: name, level colour and word, a SAMPLE or LIVE badge,
  and a 16:9 thumbnail (Plan A frame when present). Tapping a tile opens `/live` with that camera selected.
- **Acceptance:** tile count equals the online cameras; SAMPLE badge shows for every sample camera; tiles scroll
  horizontally on phones without page overflow.
- **Effort:** M. **Priority:** P1.

### P2-06: Forecast timeline (ModelArts), honestly labelled

- **Component:** `ForecastTimeline` (new). A horizontal timeline of the next hour at 10-minute steps, with the P50 median
  and a band. **Label:** "Model output on simulated data. Not a validated forecast." Show the model name only as
  "ModelArts (simulated input)".
- **Data:** the backend prediction route in `backend/app/routes/predict.py` (**verify its response shape first**; do
  not assume). If the route returns nothing usable, show an empty state that says so.
- **Acceptance:** the label is visible in the component at every size; no accuracy number appears beside it.
- **Effort:** M. **Priority:** P1.

### P2-07: Shelter capacity ring

- **Component:** `ShelterCapacityRing` (new, SVG ring). Shows occupancy for the refuge in the primary action. Centre text
  is the number and a word ("Open", "Filling", "Full"). **Unknown capacity shows an em dash and "Not reported", never 0%.**
- **Acceptance:** ring is absent or shows "Not reported" when `max_capacity` is 0 or missing.
- **Effort:** S. **Priority:** P1.

### P2-08: Skeletons and empty and error states for every card

- **Change:** every card in P2-01 to P2-07 has a skeleton that matches its final layout, an empty state with a sentence
  and a next step, and an error state with a retry. Use the `Skeleton` pattern in
  `components/live/shared/Skeleton.tsx`.
- **Acceptance:** with the backend stopped, every card shows its error or empty state (no blank boxes). Screenshot it.
- **Effort:** M. **Priority:** P1.

### P2-09: Layout specification (targets, not pixel-perfect)

- **1440 px:** hero strip full width; below it a three-column grid: left = refuge + primary action, centre = map
  (`FloodRiskMiniMap` with P1-01 tiles), right = camera status row (vertical) and district bars. Trend and forecast
  span the bottom.
- **1024 px:** two columns; the map spans full width on its own row.
- **390 px:** hero strip, primary action, refuge card, camera row (horizontal scroll), map, then trend, forecast, district bars.
- **Acceptance:** screenshots at 1440×900, 1024×768, 390×844 saved to `docs/screenshots/home-after/`; no horizontal
  overflow; no text under 12 px (check with the crawl).
- **Effort:** L. **Priority:** P1.

---

## Phase 3: `/map` review (P1)

### P3-01: Label every layer's source honestly

- **Why:** the map mixes real geography (OSM tiles), static demo data (basins, hard-coded routes, shelters from
  `services/api.ts` fallbacks) and sample cameras (vision). A flood analyst would ask which is which.
- **Change:** each layer in the legend gets a source tag: "Map data © OpenStreetMap", "Demo flood basins (simulated)",
  "Sample cameras (simulated)", "Shelter list: demo data" or "Shelter list: live", "Route: approximate, not
  road-aware". Put the tag in the legend, not only in the footer.
- **Acceptance:** every layer on the map has a visible source tag. Screenshot.
- **Effort:** S. **Priority:** P0 (honesty).

### P3-02: Route copy that does not overclaim (fixes A-26)

- **Change:** `ShelterMapView.tsx` route banner and `/home` "Route Safe" / "Corridor Clear" text become "Approximate
  route. Not road-aware. Check conditions locally." The "Hazard avoidance active" line becomes "Approximate: route bends
  around the camera flood zones shown." `VisionHazardLayer.tsx:48` ("Routes avoid this zone") becomes "Route is adjusted
  around this zone (approximate)."
- **Acceptance:** no string claims a road-aware or guaranteed avoidance. Grep for "avoid", "safe", "clear".
- **Effort:** S. **Priority:** P0.

### P3-03: One risk colour scale used everywhere

Proposed values, verified in this audit with WCAG contrast (computed, not estimated):

| Level | Text on tint (background) | Solid fill (white text on it) | Non-text marker fill (vs white, 3:1 needed) |
|---|---|---|---|
| NORMAL | `#047857` on `#ECFDF5`, **5.21:1** | `#047857`, white text **5.48:1** | `#059669`, **3.77:1** |
| ADVISORY | `#075985` on `#F0F9FF`, **7.09:1** | `#0369A1`, white text **5.93:1** | `#0284C7`, **4.10:1** |
| WARNING | `#92400E` on `#FFFBEB`, **6.84:1** | `#B45309`, white text **5.02:1** | `#D97706`, **3.19:1** |
| DANGER | `#991B1B` on `#FEF2F2`, **7.60:1** | `#B91C1C`, white text **6.47:1** | `#DC2626`, **4.83:1** |

- **Rule:** text uses the "text on tint" pair; a solid chip uses the "solid fill" pair; bars, dots and map markers use the
  "marker" colour. Never white text on `#10B981`, `#F59E0B` or `#0EA5E9` (all fail; see the audit notes).
- **Why this changes the current values:** `frontend/src/lib/vision/levels.ts` uses `#10B981`, `#0EA5E9` and `#F59E0B` as
  solid fills with white or dark text. The WARNING solid uses dark text on amber (passes), but NORMAL and ADVISORY solids
  do not. Migrate `levels.ts` to the table above, then fix the call sites.
- **Acceptance:** the four levels look the same on `/home`, `/map`, `/live` and `/reports`. Contrast table re-checked by
  script (`node` with the same formula).
- **Effort:** M. **Priority:** P1.

### P3-04: Map legibility and layer overlap (fixes A-27)

- **Change:** flood basins use dashed outlines and a hatched or lower-opacity fill; vision hazard zones use solid outlines
  and a higher-opacity fill; shelters use the marker style; routes use a white casing under the blue line. Add a
  legend entry for each. Check overlap at 1440 and 390.
- **Acceptance:** a screenshot at 1440×900 where the three layer types can be told apart without reading the legend.
- **Effort:** M. **Priority:** P1.

### P3-05: Mobile bottom sheet and performance with all layers on

- **Change:** on 390 px, the map takes the full screen and the shelter list is a bottom sheet with a drag handle and
  three snap heights. Measure: with all layers on, check frames per second while panning (Chrome performance panel or
  `requestAnimationFrame` sampling) and keep the page responsive (no long task over 200 ms on pan).
- **Acceptance:** sheet snaps; pan stays above 30 fps on the dev machine; screenshot at 390×844.
- **Effort:** M. **Priority:** P2.

### P3-06: Popups and shelter cards: no empty values

- **Change:** every popup field goes through `format.ts` (P1-02). A missing field shows "Not reported".
- **Acceptance:** crawl shows no `NaN`, `undefined` or empty value on `/map` at any size.
- **Effort:** S. **Priority:** P0 (overlap with P1-02).

---

## Phase 4: every other page (P1 to P2)

Use the tokens already in `frontend/src/components/live/shared/ui.ts`. **Promote them to a shared app-wide file**
(`frontend/src/styles/tokens.ts`) because `/home`, `/map` and `/reports` need the same card, focus and button styles,
and importing from `components/live` into other pages couples them to Live Vision. Justification: one import path,
no page depends on another page's folder.

### P4-01: Tokens promotion

- **Change:** move `card`, `focusRing`, `interactive`, `btnPrimary`, `btnSecondary`, `heading`, `num`, `hero`, `label`,
  `pill` to `frontend/src/styles/tokens.ts`. Re-export from `ui.ts` for the Live Vision imports.
- **Acceptance:** `npx tsc -b` and build pass; no visual change on `/live` (compare screenshots).
- **Effort:** S. **Priority:** P2.

### P4-02: `/home` other fixes

- Button "Full Map" wraps on phones (A-18): make it an icon with `aria-label` below 400 px.
- Forecast value wraps (A-17): use `whitespace-nowrap` on the number and move "P50 Median" below.
- Small text: 22–38 nodes under 12 px (A-20): raise labels to 12 px minimum.
- **Acceptance:** crawl shows no text under 12 px on `/home`; no wrapped numbers at 390.
- **Effort:** S. **Priority:** P1.

### P4-03: `/reports` other fixes

- Metric tile labels 10–11 px (A-24): raise to 12 px. Tile values use the formatter (P1-02).
- Filter chips and the share icon need 44 px targets on phones.
- **Acceptance:** crawl shows no text under 12 px on `/reports`; touch targets measured at 390.
- **Effort:** S. **Priority:** P1.

### P4-04: `/profile` fixes

- Telegram chat field prefilled with `@FloodWaySafetyAlerts` (A-40): leave it blank with a placeholder "e.g. @your_channel"
  unless the user sets it; say why the token is server-side (P1-09).
- Five small-text nodes: raise to 12 px.
- **Acceptance:** no prefilled channel name that is not the user's; no text under 12 px.
- **Effort:** S. **Priority:** P2.

### P4-05: `/studio` and welcome page

- `/studio`: P1-06 (colour, clock). Also check keyboard focus on the 3D controls; add a text alternative.
- Welcome page: one text node under 12 px at every size (crawl); fix it. Add the About line (P1-07).
- **Acceptance:** crawl clean; `/studio` shows no warning in the console.
- **Effort:** S. **Priority:** P2.

### P4-06: Head metadata (fixes A-38)

- `frontend/index.html`: add `og:title`, `og:description`, `og:image` (`/media/og/floodway-og.jpg` from Plan A, if made),
  `theme-color`, and an `apple-touch-icon` (use `floodway logo.png` converted to PNG 180×180 if needed).
- **Acceptance:** `curl` the page and see the tags; the og image URL returns 200.
- **Effort:** S. **Priority:** P2.

---

## Phase 5: engineering hygiene (P0 to P2)

### P5-01: Vitest and a single check command (fixes A-34)

- **Change:** add `vitest` to `devDependencies` in `frontend/package.json` (version: the latest that the repo's Vite
  supports; check with `npm view vitest version` and the peer range; do not assume). Add scripts:
  `"test": "vitest run"` and `"check": "tsc -b && npm run test && npm run build"`. Make sure `tsconfig.json` excludes
  `src/__tests__` from the build (it already does). Add `pytest.ini` checks to a root `Makefile` or `scripts/check.ps1`
  (Windows, PowerShell 5.1 compatible): run `npm run check` in `frontend/` and `pytest -q` in `backend/`.
- **Acceptance:** `npm run check` passes from a clean checkout of `demo-polish`.
- **Effort:** S. **Priority:** P0.

### P5-02: Overlap and layout check script

- **Change:** `scripts/layout-check.mjs` (Playwright, the same approach as `crawl.mjs`): at each size, detect overlapping
  boxes among header children and among cards on `/home`, `/map`, `/live`, `/reports`; detect horizontal overflow and text
  under 12 px. Print a table. Exit non-zero on failure.
- **Acceptance:** runs and reports the current state; after Phase 1 and 2 it reports zero failures.
- **Effort:** M. **Priority:** P1.

### P5-03: Authentication for camera write endpoints (fixes A-33)

- **Problem:** the app's login is local (`AuthContext.tsx`, localStorage). There is no backend identity to check.
- **Smallest correct design for the demo:**
  1. Backend env `VISION_WRITE_TOKEN` (required in production, optional in dev; in dev the routes must **log a warning**
     and still work for the demo, so the demo is not broken).
  2. Add a FastAPI dependency `require_write_token` in `backend/app/vision/routes.py` on: `POST /cameras`, `DELETE
     /cameras/{id}`, `POST /cameras/preview`, `POST /cameras/test`, `POST /cameras/{id}/analyze`. It checks an
     `Authorization: Bearer <token>` header with `hmac.compare_digest`.
  3. The frontend must not hold the server token. For the demo, add a **backend-only** proxy path, or have the operator
     enter the token once on the Profile page (kept in memory only, never in localStorage or a `VITE_` variable).
  4. Document this honestly: it is not user accounts. It stops anonymous writes on a deployed demo.
- **Acceptance:** `curl -X DELETE` without the header returns 401 when the token is set; with the header returns 204.
  Pytest covers both.
- **Effort:** M. **Priority:** P0 for a public deployment, P1 for the demo.

### P5-04: VITE keys: exposed and what to rotate

Keys currently referenced in `frontend/src` (grep `VITE_`, verified in this audit):

| Key | Exposed in bundle? | Sensitive? | Action |
|---|---|---|---|
| `VITE_TELEGRAM_BOT_TOKEN` | yes | **yes, secret** | **Rotate in BotFather.** Remove from frontend (P1-09). |
| `VITE_OPENROUTER_API_KEY` | yes | **yes, secret** | **Rotate on OpenRouter.** Move the vision call behind the backend. |
| `VITE_OPENROUTER_MODEL` | yes | no | Keep (config). |
| `VITE_TELEGRAM_BOT_USERNAME` | yes | no | Keep (public). |
| `VITE_TELEGRAM_DEFAULT_CHAT_ID` | yes | low (channel ID) | Keep or move to backend. |
| `VITE_API_BASE` | yes | no | Keep (config). |
| `VITE_VISION_MOCK` | yes | no | Keep (config). |

- **Rule written into `docs/14_CODING_CONVENTIONS.md`:** no secret may be prefixed `VITE_`.
- **Acceptance:** `grep -rn "VITE_.*\(TOKEN\|KEY\|SECRET\)" frontend/src` returns nothing after the change. The user has
  rotated both secrets (the agent cannot do this; report it as a user action).
- **Effort:** M. **Priority:** P0.

### P5-05: "Analysing…" dead state when the server dies (fixes A-32)

- **Why:** `frontend/src/hooks/vision/useCaptureCycle.ts` shows "analysing" until the stale threshold, which can be about
  16 s when the server is gone.
- **Change:** if the websocket is not connected (`state.connected === false` and not on sample data), the cycle returns a
  new phase `'disconnected'` immediately. `CaptureStrip` and `CameraCard` show "Server unreachable, retrying" and do not
  show "Analysing…". Read `connected` from `useVisionStore` in the hook.
- **Acceptance:** stop the backend with the page open; the capture strip says "Server unreachable" within 2 s; no
  "Analysing…" appears. Screenshot.
- **Effort:** S. **Priority:** P1.

### P5-06: Restart behaviour

- **Verified:** `engine.py` writes user cameras (with calibration) to `cameras.json` and reloads them at start. The
  sample cameras are seeded only when `VISION_SEED_SAMPLES=1`.
- **Change:** covered by P1-03. Add a short section in `docs/09_AI_HANDOVER.md`: what survives a restart and what does not.
- **Acceptance:** P1-03 persistence test passes; the handover note is written.
- **Effort:** S. **Priority:** P1.

### P5-07: Remaining engineering items from the audit

- Header overlap (P1-05), `/studio` (P1-06): done in Phase 1.
- Build warning: the main bundle is 608 kB and `HouseStudio360` is 922 kB. Lazy-load the `/map` Leaflet block if it
  grows past 500 kB. Not a blocker; note it.
- **Effort:** S. **Priority:** P2.

---

## Phase 6: demo readiness (14 Oct prelim, 3 Nov semi-final, 18 Nov final)

### P6-01: Real, simulated, not built (say this out loud, and keep it on one slide)

| Status | Feature |
|---|---|
| **Real in the app** | Live Vision analysis pipeline on images (classical analyser, level rules, alerts, websocket); user-added cameras; the report and shelter UI; the offline and reconnect behaviour once P5-05 lands. |
| **Simulated** | All five sample cameras and their frames (AI-generated after Plan A); the video; the flood basins; the forecast numbers; the "14 sensors" and IoT counts unless wired (P1-08); route avoidance (approximate). |
| **Not built / not claimed** | Any public JPS or DBKL CCTV feed (none confirmed); road-network routing; a validated forecast; real IoT sensor data; government verification of reports. |
| **Accuracy figures** | 95.34% is segmentation pixel accuracy on the model's test set. It is not forecast accuracy. 100% route avoidance is simulation-only. |

### P6-02: 5-minute pitch click path

1. Welcome page: the About line says what is simulated (P1-07). Say it once, plainly.
2. `/home`: point at the risk strip and the freshness time. Say "sample cameras feed this".
3. `/live`: pick the highest-risk camera. Let the level move. Show the toast. Show the PLAYBACK video.
4. "Show evacuation routes": `/map` opens focused on the camera. Point at the approximate route banner. Say it is approximate.
5. `/reports`: show the verification status. Say that reports are not verified by government.
6. Close: what is real, what is simulated, what is next (P6-01).

### P6-03: 15-minute semi-final demo

Everything above, plus: add a user camera with the wizard using a public snapshot URL the presenter has tested in advance;
show calibration; show the cold-restart persistence (restart the backend, the camera is still there); show the
analyser's real hit rate from the Plan A check script and say it is on synthetic and AI-generated frames only.

### P6-04: Pre-load before every session

- Backend running with `VISION_SEED_SAMPLES=1`, the Plan A media present, and the user camera from P6-03 added.
- Browser: one tab on `/home` signed in, one on `/live`, one on `/map`. Zoom 100%. Notifications allowed for the
  alert demo.
- A screen recording of the full 5-minute path, for fallback.

### P6-05: Fallbacks

| Failure | Fallback |
|---|---|
| Wi-Fi drops | Play the screen recording (P6-04). Say so. |
| Backend down | The app already falls back to labelled sample data with a notice (P5-05 makes this clear). Show that, and say the server is restarting. |
| OSM tiles blocked | Use the screenshots in `docs/screenshots/home-after/` for the map. Or switch to OpenFreeMap (P1-01 note). |
| Video fails | Show the poster and the four level frames. |
| Telegram send fails | Do not demo the send live. Show the alert toast instead. |

---

## Dependency-ordered checklist

Do these in order. A later item assumes the earlier ones.

1. **P5-01** vitest and `npm run check`. (Everything below is verified with it.)
2. **P1-01** basemap config (no key).
3. **P1-02** mappers and formatters, with tests.
4. **P1-08** remove or label hard-coded numbers.
5. **P1-09** Telegram token to backend. **User action:** rotate the token.
6. **P1-05** header at 360. **P1-06** `/studio`.
7. **P1-03** seed wiring to Plan A media and calibration, persistence test. (Needs Plan A output.)
8. **P1-04** video on `/live`. (Needs Plan A video.)
9. **P5-05** "Analysing…" dead state.
10. **P1-10** reports copy, counts and modal. **P1-07** About line. **P3-01** layer source tags. **P3-02** route copy.
11. **P1-12** crawl clean (zero console errors, zero failed requests).
12. **P3-03** risk colour scale, then **P3-04** map legibility.
13. **P4-01** tokens promotion. **P2-01** to **P2-09** `/home` redesign.
14. **P3-05** mobile sheet and performance. **P4-02** to **P4-06** other pages.
15. **P5-02** layout check script (run it after steps 10–14).
16. **P5-03** write auth (P0 only if the demo is public). **P5-04** VITE keys and rotation (user action).
17. **P5-06**, **P5-07**.
18. **P6-01** to **P6-05**: the scripts, pre-load and fallbacks, written and rehearsed.

**Final gate before 14 Oct:** steps 1–12 done; `npm run check` green; `pytest -q` green; crawl clean; screenshots of
every route at three sizes saved; the About line visible; no secret in `frontend/src` or the built bundle.
