# Live Vision audit (before the polish pass)

Date: 2026-10-11. Branch: `live-vision-polish`, baseline commit `0d911cd`.
Method: the real page at `http://localhost:5173/live` against the real backend on `:8080`, captured with headless Chrome
(Playwright) at five viewports. Screenshots live in `docs/screenshots/before/`. Files named `*-full.png` show the whole
scrolled page; the others show the first screen.

Baseline health: `pytest -q` 58 passed. `tsc -b` clean. Backend reachable, CORS allows `localhost:5173`.

## Spec and integration review

| # | Finding | Evidence |
|---|---|---|
| S1 | `docs/LIVE_VISION_IMPLEMENTATION_PLAN.md` and `docs/INTEGRATION.md` do not exist anywhere in the repo; `FloodWay_LiveVision_Module/` is an empty folder. `backend/app/vision/seed.py` still links to the missing plan. The code and the polish brief are therefore the only spec. | `find` over the repo |
| S2 | `App.tsx` still imports `SimulationPage` (unused since `/simulation` redirects) and imports `HouseStudio360` eagerly, so three.js and its shaders load on **every** route. The console on `/live` shows `THREE.Color: Invalid hex color #decebfff`. | console capture, all viewports |
| S3 | `SimulationPage.tsx` and `components/simulation/*` are dead code: nothing routes to them. | `grep` |
| S4 | Router mounted, nav renamed to **Live Vision** with a camera icon, `/simulation` redirects to `/live`, map has `VisionHazardLayer`. These parts of the integration are correct. | `git diff` |
| S5 | Route drawing ignores vision zones: `calculateRouteForShelter()` never reads `useVisionHazards()`, so the popup text "Routes avoid this zone" is not true. | `ShelterMapView.tsx:225` |
| S6 | Frontend tests (`src/__tests__/vision.test.ts`) import `vitest`, but vitest is not a dependency, and `tsconfig` excludes the folder. The tests have never run. | `package.json` |

## Defects

| # | Viewport | Defect | Evidence |
|---|---|---|---|
| D1 | 1024x768 | **Columns overlap.** `lg:` (viewport 1024) switches to 3 columns, but with the 260 px sidebar the content is only 764 px. The analysis column is drawn over the feed; the feed header is a 40 px sliver; the toggles stack vertically. | `before/live-1024x768.png` |
| D2 | 1366x768 | **Centre column crushed to ~330 px.** Overlay chips wrap to two rows; "Next capture in" wraps over three lines; "Water level" wraps; the feed is 320x180. | `before/live-1366x768.png` |
| D3 | 768x1024 | Full 260 px sidebar leaves 508 px, so a tablet gets the phone layout squeezed into half the screen. | `before/live-768x1024.png` |
| D4 | all | Layout is driven by **viewport** breakpoints (`lg:`, `xl:`), but the space that matters is the content area beside the sidebar. | `LiveVisionPage.tsx:99` |
| D5 | 390x844 | Sticky "Show evacuation routes" lives inside the analysis column, so it only sticks once you have scrolled to that column. On first view it is not visible at all. | `before/live-390x844-full.png` |
| D6 | all | Banner root cause: when the page loads before the backend is ready, the store enters sample mode **and never retries** (polling is skipped while `usingMock`). The page then shows sample data until a hard reload, even after the server is up. This explains the "Failed to fetch" banner in the user screenshot. | `visionStore.ts:93,138` |
| D7 | all | The offline banner is a full-width amber block with a long sentence that pushes the page down. | user screenshot |
| D8 | 1366, 1920 | Countdown shown **twice** (feed header ring and capture strip ring), and the level chip is shown three times (header, capture strip, water card). | `before/live-1920x1080.png` |
| D9 | 1366, 1920 | Camera thumbnail strip is cut off at the right edge with no fade or scroll affordance. | `before/live-1920x1080.png` |
| D10 | all | `FeedViewer` has a `stale` prop that nothing passes, so the "Stale feed" overlay can never appear. | `grep stale=` |
| D11 | all | Offline card reads "Offline for never" when the camera has no frame yet. | `before/live-1366x768-full.png` (Backyard Stream) |
| D12 | all | Sparklines appear on some cards and not others (history is loaded for the selected camera only), so card rows look uneven. | `before/live-1366x768-full.png` |
| D13 | all | Camera card thumbnail is 96 px wide; distance and status chip wrap onto separate lines at 1366; source is not shown on the card. | `before/live-1366x768.png` |
| D14 | all | Two `<h1>` elements (mobile title and "Cameras near you"); no page title on desktop. | DOM |
| D15 | all | Numbers use the browser default monospace (`font-mono` maps to `ui-monospace`), not JetBrains Mono, and have no `tabular-nums`, so widths jump as values change. | `ui.ts`, CSS |
| D16 | all | Level history chart labels are SVG text at `fontSize 10` inside a scaled viewBox, which renders at ~9 px, below the 12 px floor. | `LevelHistoryChart.tsx:34` |
| D17 | all | Water level card has no "last changed" time and no trend icon; trend is only in prose. | `before/live-1920x1080.png` |
| D18 | all | Big dead area under the centre column on desktop (centre column ends ~950 px, side columns run to ~1230 px). | `before/live-1366x768-full.png` |
| D19 | all | Grid view shows only the first 4 cameras (`slice(0, 4)`), silently hiding the rest. | `CameraGrid.tsx:22` |
| D20 | all | Card padding and gaps are inconsistent: 10 px (`p-2.5`), 12, 16 mixed; gaps 10 / 12 / 16. | source |
| D21 | 390x844 | View toggle and four overlay chips take two full rows above the feed header. | `before/live-390x844.png` |
| D22 | all | Wizard: no focus trap (Tab escapes the dialog); on phones it is a 92vh sheet, not full height; line pills can overlap each other when two lines are close and can cover zone handles near the right edge; the "⇅" glyph is a text character used as an icon. | `AddCameraWizard.tsx`, `CalibrationCanvas.tsx:118` |
| D23 | all | Loading skeleton uses a different grid from the real page, so the layout shifts when data arrives. | `Skeleton.tsx` |
| D24 | 390x844 | Selected camera chip on phones uses a 2 px border and unselected 2 px slate, so chips look heavy; selected cards use `shadow-md` against the `shadow-sm` rule. | `before/live-390x844.png` |
| D25 | all | Camera details rows use `font-semibold` for coordinates in Inter, not mono. | `before/live-1920x1080.png` |
| D26 | all | `AlertToast` on phones sits 80 px from the top, which can overlap the page title. On desktop it is fine. | `AlertToast.tsx:28` |

