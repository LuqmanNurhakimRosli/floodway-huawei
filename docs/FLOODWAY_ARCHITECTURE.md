# FloodWay architecture

FloodWay has three parts: one backend, a web app, and an Android app. Both apps read the same backend API. The
Android app also reuses the web app's logic, the parts with no UI, so both apps make the same decisions about flood
levels, zones and risk.

```
                      ┌──────────────────────────── backend/ (FastAPI, Python 3) ────────────────────────────┐
 sample cameras ───►  │ vision/engine.py ─► analysis/ (classical, waterline) ─► fault_filter ─► levels.py       │
 user cameras / photo │        │                                                         │                       │
 depth nodes (/ingest)│        ▼                                                         ▼                       │
                      │   vision/alerts.py ──► barriers.py (simulated)   services/forecaster.py (rule-based)    │
                      │   routes: /api/v1/vision/*  /reports  /shelters  /predict  /sos  /alerts/telegram  …  │
                      └──────────────▲──────────────────────────────────────────────▲────────────────────────┘
                                     │ HTTPS/HTTP JSON + WebSocket                  │ HTTPS/HTTP JSON
                 ┌───────────────────┴───────────────┐            ┌─────────────────┴──────────────────────┐
                 │ frontend/ (React 19, Vite, Leaflet)│            │ mobile/ (Expo, React Native, TypeScript) │
                 │ pages, components, hooks, services │◄─ shares ──│ src/shared.ts imports frontend/src/lib,  │
                 │ lib/ (pure rules)  types/  data/   │  UI-free   │ types and data through the @web alias    │
                 └────────────────────────────────────┘   code     └──────────────────────────────────────────┘
```

## Backend (`backend/`)

| Part | Role |
|---|---|
| `app/vision/` | Camera pipeline: frame sources (sample ladder, URL, upload), analysers, the fault filter (holds jumps faster than water can rise), level rules (`levels.py`, guard rail), alerts with lead-time, simulated underpass barriers, storm lab |
| `app/routes/` | `reports`, `shelters`, `predict` (rule-based), `sos` (broadcast, check-in), `alerts` (Telegram, reports honestly when it is not configured), `ai_check` (OpenRouter photo check), `telemetry` (`/ingest` for depth nodes), `twin` |
| `app/security.py` | `require_write_token`: every route that writes state or takes a file depends on it. When `VISION_WRITE_TOKEN` is unset (local development) it allows everything |
| `app/config.py` | Device registry for signed telemetry, `MAX_SKEW_SECONDS` (120) |
| `tests/` | pytest, 152 tests |

## Web app (`frontend/`)

- `App.tsx`: routes, `ProtectedRoute`, a per-route `ErrorBoundary`, and lazy loading for every page but Welcome and Home.
- `lib/`: pure logic with tests: `vision/levelRules.ts` (levels, palette, alert levels), `vision/hazards.ts`
  (camera zones), `verifiedReports.ts` (verified-report areas, decay with age), `family.ts` (risk at a point,
  nearest open centre, distance text), `home.ts` (overall level, freshness), `mappers.ts` (API to app types), `routing.ts`.
- `components/map/BaseMap.tsx`: tiles from CARTO, then OpenStreetMap, then an offline street map drawn from the stored
  routes.
- `services/vision/visionApi.ts`: API client with timeouts.

## Android app (`mobile/`)

Expo SDK 58, React Native 0.88, React 19.3, expo-router 58, TypeScript strict, new architecture and Hermes on.

