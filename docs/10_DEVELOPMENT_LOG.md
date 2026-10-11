# FloodWay — Development Log

## 2026-05-09

### AI Documentation System Created
- Created modular `/docs` directory with 16 focused markdown files
- Created `/CLAUDE.md` root-level AI instruction file
- Documented entire architecture, tech stack, features, database schema
- Documented IoT system, 3D module, API reference, coding conventions
- System designed for low-token AI sessions with selective reading

### Manual Location Pinning for Reports
- Added interactive map picker to `EmergencyMode.tsx`.
- Users can now click "Pin on Map" to manually select coordinates.
- Submission logic prioritizes pinned location over automatic GPS coordinates.
- Files: `src/components/report/EmergencyMode.tsx`, `src/components/report/EmergencyMode.css`

### Navigation Bar Reordering
- Rearranged bottom navigation tabs to: Home, Simulate, Reports, Shelter, Profile.
- Updated `src/components/BottomNav.tsx` and related architecture documentation.

### Camera Black Screen and Glitching Fix on Laptop
- Fixed `useCamera.ts`: added constraint fallback chain (environment → user → any camera)
- Fixed `useCamera.ts`: added `loadedmetadata` event wait before `video.play()` to prevent race condition
- Fixed `useCamera.ts`: **Major Fix** refactored to use `useRef` for stream state, making `startCamera` and `stopCamera` stable. This resolved an infinite loop where updating the stream state caused the `stopCamera` callback to change, triggering the `useEffect` in `EmergencyMode` to restart the camera repeatedly (the "glitching").
- Fixed `EmergencyMode.tsx`: replaced `URL.createObjectURL()` with `FileReader.readAsDataURL()` for proper base64 data URLs
- Files: `src/hooks/useCamera.ts`, `src/components/report/EmergencyMode.tsx`

### IoT Automated Reporting (Session: 48c8fcaf)
- Implemented background listener in `AppContext.tsx` for IoT DANGER status
- Auto-generates FloodReport when water level hits DANGER
- Daily limit: one sensor report per day (prevents spam)
- Re-submission allowed if moderator deletes the previous report
- Dynamic map marker color: blue (normal) → red (DANGER)

## 2026-05-02

### IoT Sensor Integration (Session: 0ef699e6)
- Built `useBluetooth.ts` hook (Web Serial API for ESP32)
- Created `IoTWidget.tsx` — water tank visualization with minimize/expand
- Created `EmergencyAlert.tsx` — full-screen modal with vibration + audio
- Added `IOT_SENSOR_LOCATION` constant in `locations.ts`
- Distance tracking from user to sensor (Haversine)
- 3km proximity check for emergency alerts
- Map auto-focus on sensor location from IoT widget

### Firebase Auth Fix (Session: 17b6fddc)
- Replaced placeholder `.env` values with real Firebase config
- Fixed authentication flow (login → redirect to /home)

## 2026-10-11 (demo-polish)

### Plan B executed: demo readiness pass
- Home redesigned as a command centre; every number is computed from data or labelled simulated. Old Home components removed.
- Honesty pass: removed fabricated verification and certification claims (JPS, NADMA, APM, Huawei ModelArts), the fake "live CCTV" modal,
  invented AI verification fallbacks, and an auto-VERIFIED report endpoint. Forecast labelled as a formula.
- Secrets: Telegram token and OpenRouter key moved server-side; the build no longer contains them. Write endpoints (cameras, alerts,
  SOS, AI check) accept an operator token (`VISION_WRITE_TOKEN`). `/sos/*` was an open, unescaped Telegram relay and is fixed.
- Backend: `POST /cameras` returned 500 (fixed earlier), shelters and reports mapped from snake_case, sample cameras backed by photos.
- Tooling: `scripts/check.ps1`, `npm run check`, `npm run layout-check` (overlaps, horizontal scroll, text under 12 px), vitest.
- Known defect: the Plan A water frames are a drawn rectangle (`sample_media/check_realism.py`). See `docs/DEMO_RUNBOOK.md`.
- Docs: `docs/DEMO_AUDIT.md`, `docs/PLAN_A_GEMINI_MEDIA.md`, `docs/PLAN_B_SYSTEM_UPGRADE.md`, `docs/DEMO_RUNBOOK.md`.

## 2026-10-11

### Live Vision polish pass (branch `live-vision-polish`)
- Audited the Antigravity Live Vision integration against the running app; findings and evidence in `docs/LIVE_VISION_AUDIT.md`.
- Layout now follows the width of the page's content area (Tailwind container queries), fixing overlapping columns at 1024px and the crushed feed at 1366px; sidebar starts as an icon rail on /live below 1536px.
- Store recovers from sample data when the server comes up (the "Showing sample data" banner used to stick until reload).
- Backend: `POST /cameras` returned 500 and new cameras were never analysed (task spawned off the event loop); fixed with a regression test. Added `VISION_SAMPLE_CLOCK_OFFSET_S` (testing aid, backend only).
- Map: evacuation routes bend around Live Vision WARNING/DANGER zones.
- Removed the unreachable 3D SimulationPage and components/simulation; /studio is lazy-loaded so three.js no longer loads on every page.
- Wizard: focus trap, full-height phone sheet, non-overlapping calibration pills. Contrast raised to WCAG AA.
- Files: frontend/src/pages/LiveVisionPage.tsx, frontend/src/components/live/**, frontend/src/lib/vision/**, frontend/src/hooks/vision/**, frontend/src/services/vision/visionStore.ts, frontend/src/components/map/ShelterMapView.tsx, frontend/src/App.tsx, backend/app/vision/{engine,config,seed}.py.

---

## Format for Future Entries

```markdown
## YYYY-MM-DD

### [Change Title]
- What was changed
- Why it was changed
- Files affected
- Session ID (if applicable)
```
