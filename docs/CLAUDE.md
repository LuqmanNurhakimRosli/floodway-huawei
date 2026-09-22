# FloodWay AI Instructions

## Before Making ANY Changes

1. **Read** `/docs/00_PROJECT_CONTEXT.md` — understand what this project is
2. **Read** `/docs/09_AI_HANDOVER.md` — understand what previous AI did, warnings, dangerous files
3. **Read** `/docs/13_KNOWN_ISSUES.md` — avoid fixing already-known issues without checking context
4. **Follow** `/docs/14_CODING_CONVENTIONS.md` — maintain existing patterns

## Project Summary

FloodWay is an AI-powered flood preparedness system combining:
- **IoT** — ESP32 water level sensor via Web Serial API
- **ML** — ANN flood prediction model (FastAPI backend)
- **Community Sentinel** — Crowd-sourced flood reports with dual AI+Human verification
- **Emergency Navigation** — OSRM routing with flood zone avoidance
- **3D Visualization** — WebGL flood simulation (React Three Fiber)
- **Firebase** — Authentication + Firestore for report persistence

## Critical Rules

1. **Do NOT rewrite architecture** unless explicitly asked
2. **Preserve Firebase schema** — do not change Firestore collection names or document structure
3. **Do NOT modify `isFullyVerified()`** in `src/types/report.ts` — it controls report visibility
4. **Do NOT change seed report IDs** — `demo-masjid-india-2026`, `demo-jln-ampang-2026`
5. **Do NOT remove auth guards** — `RequireAuth` / `RedirectIfAuthed` in `App.tsx`
6. **Update `/docs/10_DEVELOPMENT_LOG.md`** after making changes

## Quick Reference

| Need | Read |
|---|---|
| Architecture | `/docs/01_ARCHITECTURE.md` |
| Tech stack | `/docs/02_TECH_STACK.md` |
| Features | `/docs/03_FEATURES.md` |
| File locations | `/docs/04_FOLDER_STRUCTURE.md` |
| Database | `/docs/05_DATABASE_SCHEMA.md` |
| APIs | `/docs/06_API_REFERENCE.md` |
| IoT system | `/docs/07_IOT_SYSTEM.md` |
| 3D module | `/docs/08_3D_MODULE.md` |
| TODOs | `/docs/11_TODO.md` |
| Prompts | `/docs/12_PROMPT_LIBRARY.md` |

## Tech Stack (Quick)

- React 19 + TypeScript + Vite 7 + Tailwind CSS 4
- Firebase (Auth + Firestore)
- Leaflet (maps) + Three.js (3D) + OSRM (routing)
- FastAPI + TensorFlow (backend)
- Gemini 1.5 Flash (image verification)
