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
