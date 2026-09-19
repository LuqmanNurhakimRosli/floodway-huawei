# GEO-RESQ — UI/UX Design System, Component Architecture & Comprehensive Audit

**Platform:** GEO-RESQ (Autonomous Post-Disaster Intelligence Platform)  
**Target Application:** Tactical Emergency Operations Center (EOC) & Field Responder Decision Support  
**Competition Track:** Huawei ICT Competition 2026–2027 (APAC Innovation Track)  
**Date of Audit:** September 19, 2026  
**Status:** Live Working Prototype (Vite + React + TypeScript + Tailwind CSS + Leaflet)

---

## 1. Executive Summary & Design Vision

GEO-RESQ is designed to bridge the critical **"72-hour golden window"** post-disaster by ingesting satellite Earth Observation data (Sentinel-1 SAR / Sentinel-2 optical), executing AI change-detection and flood inundation segmentation via **Huawei ModelArts**, and translating complex geospatial matrices into **actionable tactical rescue corridors**.

The user interface serves two distinct target audiences:
1. **EOC Command Staff & Government Evaluators:** Require rapid macro-situational awareness, high-level casualty/inundation statistics, sensor latency metrics, and instant formal Situation Reports (SitRep).
2. **Tactical Rescue Responders (SMART / APM / Bomba):** Require granular, high-contrast route accessibility telemetry, pinpointed hazard obstacles (submerged bridges, road debris), and turn-by-turn viable corridors to critical infrastructure.

---

## 2. Component Architecture Breakdown

The interface is structured as an **instrument-grade tactical dashboard** maximizing map real estate while enclosing critical operational intelligence in modular floating panels:

```
+---------------------------------------------------------------------------------------+
|  HEADER HUD: Brand Logo | Scenario Selector | SAR Sensor Telemetry | UTC Clock | SitRep |
+-----------------------+-----------------------------------------------+---------------+
|                       |                                               |               |
|  LEFT LAYER PANEL     |               LEAFLET MAP VIEW                | RIGHT INTEL   |
|  - Basemap Selector   |  - SAR Inundation Polygon Overlays            |  - Priority   |
|  - Overlays (Flood,   |  - Damaged Structure Pins & Collapses         |    Severity   |
|    Roads, Routes,     |  - Viable (Green) & Impassable (Red) Polylines|  - Damage KPIs|
|    Facilities)        |  - Critical Facility SVG Markers              |  - Facilities |
|  - Opacity Sliders    |  - Coordinates & Zoom Level HUD Indicator     |  - Route Cards|
|  - Collapsible Drawer |  - Tactical Map Legend Floating Drawer        |  - Collapsible|
|                       |                                               |               |
+-----------------------+-----------------------------------------------+---------------+
|  BOTTOM EVENT SUMMARY: KPI Strip (AOI, Inundation km², Damaged, Routes) | Chronology  |
+---------------------------------------------------------------------------------------+
```

### 2.1 Header HUD (`frontend/src/components/layout/Header.tsx`)
- **Brand Identity:** Shield beacon icon with dynamic pulsing badge indicating operational phase.
- **Scenario Switcher:** Dropdown selector toggling between disaster theaters:
  - *Kajang & Hulu Langat River Surge (Malaysia)* — Tropical riverine surge scenario.
  - *Valencia Flash Flood (DANA Spain)* — Urban catastrophic flash flood scenario.
- **Sensor Telemetry Badge:** Live sensor metadata pill displaying Earth Observation platform (`Sentinel-1 C-SAR IW GRDH`), acquisition pass time, and real-time UTC synchronizer.
- **Action Controls:**
  - *View Reset:* Recenters viewport to current disaster bounding box.
  - *SitRep Generator:* Triggers autonomous formal report modal.
  - *Panel Toggles:* Individual icon toggles to maximize cartography screen area.

### 2.2 Left Layer Panel (`frontend/src/components/layout/LeftLayerPanel.tsx`)
- **Basemap Radio Selector:**
  - `Crisp Daylight (OSM)`: High-visibility standard OpenStreetMap cartography.
  - `Satellite Imagery`: Esri World Imagery (high-resolution optical Earth observation).
  - `Tactical Dark`: High-contrast dark EOC cartography.