## Plan (fix order)

1. Backend connection: self-recovering store (D6), compact status banner (D7).
2. Tokens in `components/live/shared/ui.ts`: spacing, type scale, mono numerals (D15, D20).
3. Container-query layout and auto-compact sidebar (D1 to D5, D14, D18, D21).
4. Components: camera card, feed header, overlay toggles, capture strip, water card, chart, details, alerts, grid (D8 to D13, D16, D17, D19, D24, D25).
5. States: skeleton matches layout, stale overlay wired, offline copy (D10, D11, D23).
6. Wizard: focus trap, full-height phone sheet, non-overlapping pills (D22).
7. Map: routes bend around vision zones (S5). Remove dead 3D code and lazy-load `/studio` (S2, S3).
8. Accessibility sweep, then the full viewport matrix.

## Result (after the polish pass)

All screenshots below are in `docs/screenshots/after/`, captured against the real backend (`:8080`) unless noted.
States that need the backend to change were driven on an isolated pair (`:5174` -> `:8091`) so the main servers were
never restarted; that backend used `VISION_SAMPLE_CLOCK_OFFSET_S` to reach states on demand.

### Viewport matrix (`live-<W>x<H>.png`)

| Viewport | Content width | Layout | H-scroll | Text < 12px | Console errors | Failed requests |
|---|---|---|---|---|---|---|
| 1920x1080 | 1660 | 3 col | no | 0 | 0 | 0 |
| 1536x864 | 1276 | 3 col (full sidebar) | no | 0 | 0 | 0 |
| 1440x900 | 1364 | 3 col (icon rail) | no | 0 | 0 | 0 |
| 1366x768 | 1290 | 3 col (icon rail) | no | 0 | 0 | 0 |
| 1280x720 | 1204 | 2 col | no | 0 | 0 | 0 |
| 1024x768 | 948 | 2 col | no | 0 | 0 | 0 |
| 820x1180 | 744 | 1 col, 2-up analysis | no | 0 | 0 | 0 |
| 768x1024 | 692 | 1 col, 2-up analysis | no | 0 | 0 | 0 |
| 430x932 | 430 | phone | no | 0 | 0 | 0 |
| 390x844 | 390 | phone | no | 0 | 0 | 0 |
| 360x740 | 360 | phone | no | 0 | 0 | 0 |
| 1366 / 1440, sidebar expanded (`-sidebar-expanded`) | 1106 / 1180 | 2 col | no | - | 0 | - |

### States (`state-<W>x<H>-<state>.png`, at 1366x768 and 390x844)

| State | Result |
|---|---|
| loading | skeleton uses the real grid |
| backend-down | one-line notice, chip says "Sample data" |
| recovered | switched to live data by itself (no reload) about 5 s after the server came up |
| toast | WARNING escalation: toast + browser notification ("FloodWay WARNING …") + Recent alerts |
| reconnecting | chip says "Reconnecting" when the server dies with the page open |
| stale | stale overlay / "Stale feed" status after the cycle overruns |
| (reconnect) | websocket reconnected on its own after the server returned |
| grid | all 12 cameras, equal tiles |
| one-camera / my-cameras / empty | search to 1 result; My cameras tab; no-match search with "Clear search" |
| offline-camera | offline overlay, "no frames yet", "Try now" |
| long-name | 70+ character name truncates with a title tooltip |
| map-route-avoids-zone | route bends around a WARNING camera zone; panel says so |

Wizard (`wizard-*` in the session scratch, summarised): focus trapped (25 Tabs stayed inside), validation error,
SSRF rejection ("This URL can't be used: that address is on a private or reserved network."), real preview frame,
lines moved by keyboard, pills never overlap, test result, Escape closes. Checked at 1366x768 and 390x844.

### Accessibility (automated, `prefers-reduced-motion: reduce`)

- Keyboard: 31 focus stops at 1366 and 18 at 390 inside `<main>`, all with a visible focus indicator.
- Contrast: 149 (desktop) and 91 (phone) text nodes checked against WCAG AA; 0 below threshold.
- No CSS animation runs under reduced motion.

### Build and tests

- `npm run build`: passes (three.js now a separate 922 kB chunk that only `/studio` loads).
- `npx tsc -b`: clean.
- `pytest -q` (backend): 60 passed (58 original + 2 new).
- Frontend: 26 passed with `npx vitest@2.1.9 run` (vitest is not a project dependency; run through npx).
