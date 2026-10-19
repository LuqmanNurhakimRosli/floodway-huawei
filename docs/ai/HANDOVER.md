# Handover: FloodWay, state on 2026-10-19

Read `docs/ai/PROGRESS.md` first, then `AGENTS.md`. This file is the short version for a new chat.

## Branch and checks
- Branch `ccr-693c90f8-qu560k`. Push with `git push -u origin ccr-693c90f8-qu560k`. Do not open a PR unless asked.
- Frontend: `cd frontend && npm run check` (167 tests, tsc, build). Backend: `backend\.venv\Scripts\python.exe -m pytest -q` (148 passed on 2026-10-19).
- Layout: `CHROME_PATH=<browser> npm run layout-check` (set CHROME_PATH on machines without Chrome).

## What changed most recently
1. **Family map** (`/map`): Life360-style family circle. Only "You" can be a real position (opt-in phone GPS). Everyone else is simulated. Files: `lib/family.ts`, `data/familyDemo.ts`, `services/family/familyStore.ts`, `hooks/useFamily.ts`, `components/family/*`.
2. **Blue brand restored** (logo blue `#1677FF`, buttons `#0958D9`). The teal refresh is gone.
3. **Verified-report areas** (new):
   - `lib/verifiedReports.ts`: pure rules. Statuses `VERIFIED`, `AI_VERIFIED`, `OFFICIAL_VERIFIED` only. Reports within 1 km form one area. Strength counts distinct authors, not reports. Anonymous reports share one reporter. Radius 500 m + 400 m per extra reporter + 20 m per cm above 11 cm, capped at 5 km, rounded to 100 m. Amber below 30 cm median, red at or above. Fill opacity follows reporter count.
   - `components/map/VerifiedReportLayer.tsx`: draws the circles, a permanent label on each ("3 verified reports, 35 to 50 cm, 1.9 km radius"), and pins for every non-rejected report. Unverified pins are grey and draw no area.
   - Tests: `__tests__/verifiedReports.test.ts` (9 tests).
4. **Labels**: removed "prototype" and "mock" from the three visible strings (`AboutDemo`, `WelcomePage`, `ConnectionStatus`). Kept "demo", "sample" and "simulated" labels on purpose (see the honesty section).

## Map tiles and fonts
- `components/map/BaseMap.tsx` tries CARTO Voyager, then OpenStreetMap, then draws an offline street map from `data/klRoutes.json` (attribution reads "Offline map: saved roads only"). It re-probes the first provider every minute.
- Fonts ship with the app (`@fontsource-variable/outfit`, `@fontsource-variable/plus-jakarta-sans`, `@fontsource/jetbrains-mono`), imported in `main.tsx`.
- Cloud sessions block outside hosts, so tiles and openrouter.ai fail there; that is the sandbox, not the app.

## Demo film
- `booth/floodway-app-demo/` (see its README). Captures the running app, renders frame by frame, adds a generated score.

## Known gaps (not done)
- Done 2026-10-19: verified areas feed `useFloodZones`, so routing, the Safety tab and the Home family card all avoid them. Areas use reports from the last 6 hours, fade after 1 hour (dashed outline, lower opacity), and drop out at 6 hours. Reports carry `createdAt` (ms). Older data falls back to parsing `timestampStr`, and a report with no readable time does not count. Labels name AI-assessed reports, e.g. "2 verified reports (1 AI-assessed)".
- The backend `/reports` route does not send `createdAt` yet. The frontend mapper reads `createdAt` or `created_at` when it appears.
- **Demo flood areas are still hand-placed** (`FLOOD_PRONE` in `data/klDemo.ts`, 16 circles). Routing and the Safety tab depend on them.
- **Family circle is local to the browser** (localStorage). No accounts or server sync.
- **Seed reports** are demo data; their status pill reads "DEMO DATA".
- Touch-target pass on Home, Map, Reports, Profile is still open (see PROGRESS).

## Honesty rules (AGENTS.md, still binding)
- Sample cameras and frames are labelled SAMPLE. Never call them real or live.
- The forecast is a formula, not a trained model.
- No agency names or logos (JPS, DBKL, JKM, JKR, Bomba, MET) in any media.
- "AI_VERIFIED" counts as verified in the new map rule, as the product owner asked. An AI check is not a human verification. Revisit this before any public claim.
- "Production" wording is not supported by this codebase. The app is a competition prototype with demo data; it does not receive real river or citizen data.

## Where to look
- Map page: `components/map/ShelterMapView.tsx`
- Report status wording: `lib/reportStatus.ts`
- Depth thresholds: `lib/depthFromPhoto.ts` (`STREET_LEVELS`)
- Verified rules: `lib/verifiedReports.ts`
- Stored routes: `frontend/src/data/klRoutes.json` (rebuild with `node frontend/scripts/build_kl_routes.mjs`)
