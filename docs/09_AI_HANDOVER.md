# FloodWay — AI Handover Document

> **This is the most important file for future AI models.** Read this FIRST.

## What Previous AI Sessions Have Done

### Session History (chronological)

1. **Codebase Exploration** — Read and understood the complete project structure
2. **IoT Sensor Integration** — Built the ESP32 Web Serial system:
   - `useBluetooth.ts` hook for serial communication
   - `IoTWidget.tsx` water tank visualization
   - `EmergencyAlert.tsx` proximity-based danger alerts
   - Distance calculation from user to sensor
   - Map auto-focus on sensor location
3. **Automated IoT Flood Reporting** — Added automatic report generation:
   - Background listener in AppContext watches IoT status
   - Generates FloodReport on DANGER status
   - Daily limit to prevent spam
   - Re-submission if moderator deletes the report
   - Dynamic map marker color (blue → red on DANGER)
4. **AI Documentation System** — Created this modular `/docs` system

## Current Project State (as of 2026-05-09)

- **Frontend**: Fully functional, deployed on Netlify
- **Backend**: Works locally with `uvicorn`, not deployed
- **IoT**: Requires physical ESP32 + Chrome/Edge browser
- **Demo Mode**: `HomePage.tsx` has `hasDanger = true` hardcoded (line ~39)
- **Firebase**: Production Firestore with seed reports active
- **Gemini**: Works if `VITE_GEMINI_API_KEY` is set in `.env`

## Architectural Decisions & Reasoning

| Decision | Rationale |
|---|---|
| React Context over Redux | Simpler for FYP scope; no need for middleware |
| Optimistic updates | UX feels instant; Firestore syncs in background |
| Fixed seed IDs for demo reports | `setDoc` is idempotent — prevents duplicate seed data |
| Session-only report deletion | Preserves Firestore data; moderator can hide without destroying |
| OSRM public API over Google Maps | Free, no API key, sufficient for demo |
| Mock predictions as fallback | App works without Python backend running |
| Web Serial over Web Bluetooth | ESP32 USB is more reliable than BLE pairing |
| Tailwind 4 (not v3) | Using latest with `@tailwindcss/vite` plugin |

## Warnings — Do Not Break These

1. **Do NOT change seed report IDs** in `reportsService.ts` — they must remain `demo-masjid-india-2026` and `demo-jln-ampang-2026`
2. **Do NOT delete the `ensureSeedDocs()` call** in `fetchReports()` — it maintains demo data
3. **Do NOT remove the `RequireAuth` / `RedirectIfAuthed` guards** in `App.tsx`
4. **Do NOT modify `firestore.rules`** without understanding the auth implications
5. **Do NOT change the Web Serial baud rate** (115200) without updating the ESP32 firmware
6. **Do NOT remove the `lastTriggeredStatus` ref** in AppContext — it prevents infinite IoT report loops
7. **Do NOT touch `FLOOD_ZONES` polygon data** without testing route safety calculations
8. **Do NOT modify `isFullyVerified()`** in `report.ts` — it's the source of truth for map visibility

## Dangerous Files (Edit with Extreme Care)

| File | Risk | Why |
|---|---|---|
| `AppContext.tsx` | 🔴 HIGH | Global state — everything depends on this |
| `reportsService.ts` | 🔴 HIGH | Firestore interactions, seed logic, deduplication |
| `pathfinding.ts` | 🟡 MEDIUM | Complex OSRM + flood avoidance algorithm |
| `SimulationPage.tsx` | 🟡 MEDIUM | 856 lines, GLSL shaders, tightly coupled |
| `report.ts` (types) | 🟡 MEDIUM | `isFullyVerified()` controls report visibility |
| `firebase.ts` | 🟡 MEDIUM | All Firebase services depend on this init |

## Unfinished / Incomplete Systems

| System | Status | What's Missing |
|---|---|---|
| `hasDanger` hardcode | Incomplete | Should use real prediction from backend |
| Report deletion | Partial | Only session-local; no real Firestore delete from moderator |
| WhatsApp integration | UI-only | Deep link exists but no backend messaging |
| CCTV feed | Static image | Not connected to real camera stream |
| Bluetooth hook name | Misleading | `useBluetooth.ts` actually uses Web Serial API, not Bluetooth |
| Legacy `screens/` folder | Dead code | Old prototype screens, unused by router |
| `docs.tsx` in src | Large file | 55KB in-app documentation component, may be outdated |
| `report feature/` folder | Archived | Standalone report prototype, no longer used |
| `Navigation app/` folder | Archived | Legacy navigation prototypes |

## Failed Approaches (Avoid Repeating)

1. **Web Bluetooth for ESP32**: Unreliable pairing, complex BLE protocol. Web Serial is far simpler.
2. **2D heatmap for flood visualization**: Users couldn't relate abstract colors to real physical depth. Switched to 3D.
3. **`addDoc` for seed reports**: Created duplicates every page load. Fixed with `setDoc` + stable IDs.
4. **Real-time Firestore listeners**: Unnecessary for this scale. Fetch-on-load is sufficient.

## Current Priorities

1. Prepare demo for FYP presentation
2. Ensure all features work end-to-end with IoT hardware
3. Keep Firebase costs low (avoid unnecessary reads/writes)
4. Document everything for handover

## Quick Start for New AI

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Start backend (optional, in separate terminal)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Related Docs

- Project Context: [00_PROJECT_CONTEXT.md](./00_PROJECT_CONTEXT.md)
- Architecture: [01_ARCHITECTURE.md](./01_ARCHITECTURE.md)
- Known Issues: [13_KNOWN_ISSUES.md](./13_KNOWN_ISSUES.md)
- Coding Conventions: [14_CODING_CONVENTIONS.md](./14_CODING_CONVENTIONS.md)