- **Operational Layer List:**
  - *Flood Inundation Extent:* Sentinel-1 SAR C-band amplitude anomaly mask (cyan fill).
  - *Damaged Structures:* Siamese U-Net building change & collapse detection (red vector pins).
  - *OSM Road Accessibility:* Highway network graph intersected with flood contours (amber paths).
  - *Candidate Rescue Corridors:* Multi-criteria least-cost path avoiding water impedance (emerald paths).
  - *Critical Infrastructure Hubs:* Hospitals, APM staging posts, and evacuation centers (sky blue pins).
- **Interactive Layer Controls:** Individual eye toggles for visibility and continuous range sliders for alpha opacity adjustment (0% to 100%).

### 2.3 Map Viewport (`frontend/src/components/map/MapView.tsx`)
- **Leaflet Engine:** Zero-dependency, lightweight map renderer with smooth pan/zoom dynamics.
- **Spatial Feature Renderers:**
  - *Vector Polygons:* AI flood extents rendered with dynamic fill opacity and neon bounding borders.
  - *Multi-Color Polylines:* Highway routes color-coded by operational status:
    - `Viable`: Solid emerald green `#10b981` with active directional pulsing glow.
    - `Caution`: Solid amber `#f59e0b` indicating partial fringe water encroachment.
    - `Impassable`: Dashed red `#ef4444` denoting submerged road segments.
  - *Custom Tactical SVG Icons:* Pulse-halo markers for hospitals, command centers, and bridges.
- **HUD Micro-Overlays:**
  - *Top-center WGS84 HUD:* Real-time latitude, longitude, and zoom level indicator.
  - *Floating Tactical Legend:* Collapsible floating card explaining symbology, color codes, and sensor provenance.

### 2.4 Right Incident Intelligence Panel (`frontend/src/components/layout/RightAnalysisPanel.tsx`)
- **Priority Alpha Incident Banner:** High-urgency alert card with pulsing warning beacon, disaster classification, and inundated area calculation.
- **Damage Severity Breakdown:** Three-tier structural collapse breakdown with proportional progress bars:
  - *Destroyed / Collapsed:* Red accent bar.
  - *Major Structural Compromise:* Amber accent bar.
  - *Minor Inundation / Affected:* Yellow accent bar.
- **Critical Facilities Monitor:** Quick-status listing of local hospitals, logistics bases, and bridges with real-time operational badges (`OPERATIONAL`, `OVERLOADED`, `SUBMERGED`).
- **Rescue Corridor Cards:** Interactive cards allowing operators to click any route to automatically highlight and fly to that corridor on the map, displaying route distance (km), ETA (min), risk tier, and operational clearance details.

### 2.5 Bottom Event Summary (`frontend/src/components/layout/BottomEventSummary.tsx`)
- **KPI Strip (40px):** High-density horizontal ribbon presenting monitored AOI area, total flood square kilometers, damaged structures count, blocked road count, and viable route ratios.
- **Expandable Chronology Drawer:** Slide-up audit log showing chronological sensor acquisitions, model execution timestamps, and alert triggers.

### 2.6 Autonomous Situation Report Modal (`frontend/src/components/modals/SitRepModal.tsx`)
- Standard military/EOC formatted text output summarizing incident severity, sensor lineage, damage counts, facility statuses, and corridor clearances.
- Single-click **"Copy to Clipboard"** and **"Download .txt"** functionality for rapid incident commander briefing distribution.

---

## 3. Current Color Palette & Design Tokens

The current design utilizes a custom tactical palette defined via CSS variables in `index.css`:

