# FloodWay — Prompt Library

## Context-Loading Prompt

Use this at the start of any AI session:

```
Read the following files before making any changes:
1. /docs/00_PROJECT_CONTEXT.md
2. /docs/09_AI_HANDOVER.md
3. /docs/13_KNOWN_ISSUES.md

This is a multi-module IoT + Flood Analytics + Emergency Navigation + 3D Visualization project.
Do not rewrite existing architecture unless explicitly asked.
```

## Feature Development

```
You are working on FloodWay, an AI-powered flood preparedness system.

Before implementing any feature:
1. Read /docs/01_ARCHITECTURE.md to understand the system layers
2. Read /docs/04_FOLDER_STRUCTURE.md to find relevant files
3. Read /docs/14_CODING_CONVENTIONS.md for patterns
4. Check /docs/09_AI_HANDOVER.md for warnings about dangerous files

After completing work:
1. Update /docs/10_DEVELOPMENT_LOG.md with what you did
2. Update /docs/11_TODO.md if applicable
3. Update /docs/13_KNOWN_ISSUES.md if you found bugs
```

## Bug Fixing

```
Read /docs/13_KNOWN_ISSUES.md first. The bug may already be documented.
Read /docs/09_AI_HANDOVER.md for warnings about dangerous files.
Read /docs/01_ARCHITECTURE.md to understand data flow.

Key debugging files:
- AppContext.tsx: Global state (IoT, reports, navigation)
- reportsService.ts: Firestore interactions
- pathfinding.ts: Route calculation
```

## IoT Work

```
Read /docs/07_IOT_SYSTEM.md for the complete IoT architecture.

Key files:
- src/hooks/useBluetooth.ts (Web Serial connection)
- src/components/IoTWidget.tsx (UI)
- src/components/EmergencyAlert.tsx (danger alerts)
- src/store/AppContext.tsx (auto-report logic, lines 209-261)

WARNING: Do not change baud rate (115200) without updating ESP32 firmware.
```

## 3D Simulation Work

```
Read /docs/08_3D_MODULE.md for the simulation architecture.

Key file: src/pages/SimulationPage.tsx (856 lines)
This file contains GLSL shaders, Three.js components, and UI controls.

Dependencies: @react-three/fiber, @react-three/drei, three
3D model: public/city.glb (Blender export)
```

## Report System Work

```
Read /docs/05_DATABASE_SCHEMA.md for Firestore structure.
Read /docs/06_API_REFERENCE.md for service functions.

Key files:
- src/types/report.ts (types + isFullyVerified logic)
- src/services/reportsService.ts (Firestore CRUD)
- src/utils/aiVerification.ts (Gemini integration)
- src/components/report/* (UI components)

WARNING: Do not modify seed report IDs or isFullyVerified() without understanding consequences.
```

## Navigation System Work

```
Read /docs/01_ARCHITECTURE.md Layer 3 for navigation architecture.

Key file: src/utils/pathfinding.ts
- OSRM public API integration
- Cluster-Dodge flood avoidance algorithm
- Ray Casting point-in-polygon tests
- Fallback bezier route generation

Flood zones: src/data/floodZones.ts
Shelters: src/data/locations.ts
```

## Code Review / Cleanup

```
Read /docs/14_CODING_CONVENTIONS.md for project patterns.
Read /docs/09_AI_HANDOVER.md for unfinished systems and technical debt.
Read /docs/11_TODO.md for known cleanup tasks.

Focus areas:
- Legacy code in src/screens/ (unused)
- Inconsistent styling (inline CSS vs Tailwind vs CSS files)
- Large files needing decomposition (SimulationPage, HomePage)
```
