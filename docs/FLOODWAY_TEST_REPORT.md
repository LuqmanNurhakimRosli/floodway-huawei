# FloodWay test report

**Date:** 2026-10-19 · **Branch:** `ccr-693c90f8-qu560k` · **Machine:** Linux cloud container, Node 20, Python 3
(backend venv), headless Chromium. No Android SDK, emulator or phone.

Every result below was produced by running the command shown. Anything that was not run is listed in section 3.

## 1. Results

### 1.1 Web app (`frontend/`)

| Check | Command | Result |
|---|---|---|
| Typecheck, unit tests, build | `npm run check` | **Pass.** tsc clean; Test Files 14 passed (14), Tests 167 passed (167); `vite build` succeeded. Main chunk `index-*.js` 529.68 kB (gzip 165.88 kB); was 782.75 kB (gzip 229.92 kB) at commit `6643e4f` |
| Route audit | `CHROME_PATH=<headless shell> node scripts/route-audit.mjs` (backend and dev server running) | **Pass.** 117 loads (13 routes x 9 viewports from 320x640 to 1920x1080), 0 failing, 0 page errors, 0 console errors, 0 failed own requests, 0 own HTTP errors, 0 pages with horizontal scroll, 0 touch targets under 44 px on phones. Failed outside hosts: `{a,b,c,d}.basemaps.cartocdn.com`, `tile.openstreetmap.org` (blocked by the sandbox; the map switches to its offline street map) |
| Malformed saved profile | Chromium script, `floodway_user` set to `{"name":1,"email":null}`, `not json`, `[]`, open `/home` | **Pass.** 3 of 3 load `/home`, 0 page errors, error screen not shown |

Route audit routes: `/`, `/home`, `/map`, `/live`, `/studio`, `/control`, `/reports`, `/navigation/shelter-01`,
`/navigation/no-such-centre`, `/profile`, `/shelters`, `/simulation`, `/no-such-page`.

### 1.2 Backend (`backend/`)

| Check | Command | Result |
|---|---|---|
| Unit and API tests | `.venv/bin/python -m pytest -q` | **Pass.** 152 passed, 2 warnings (Starlette TestClient deprecation notices) |
| New: telemetry auth and predict bounds | `tests/test_ingest_auth.py` | 4 passed (included above) |

### 1.3 Android app (`mobile/`)

| Check | Command | Result |
|---|---|---|
| Typecheck (strict) | `npx tsc --noEmit` | **Pass**, no errors |
| Unit tests | `npx jest` (`npm run check` runs both) | **Pass.** Test Suites 4 passed (4), Tests 16 passed (16) |
| Android JS bundle | `EXPO_OFFLINE=1 npx expo export --platform android --output-dir dist` | **Pass.** "Android Bundled … (1273 modules)"; one Hermes bytecode bundle of 3,025,955 bytes; 27 assets. Shared web modules are inside the bundle (their label strings were found in it) |
| Native project and manifest | `EAS_BUILD_PROFILE=<profile> npx expo prebuild --platform android --no-install --clean` | **Pass.** Package `com.floodway.mobile`, versionCode 1 (SDK levels come from React Native 0.88's Gradle defaults: minSdk 24, targetSdk 36, compileSdk 37; Gradle wrapper 9.4.1). Permissions kept: coarse and fine location, internet, notifications, vibrate. Removed (`tools:node="remove"`): background location, system alert window, read and write external storage. `usesCleartextTraffic` true for `preview`, false for `production` |
| Screens render (smoke test) | `expo export --platform web` with react-native-web installed temporarily (`--no-save`, then pruned), each route opened in Chromium at 390x844 against the local backend | **Pass with one expected gap.** Home, Family, Alerts, Guide, Settings: 0 page errors, 0 console errors, live data shown ("Live, updated just now", sample camera labels). Map: the screen renders, but its WebView reports "React Native WebView does not support this platform": WebView needs Android, so this is expected on web, not a defect |
| Map page in the WebView | The page from `mapHtml()` opened in Chromium with a stub `ReactNativeWebView`, then `window.fw.setData(...)` | **Pass.** 0 page errors. Messages in order: `ready`, `basemap: offline` (tiles blocked), `shelter: s1` after a tap. 2 zones and 1 centre drawn; attribution reads "Offline map: saved roads only". Zone labels are set with `textContent` (code review) |

Unit tests cover: `liveOrCached` (live, cached fallback with its saved time, nothing saved, corrupt saved copy),
`dataAgeText`, `normaliseServerUrl`, `validPhone`, malformed saved contacts, `newAlerts` (unseen WARNING/DANGER,
oldest first), `notifyNewAlerts` (first run records only; later runs notify once; nothing when switched off),
`floodZones` (online WARNING/DANGER cameras only), `myRisk` (no location; inside a camera zone = flooded; demo areas
never count).

Screenshots: `docs/screenshots/mobile-2026-10-19/` (web-rendered screens and the offline map page). These are
browser renders for evidence, not phone screenshots.

## 2. Bugs found by these tests and fixed

| Found by | Problem | Fix |
|---|---|---|
| `tsc` | `react-native-webview` types its component with iOS, Android and Windows props intersected, which collapses to `never` | The map screen uses the Android prop type once, with a comment (`map.tsx`) |
| `tsc` | TypeScript 6 no longer loads `@types` packages automatically, so test globals were unknown | `types: ["jest", "node"]` in `mobile/tsconfig.json` |
| Map page test | If Android restarts the WebView, a second `ready` would not resend the data, leaving an empty map | `ready` became a counter, so each new page gets the data |
| Prebuild manifest | The template added overlay and legacy storage permissions the app does not use | Added to `blockedPermissions` |
| Prebuild manifest | Release builds block `http://`, so a preview APK could never reach a LAN demo backend | `app.config.js` allows it except in production |

## 3. Not tested, and why

| Item | Reason | What it takes |
|---|---|---|
| **APK / AAB build** | No Android SDK; dl.google.com and api.expo.dev are blocked by the sandbox network policy | `eas build` from a machine with network access, or a local SDK (see `FLOODWAY_MOBILE_SETUP.md` §5) |
| **App on a phone or emulator** | No emulator or device here | The checklist in `FLOODWAY_MOBILE_SETUP.md` §6 |
| Location prompt, notifications, share sheet, calls on Android | Native features; need a device | Same checklist |
| Online map tiles in the app | Tile hosts blocked here | Device test with network |
| AI photo check end to end | openrouter.ai blocked | One run with network access and a key held on the server |
| Telegram delivery | No bot token configured here. By code reading, the route returns `sent: false, simulated: true` when it cannot deliver | Configure the bot on the server |

No result in this report comes from a device, and no APK exists yet.