| Token | Hex / Value | Semantic Role |
|---|---|---|
| `--geo-canvas` | `#06080e` | Master canvas background (deep space navy) |
| `--geo-panel` | `rgba(8, 12, 20, 0.85)` | Frosted glass panel backgrounds (16px blur) |
| `--geo-panel-header` | `rgba(8, 12, 20, 0.90)` | Top HUD and panel header background |
| `--geo-border` | `rgba(255, 255, 255, 0.06)` | Subtle panel dividers and bounding boxes |
| `--geo-border-accent` | `rgba(0, 212, 255, 0.40)` | Active focus states, active button borders |
| `--geo-text-primary` | `#e8ecf2` | Primary headings, KPI numbers, critical labels |
| `--geo-text-secondary` | `#a0aec0` | Subheadings, descriptive text |
| `--geo-text-tertiary` | `#5a6577` | Metadata, sensor specs, inactive controls |
| `--geo-accent` | `#00d4ff` | Primary telemetry accent (cyan glow) |
| `--geo-critical` | `#ff3b3b` | Collapsed buildings, impassable roads, level-3 alerts |
| `--geo-warning` | `#ffaa00` | Caution corridors, bridge scouring warnings |
| `--geo-success` | `#00e68a` | Viable rescue routes, operational hospital status |
| `--geo-info` | `#3b82f6` | General infrastructure POIs, sensor status |

---

## 4. Critical Design Evaluation & Honest Critique ("Critics")

While the interface is visually striking and packed with operational capabilities, an objective audit reveals several critical usability, accessibility, and architectural deficiencies:

### 4.1 The Dark Theme Ergonomics & Presentation Glare
- **The Problem:** The ultra-dark background (`#06080e`) with high-saturation neon accents (`#00d4ff`, `#ff3b3b`, `#00e68a`) creates severe eye fatigue under ambient daytime lighting.
- **Presentation Failure:** In competition pitch environments or emergency conference rooms, overhead projectors have poor contrast ratios; dark themes wash out into muddy gray, making road vectors and flood boundaries nearly invisible to judges.
- **Cognitive Load:** When every panel has glowing borders and frosted glass reflections, the visual hierarchy flattens—the operator's eye struggles to discern which element requires immediate action.