| Folder | Role |
|---|---|
| `src/app/` | Routes (expo-router). `_layout.tsx` wraps everything in `SafeAreaProvider` → `DataProvider` → `LocationProvider`. `(tabs)/` holds Home, Map, Family, Alerts, Guide; `settings.tsx` is a stack screen |
| `src/shared.ts` | The **only** place shared code comes in from `frontend/src` (types, mappers, level rules, hazards, verified areas, family risk, demo areas). Anything imported here must not import React DOM, Leaflet, lucide or browser APIs |
| `src/lib/api.ts` | `GET` with a 10 s timeout against the configured server: cameras, alerts, shelters, reports |
| `src/lib/cache.ts` | `liveOrCached()`: live data is saved with its time; when the server fails, the saved copy comes back marked not live. `dataAgeText()` gives "Live, updated 2 min ago" or "Saved 3 h ago, not live" |
| `src/lib/data.tsx` | Loads the four feeds, refreshes every 60 s **only while the app is in the foreground**, no overlapping refreshes, hands live alerts to `notify.ts` |
| `src/lib/location.ts` | Checks existing permission on start; the system prompt appears only when the user taps "Use my location". Foreground, balanced accuracy, one fix at a time. The position stays on the phone |
| `src/lib/notify.ts` | Local notifications on Android channel `flood-alerts` for new WARNING/DANGER alerts. The first run only records alerts, so old ones are not replayed |
| `src/lib/zones.ts` | Map zones from cameras and verified reports (shared rules); demo areas apart; `myRisk()` ignores the demo areas |
| `src/map/` | `mapHtml.ts` is a Leaflet page for the WebView. Leaflet and 70 simplified KL roads are embedded (`assets.generated.ts`, built by `scripts/embed-map-assets.mjs`), so the map opens with no connection. It uses the same tile order as the web app. Labels are written as text, not HTML |
| `src/components/ui.tsx`, `src/theme.ts` | Screen, Card, Button (48 dp minimum), Pill, LevelBadge (word plus shape, never colour alone), brand blue tokens |

### Data flow on the phone

1. `DataProvider` calls `liveOrCached('cameras', api.cameras)` (and the other three feeds).
2. Server answers → data shown with "Live, updated …" and saved to AsyncStorage with the time.
3. Server fails → the saved copy is shown with "Saved … ago, not live"; with no saved copy the screen says there is no
   data. Old data is never shown as current.
4. Map: the screen builds a `MapPayload` (you, centres, zones) and sends it into the WebView with `window.fw.setData`.
   The page reports `ready`, `basemap` (street or offline) and taps on centres.

### Sharing code between web and mobile

- `mobile/tsconfig.json` paths: `@web/*` → `../frontend/src/*`.
- `mobile/metro.config.js`: `watchFolders` includes `../frontend/src`; modules resolve from `mobile/node_modules`.
- Rule: shared modules stay UI-free. `levelRules.ts` was split out of `levels.ts` for this reason (icons stay web-side).

### Privacy and permissions

| Permission | Why | When asked |
|---|---|---|
| Coarse and fine location | Your risk, nearest open centre, map dot | Only on "Use my location" |
| Notifications | Alerts while the app is open | Only on the Alerts toggle |
| Background location | Not used | Removed from the manifest |
| Overlay, legacy storage | Not used | Removed from the manifest |

Stored on the phone only: server URL, cached feeds, emergency contacts, go-bag checklist, seen alert IDs. No account,
no upload of position. "Send my location" hands a message to the share sheet, and the user picks who gets it each time.

### Build configuration

- `app.json`: package `com.floodway.mobile`, versionCode 1, permissions, plugins.
- `app.config.js`: allows plain `http://` except when `EAS_BUILD_PROFILE=production`.
- `eas.json`: `development` (dev client APK, emulator backend `http://10.0.2.2:8080`), `preview` (APK),
  `production` (AAB). Preview and production need `EXPO_PUBLIC_API_BASE` set to the real backend.

## What is real, simulated, or not built

| Real | Simulated or sample | Not built |
|---|---|---|
| Camera pipeline, uploads, alerts, fault filter, OSM road routes, offline cache, local notifications | Sample cameras and frames, relief centres, flood-prone areas, reports, family members on the web map, underpass barriers, forecast inputs | Government camera feeds, agency verification, Huawei Cloud calls, push to a closed app, family location sharing server |
