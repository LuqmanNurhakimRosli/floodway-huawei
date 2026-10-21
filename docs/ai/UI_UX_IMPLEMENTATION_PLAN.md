# FloodWay UI/UX Enhancement: Full Implementation Plan

This implementation plan details the architectural, component-level, and visual changes to address all findings from the Desktop & Mobile UI/UX audit.

---

## 1. Objectives & Quality Standards

- **Mobile First-Class Ergonomics:** De-congest the mobile header, optimize touch targets to ≥44px, and ensure comfortable one-handed navigation in high-stress emergency scenarios.
- **Visual & Persona Continuity:** Unify identity across Header, Profile, Family cards, and Leaflet Map pins using custom anime avatars.
- **Actionable Flood Intelligence:** Implement tiered danger color-coding and hazard labels for water depths (e.g., low clearance vs. sedan stall hazard vs. impassable deep water).
- **Tactile Micro-Interactions:** Add subtle active-press feedback (`active:scale-[0.98]`), refined hover elevations, and responsive transitions.
- **Preserve System Guardrails:** Maintain strict TypeScript types, zero backend breaking changes, honest sample data disclosures, and 100% test pass rate (`scripts/check.ps1`).

---

## 2. Work Packages & Component Scope

### Phase 1: Identity & Avatar Continuity
Unify user persona across Header, Profile, and Family Circle.

1. **`frontend/src/components/layout/Header.tsx`**:
   - Replace generic initial circle (`LN`) with the user's custom avatar (`/media/avatars/avatar-you.svg`), with initials fallback.
   - On mobile (`< 640px`), hide redundant avatar link (already in BottomNav) to give the location selector comfortable breathing room.
2. **`frontend/src/components/profile/ProfileSettings.tsx`**:
   - Update main profile avatar hero from static gradient initials to dynamic avatar image (`/media/avatars/avatar-you.svg`) with ring border and high-contrast status badge.
   - Optimize desktop layout grid (`max-w-4xl` with two-column split on desktop: Profile Overview on left, Settings Disclosures on right).

---

### Phase 2: Mobile Header & Shell Optimization
Streamline screen real estate on viewports < 640px.

1. **`frontend/src/components/layout/Header.tsx`**:
   - On mobile, display a clean two-zone layout:
     - **Left:** Brand logo + expandable Location Pill with city & basin icon.
     - **Right:** IoT live status badge + Alert Bell with red ping counter.
   - Ensure minimum tap targets of 44×44px with `active:bg-slate-200/80`.
2. **`frontend/src/components/layout/BottomNav.tsx`**:
   - Enhance active pill transition with subtle spring timing (`transition-all duration-200 ease-out`).
   - Retain safe-area inset padding for edge-to-edge iOS/Android displays.

---

### Phase 3: Actionable Depth Badges & Report Card Polish
Make citizen flood reports immediately scannable for vehicle drivers and pedestrians.

1. **`frontend/src/components/reports/ReportCard.tsx`**:
   - Create depth-tiered badges:
     - **< 20 cm:** Ankle deep / Caution (`bg-amber-50 text-amber-800 border-amber-200`)
     - **20 – 45 cm:** Knee deep / Sedan hazard (`bg-orange-100 text-orange-900 border-orange-300`)
     - **> 45 cm:** Impassable / Extreme danger (`bg-red-600 text-white font-bold shadow-xs`)
   - Add vehicle clearance hint (*"Sedan warning"*, *"4x4 only"*, or *"Road submerged"*).
   - Add subtle card press state (`active:scale-[0.99]`).

---

### Phase 4: Home Dashboard & Carousel Polish
Improve glanceability and reduce cognitive load during floods.

1. **`frontend/src/components/home/HomeRiskBanner.tsx`**:
   - Increase text contrast for timestamp and telemetry freshness indicators outdoors (`text-slate-500` -> `text-slate-700`).
   - Group sub-pills into a structured responsive tag container with soft tinted backgrounds (`bg-red-50/80 border-red-200/60`).
2. **`frontend/src/components/home/FamilyCard.tsx`**:
   - Add smooth card hover lift (`hover:-translate-y-0.5 hover:shadow-md`) and active tap feedback.
   - Ensure horizontal carousel has smooth momentum scrolling (`scroll-snap-type: x mandatory`).

---

### Phase 5: Map Viewport & Pin Clustering
Clean up map readability on mobile and intermediate laptop screens.

1. **`frontend/src/components/map/ShelterMapView.tsx`**:
   - On mobile, default bottom sheet to `peek` mode during route view so evacuees have clear route visibility.
   - Adjust bottom action pills (`Check in`, `SOS`) to avoid overlapping the OpenStreetMap attribution row on short viewports.

---

## 3. Implementation Steps & Verification Plan

| Step | Action | Files Modified | Verification Method |
| :---: | :--- | :--- | :--- |
| **1** | Integrate user avatar into Header & Profile | `Header.tsx`, `ProfileSettings.tsx` | Visual check in browser + snapshot test |
| **2** | Streamline mobile header layout | `Header.tsx` | Browser resize to 390px, verify no line wraps |
| **3** | Add tiered depth badges to citizen reports | `ReportCard.tsx` | View `/reports`, check color coding at 35cm/50cm/42cm |
| **4** | Refine Home risk card and carousel | `HomeRiskBanner.tsx`, `NearYou.tsx` | Test scrolling on desktop and mobile |
| **5** | Map control spacing & sheet defaults | `ShelterMapView.tsx` | Test `/map` route navigation and bottom sheet drag |
| **6** | Run full verification suite | All | `powershell -File scripts/check.ps1` |

---

## 4. Definition of Done
1. All 166+ frontend tests pass (`npm run test:run`).
2. TypeScript builds with zero warnings (`npm run build`).
3. Both Desktop (1366×768) and Mobile (390×844) viewports verified in browser.
4. `docs/ai/PROGRESS.md` updated with completed changes.