### 4.2 The "API Key Required" Third-Party Cartography Pitfall
- **The Problem:** The initial basemap configuration relied on CartoCDN dark tiles without explicit API keys. Carto recently changed their tile distribution policies to print large, diagonal `"API KEY REQUIRED"` watermarks across the map canvas.
- **The Impact:** Watermarks immediately ruin the perceived maturity and polish of the software, making it appear unfinished.
- **Remediation Implemented:** Replaced with **OpenStreetMap Daylight Standard Tiles** (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`), which are completely open-source, require zero tokens, and provide clean daytime contrast.

### 4.3 Typography Scale & WCAG 2.1 Contrast Issues
- **Micro-copy Overload:** Heavy reliance on `text-[10px]` and `text-[11px]` monospace labels (`font-mono`). While giving an authentic "military/terminal" aesthetic, it severely impedes readability for operators scanning screens from a distance of 1–2 meters in an EOC.
- **Muted Contrast:** The tertiary text token (`#5a6577`) on the dark panel background (`#080c14`) fails WCAG AA contrast ratio standards (measured at ~3.2:1 against the required 4.5:1 for body copy).

### 4.4 Fixed Desktop Layout vs. Mobile Field Responders
- **The Problem:** The entire application is anchored to fixed desktop viewports (`h-screen overflow-hidden`) with fixed 300px and 360px sidebars.
- **The Impact:** While suitable for a command center dual-monitor workstation, it cannot be operated on mobile smartphones or rugged tablets (e.g. Huawei MatePad) used by tactical personnel in rescue boats or field vehicles.

### 4.5 Marker & Vector Density at Scale
- **The Problem:** Rendering individual SVG markers for all 142 damaged structures causes visual clutter and browser DOM slowdown when zoomed out to regional scale.
- **Missing Capability:** Lack of dynamic spatial clustering (e.g., grouping collapsed buildings into regional density heat clusters at zoom levels < 13).

---

## 5. Future Improvement & Redesign Roadmap

To transform GEO-RESQ into an award-winning, enterprise-grade emergency decision platform, the following design enhancements are planned:

### 5.1 Immediate Enhancement: Executive Light Theme System (Daylight Mode)
Implement a modern, high-contrast Light Theme tailored for presentation projectors, daytime emergency rooms, and enterprise reporting:

```
+------------------------------------------------------------------------------------+
| LIGHT THEME DESIGN SPECIFICATION (Daylight Executive Mode)                         |
+------------------------------------------------------------------------------------+
| Canvas Background:       #f8fafc (Slate 50 - Ultra-clean daylight surface)         |
| Card & Panel Surface:    #ffffff (Pure White with subtle 0 4px 20px shadow)        |
| Panel Headers / Nav:     #f1f5f9 (Slate 100 with crisp 1px border #e2e8f0)         |
| Primary Typography:      #0f172a (Deep Slate 900 - 100% WCAG AAA legibility)       |
| Secondary Typography:    #475569 (Slate 600 - Clean balanced metadata)             |
| Tertiary / Muted:        #64748b (Slate 500 - 4.8:1 contrast compliant)            |
| Primary Accent:          #0284c7 (Ocean Blue - High contrast on white)             |
| Flood Water Overlay:     rgba(14, 165, 233, 0.40) with #0284c7 border              |
| Viable Route Corridor:   #059669 (Vibrant Emerald - Standout on daylight maps)      |
| Impassable Route:        #dc2626 (Crimson Red - Unambiguous danger signal)          |
| Theme Switcher:          Instant 1-click Sun/Moon toggle in the top navigation bar |
+------------------------------------------------------------------------------------+
```

### 5.2 Responsive Layout for Field Operations
- Implement a mobile-first responsive breakpoint system:
  - **Desktop (>= 1280px):** 3-pane EOC Command HUD with simultaneous map, layer controls, and intelligence stream.
  - **Tablet (768px - 1279px):** Auto-collapsing side drawers with floating FAB buttons.
  - **Mobile (< 768px):** Bottom sheet gesture drawer (Google Maps style) showing turn-by-turn viable rescue routing.

### 5.3 High-Performance Vector Tile & Cluster Rendering
- Integrate **Leaflet.markercluster** or migrate to **MapLibre GL** vector tiles.
- Cluster 100+ building damage pins into dynamic radial heat-circles that burst into individual structural damage markers upon zooming in.

### 5.4 3D Digital Elevation Model (DEM) Water Inundation Simulation
- Integrate 3D terrain mesh using SRTM 30m DEM data.
- Enable water-rise simulation slider (0.5m to 5.0m surge) allowing commanders to predict which roads will submerge in the next 3, 6, and 12 hours.

### 5.5 Offline Resilient PWA Architecture
- Add service worker caching for OpenStreetMap vector tiles and pre-downloaded disaster AOIs.
- Enable field teams to navigate with GPS even when cellular telecommunications towers are knocked out by the disaster.

### 5.6 Real-Time Huawei SMN & WebSocket Telemetry
- Replace static mock data with live WebSocket feeds streaming from Huawei ModelArts inference containers on ECS.
- Display push notifications when water levels recede or new bypass corridors are computed by the Dijkstra engine.

---

## 6. Summary Matrix: Current vs. Proposed Future State

| Evaluation Dimension | Current State (v1.0 Dark EOC) | Target Future State (v2.0 Dual Theme) |
|---|---|---|
| **Aesthetic Paradigm** | Tactical Military Cyberpunk | Clean Executive GIS (ArcGIS / Sentinel Hub style) |
| **Cartography Base** | OpenStreetMap Daylight (Fixed) | Dynamic Switcher (Daylight OSM / High-Res Satellite / Dark) |
| **Theme Flexibility** | Dark Theme only (Poor projector contrast) | Instant Light / Dark Mode Toggle with persistence |
| **Accessibility & Contrast** | Fails WCAG AA on muted labels | 100% WCAG 2.1 AA Compliant across all color tokens |
| **Device Adaptation** | Desktop fixed (1366x633) | Fully Responsive (Desktop, Tablet, Mobile PWA) |
| **Live Backend Wiring** | FastAPI live on port 8000 for routes | Full WebSocket bi-directional telemetry & SMN push |
| **Map Performance** | Direct SVG rendering | Clustered vector rendering with smooth hardware acceleration |

---
*Report compiled for Huawei ICT Competition 2026 Innovation Review.*  
*Repository: `GEO-RESQ (Autonomous Post-Disaster Intelligence Platform)`*
