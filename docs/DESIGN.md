# GEO-RESQ Design System

## 1. Visual Theme & Atmosphere

GEO-RESQ is a tactical geospatial intelligence platform for post-disaster emergency operations — its visual language must convey **authority, precision, and calm under pressure**. The interface draws from the engineering-precision aesthetic of Linear's dark premium system, crossed with the high-density, mission-critical clarity of Palantir Gotham and the depth-layered glassmorphism of modern Mapbox Studio dashboards.

The design is dark-mode-native. The near-black canvas (`#06080e`) is not darkness applied to a light design — it is the native medium. Information emerges from darkness like instrument readings in a cockpit: crisp, luminous, hierarchical. Panels float above the map with frosted-glass translucency, preserving geospatial context while providing analytical clarity.

**Key Characteristics:**
- **Dark-canvas-native**: Deep midnight (`#06080e`) as the ground truth; all surfaces lift from it via translucent luminance stepping
- **Frosted glass panels**: Side panels, headers, and modals use `backdrop-filter: blur(16px)` with semi-transparent backgrounds — the map bleeds through, anchoring every UI element in geospatial context
- **Single chromatic accent**: Electric cyan (`#00d4ff`) as the sole chromatic accent — used for focus, active states, and primary CTAs. All other color is semantic (damage severity, route status)
- **Luminance-based hierarchy**: Depth communicated through background opacity stepping (`rgba(255,255,255, 0.02 → 0.04 → 0.06)`), not drop shadows
- **Inter Variable with OpenType**: `"cv01", "ss03"` for a cleaner geometric character; aggressive negative tracking at display sizes
- **JetBrains Mono for data**: Monospace typography for all metrics, coordinates, timestamps, and technical readouts
- **Semi-transparent borders**: `rgba(255,255,255, 0.06)` hairline borders throughout — structure without visual noise
- **Purposeful semantic color**: Red, amber, emerald only for damage/status/routing data — never decorative
- **3-second comprehension rule**: Any critical KPI or alert must be scannable within 3 seconds of a glance

## 2. Color Palette & Roles

### Canvas & Surfaces
- **Canvas Black** (`#06080e`): `--geo-canvas` — The deepest background. Near-black with a subtle blue-midnight undertone that reads cooler than generic dark themes.
- **Panel Base** (`rgba(8, 12, 20, 0.85)`): `--geo-panel` — Frosted glass panel base. The 85% opacity allows map bleed-through when combined with `backdrop-filter: blur(16px)`.
- **Surface Level 1** (`rgba(255, 255, 255, 0.02)`): `--geo-surface-1` — Subtle card/section backgrounds. Barely visible lift from canvas.
- **Surface Level 2** (`rgba(255, 255, 255, 0.04)`): `--geo-surface-2` — Elevated cards, hover states, active list items.
- **Surface Level 3** (`rgba(255, 255, 255, 0.06)`): `--geo-surface-3` — Highest surface elevation. Dropdowns, popovers, focused inputs.

### Text & Content
- **Primary Text** (`#e8ecf2`): `--geo-text-primary` — Near-white with a cool cast. Primary headings, active labels, emphasis.
- **Secondary Text** (`#a0aec0`): `--geo-text-secondary` — Cool silver for body text, descriptions, secondary labels.
- **Tertiary Text** (`#5a6577`): `--geo-text-tertiary` — Muted slate for metadata, timestamps, de-emphasized content.
- **Quaternary Text** (`#3d4654`): `--geo-text-quaternary` — Disabled states, ghost labels, barely-visible structural text.

### Accent & Interactive
- **Electric Cyan** (`#00d4ff`): `--geo-accent` — The sole chromatic accent. Primary CTAs, active states, focus rings, brand marks.
- **Accent Hover** (`#33dfff`): `--geo-accent-hover` — Lighter variant for hover states on accent elements.
- **Accent Muted** (`rgba(0, 212, 255, 0.12)`): `--geo-accent-muted` — Subtle tinted background for accent badges, active basemap selections.
- **Accent Glow** (`rgba(0, 212, 255, 0.25)`): `--geo-accent-glow` — Box-shadow glow for key interactive elements.

### Semantic Status — Damage Severity
- **Critical Red** (`#ff3b3b`): `--geo-critical` — Destroyed structures, surge breach alerts, impassable routes.
- **Critical Muted** (`rgba(255, 59, 59, 0.12)`): `--geo-critical-bg` — Background tint for critical severity cards.
- **Warning Amber** (`#ffaa00`): `--geo-warning` — Major structural damage, caution-level routes, degraded infrastructure.
- **Warning Muted** (`rgba(255, 170, 0, 0.12)`): `--geo-warning-bg` — Background tint for warning-level cards.
- **Caution Yellow** (`#ffd447`): `--geo-caution` — Minor inundation, affected zones, low-priority alerts.
- **Success Emerald** (`#00e68a`): `--geo-success` — Viable corridors, operational infrastructure, completed actions.
- **Success Muted** (`rgba(0, 230, 138, 0.12)`): `--geo-success-bg` — Background tint for success/viable status cards.
- **Info Blue** (`#3b82f6`): `--geo-info` — Informational markers, POIs, satellite pass indicators.

### Border & Divider
- **Border Subtle** (`rgba(255, 255, 255, 0.06)`): `--geo-border` — Default border. Ultra-thin, semi-transparent white.
- **Border Standard** (`rgba(255, 255, 255, 0.10)`): `--geo-border-strong` — Stronger border for focused inputs, active cards.
- **Border Active** (`rgba(0, 212, 255, 0.40)`): `--geo-border-accent` — Accent-tinted border for selected/active elements.
- **Divider** (`rgba(255, 255, 255, 0.04)`): `--geo-divider` — Subtle horizontal/vertical dividers within panels.

### Overlay & Backdrop
- **Overlay** (`rgba(2, 4, 8, 0.80)`): `--geo-overlay` — Modal/dialog backdrop. Near-black with high opacity for focus isolation.
- **Glass Tint** (`rgba(8, 12, 20, 0.70)`): `--geo-glass` — Lighter frosted glass for floating elements, tooltips.

## 3. Typography Rules

**Primary Font:** `Inter Variable`, `SF Pro Display`, `-apple-system`, `system-ui`, `Segoe UI`, `sans-serif`
**Monospace Font:** `JetBrains Mono`, `Fira Code`, `SF Mono`, `ui-monospace`, `monospace`

**OpenType Features:** `font-feature-settings: "cv01", "ss03";` enabled globally on all Inter text. `cv01` provides the single-story 'a'; `ss03` adjusts letterforms for a cleaner geometric appearance.

### Type Scale

| Role | Font | Size | Weight | Line Height | Letter Spacing | Usage |
|------|------|------|--------|-------------|----------------|-------|
| Display | Inter Variable | 36px (2.25rem) | 600 | 1.05 | -1.08px | Dashboard hero titles, scenario names in full view |
| Heading 1 | Inter Variable | 24px (1.5rem) | 600 | 1.15 | -0.48px | Panel section headers |
| Heading 2 | Inter Variable | 18px (1.125rem) | 600 | 1.25 | -0.27px | Card group titles, subsection headers |
| Heading 3 | Inter Variable | 14px (0.875rem) | 600 | 1.35 | -0.14px | Compact section labels, widget titles |
| Body | Inter Variable | 14px (0.875rem) | 400 | 1.55 | 0 | Standard reading text, descriptions |
| Body Small | Inter Variable | 13px (0.8125rem) | 400 | 1.50 | 0 | Panel content, secondary descriptions |
| Caption | Inter Variable | 12px (0.75rem) | 500 | 1.40 | 0 | Metadata, tooltips, badge text |
| Label | Inter Variable | 11px (0.6875rem) | 600 | 1.35 | 0.02em | Panel header labels, section titles (uppercase) |
| Micro | Inter Variable | 10px (0.625rem) | 500 | 1.30 | 0.03em | KPI labels, status beacon labels (uppercase) |
| Mono Data | JetBrains Mono | 13px (0.8125rem) | 500 | 1.50 | 0 | Coordinates, distances, confidence percentages |
| Mono Label | JetBrains Mono | 11px (0.6875rem) | 600 | 1.35 | 0.02em | Tactical labels: "EOC LIVE", "PHASE 1 DEMO" |
| Mono Micro | JetBrains Mono | 10px (0.625rem) | 500 | 1.30 | 0 | Timestamps, sensor IDs, opacity percentages |

### Principles
- **600 is the emphasis weight**: Used for all headings and labels. Clean and authoritative without the heaviness of 700.
- **Compression at scale**: Display and H1 use negative letter-spacing. Below 14px, spacing relaxes to normal or slightly positive.
- **Uppercase sparingly**: Only for Label and Micro roles — tactical panel headers ("GEOSPATIAL LAYERS", "INCIDENT INTELLIGENCE") and KPI strip labels. Never for body text.
- **Monospace for truth**: All numerical data, coordinates, timestamps, and technical readouts use JetBrains Mono. This signals "measured/computed" vs "authored/described."

## 4. Component Stylings

### Buttons

**Primary CTA**
- Background: `#00d4ff`
- Text: `#06080e` (dark on bright — maximum contrast)
- Padding: 8px 18px
- Radius: 6px
- Font: Inter Variable, 13px, weight 600
- Hover: `#33dfff`, `box-shadow: 0 0 20px rgba(0, 212, 255, 0.3)`
- Active: `#00bfe6`, transform `translateY(0)`
- Focus: `outline: 2px solid #00d4ff; outline-offset: 2px`

**Ghost Button (Secondary)**
- Background: `rgba(255, 255, 255, 0.03)`
- Text: `#a0aec0`
- Padding: 7px 14px
- Radius: 6px
- Border: `1px solid rgba(255, 255, 255, 0.08)`
- Font: Inter Variable, 13px, weight 500
- Hover: `rgba(255, 255, 255, 0.06)`, text `#e8ecf2`, border `rgba(255, 255, 255, 0.12)`
- Active: `rgba(255, 255, 255, 0.08)`

**Icon Button**
- Background: `rgba(255, 255, 255, 0.03)`
- Text: `#5a6577`
- Size: 32×32px (centered icon 16×16)
- Radius: 6px
- Border: `1px solid rgba(255, 255, 255, 0.06)`
- Hover: `rgba(255, 255, 255, 0.06)`, text `#a0aec0`, border `rgba(255, 255, 255, 0.10)`
- Active (toggled): `rgba(0, 212, 255, 0.08)`, text `#00d4ff`, border `rgba(0, 212, 255, 0.30)`

**Pill Badge**
- Background: `transparent`
- Text: `#a0aec0`
- Padding: 2px 8px
- Radius: 9999px
- Border: `1px solid rgba(255, 255, 255, 0.08)`
- Font: JetBrains Mono, 10px, weight 600

### Cards & Containers

**Standard Card**
- Background: `rgba(255, 255, 255, 0.02)`
- Border: `1px solid rgba(255, 255, 255, 0.06)`
- Radius: 8px
- Padding: 14px
- Hover: border `rgba(255, 255, 255, 0.10)`, background `rgba(255, 255, 255, 0.03)`

**Severity Card (e.g., PRIORITY ALPHA banner)**
- Background: `rgba(255, 59, 59, 0.06)` (severity-tinted)
- Border: `1px solid rgba(255, 59, 59, 0.20)`
- Radius: 8px
- Padding: 14px
- Inner accent: left `3px solid #ff3b3b` as severity stripe (not full border)

**Interactive List Item (facility row, route card)**
- Background: `rgba(255, 255, 255, 0.01)`
- Border: `1px solid rgba(255, 255, 255, 0.04)`
- Radius: 6px
- Padding: 10px 12px
- Hover: background `rgba(255, 255, 255, 0.03)`, border `rgba(0, 212, 255, 0.20)`
- Selected: background `rgba(0, 212, 255, 0.06)`, border `rgba(0, 212, 255, 0.35)`, `box-shadow: 0 0 12px rgba(0, 212, 255, 0.08)`

### Status Badges

**Status Pill (operational/submerged/degraded)**
- Radius: 9999px
- Padding: 2px 8px
- Font: JetBrains Mono, 10px, weight 600, uppercase
- Variants:
  - Operational: bg `rgba(0, 230, 138, 0.12)`, text `#00e68a`, border `1px solid rgba(0, 230, 138, 0.25)`
  - Degraded: bg `rgba(255, 170, 0, 0.12)`, text `#ffaa00`, border `1px solid rgba(255, 170, 0, 0.25)`
  - Submerged/Blocked: bg `rgba(255, 59, 59, 0.12)`, text `#ff3b3b`, border `1px solid rgba(255, 59, 59, 0.25)`
  - Verified: bg `rgba(0, 212, 255, 0.12)`, text `#00d4ff`, border `1px solid rgba(0, 212, 255, 0.25)`

### Progress Bars (Damage Assessment)
- Track: `rgba(255, 255, 255, 0.06)`, radius 3px, height 4px
- Fill: Solid semantic color (`#ff3b3b`, `#ffaa00`, `#ffd447`), radius 3px
- Animated fill: `transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1)`

### Inputs & Controls

**Select Dropdown**
- Background: `rgba(255, 255, 255, 0.03)`
- Border: `1px solid rgba(255, 255, 255, 0.08)`
- Text: `#e8ecf2`, 13px Inter Variable weight 500
- Radius: 6px
- Padding: 6px 10px
- Focus: border `rgba(0, 212, 255, 0.40)`, `box-shadow: 0 0 0 2px rgba(0, 212, 255, 0.12)`

**Range Slider (Opacity)**
- Track: `rgba(255, 255, 255, 0.06)`, height 3px, radius 2px
- Fill: `#00d4ff`
- Thumb: 12px circle, `#00d4ff`, `box-shadow: 0 0 6px rgba(0, 212, 255, 0.4)`

### Navigation (Header)
- Background: `rgba(8, 12, 20, 0.90)` with `backdrop-filter: blur(16px) saturate(1.2)`
- Height: 52px (compact tactical header — no wasted vertical space)
- Border-bottom: `1px solid rgba(255, 255, 255, 0.06)`
- Logo/Brand: Inter Variable 15px weight 700 tracking wider, `#e8ecf2`. Adjacent to 24×24 shield icon in accent cyan.
- Shadow: `0 1px 3px rgba(0, 0, 0, 0.3), 0 0 1px rgba(0, 212, 255, 0.08)` — barely perceptible depth

### Panels (Side Panels)
- Background: `rgba(8, 12, 20, 0.85)` with `backdrop-filter: blur(16px) saturate(1.2)`
- Border: `1px solid rgba(255, 255, 255, 0.06)` on the map-facing edge
- Width: Left 300px, Right 360px
- Header: 44px height, bottom border `rgba(255, 255, 255, 0.04)`, padding 12px 14px
- Transition: slide-in/out with `transform: translateX()`, `transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)`

### Modals
- Backdrop: `rgba(2, 4, 8, 0.80)` with `backdrop-filter: blur(4px)`
- Container: `rgba(12, 16, 24, 0.95)`, border `1px solid rgba(255, 255, 255, 0.08)`, radius 12px
- Max-width: 560px, padding 24px
- Shadow: `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 1px rgba(0, 212, 255, 0.1)`

## 5. Layout Principles

- **Base Unit:** 4px
- **Spacing Scale:** 2 / 4 / 6 / 8 / 12 / 14 / 16 / 20 / 24 / 32 / 40 / 48 / 64px
- **Panel Width:** Left 300px, Right 360px (narrower than current to maximize map real estate)
- **Header Height:** 52px (reduced from 64px — every pixel of vertical space matters for the map)
- **Footer Strip Height:** 40px (collapsed), 40px + 200px (expanded chronology)
- **Grid:** The map is the grid. No column system — the layout is a fixed frame (header, side panels, footer) around a fluid map canvas.
- **Internal Card Grid:** Within panels, single-column flowing layout. Within the bottom KPI strip, flex row with gap-16px.

### Border-Radius Scale
- Micro (2px): Range slider tracks, thin progress bars
- Small (4px): Inline badges, tag pills (combined with 9999px for full pill)
- Standard (6px): Buttons, inputs, list items, icon buttons
- Card (8px): Cards, containers, section panels
- Panel (10px): Panel corners (only top/bottom on map-facing edges)
- Modal (12px): Modals, full dialogs, SitRep export
- Full Pill (9999px): Status badges, basemap chips

## 6. Depth & Elevation

| Level | Name | Treatment | Usage |
|-------|------|-----------|-------|
| 0 | Canvas | No shadow, `#06080e` solid | Map background, deepest level |
| 1 | Surface | `rgba(255,255,255,0.02)` bg, hairline border | Cards, containers resting on canvas |
| 2 | Raised | `rgba(255,255,255,0.04)` bg, standard border | Hover states, active items, elevated cards |
| 3 | Glass Panel | `rgba(8,12,20,0.85)` bg + `blur(16px)` + hairline border | Side panels, header, footer (frosted glass) |
| 4 | Floating | `rgba(8,12,20,0.90)` bg + `blur(16px)` + `0 8px 24px rgba(0,0,0,0.4)` | Tooltips, popovers, coordinate readout |
| 5 | Modal | `rgba(12,16,24,0.95)` bg + `blur(4px)` backdrop + `0 20px 40px rgba(0,0,0,0.4)` | SitRep modal, full-screen dialogs |

**Depth Philosophy:** On a dark canvas, traditional drop shadows are invisible. GEO-RESQ uses a two-pronged depth system:
1. **Luminance stepping** — each elevation increases the white opacity of the background
2. **Frosted glass** — panels use `backdrop-filter: blur()` to reveal the map beneath, creating a physical sense of depth that flat dark surfaces cannot achieve

## 7. Do's and Don'ts

### Do
- Use `backdrop-filter: blur(16px) saturate(1.2)` on all panels that overlay the map — the map context must always be partially visible
- Use `rgba(255,255,255, 0.02–0.06)` for surface backgrounds — never solid dark colors on cards
- Keep the accent cyan (`#00d4ff`) reserved for interactive elements and primary CTAs only
- Use JetBrains Mono for all numerical/technical data — coordinates, distances, percentages, timestamps
- Apply the severity color system consistently: red=destroyed/blocked, amber=damaged/caution, emerald=viable/operational
- Maintain 4px spacing grid strictly — all margins, paddings, and gaps must be multiples of 4
- Use semi-transparent white borders (`rgba(255,255,255, 0.06)`) — never solid opaque borders on dark surfaces
- Add left-edge severity stripes (3px solid colored border-left) to severity cards instead of coloring the full border
- Animate panel transitions with `cubic-bezier(0.22, 1, 0.36, 1)` — fast entry, smooth settle
- Use `font-feature-settings: "cv01", "ss03"` on ALL Inter Variable text

### Don't
- Don't use pure white (`#ffffff`) for text — `#e8ecf2` is the maximum brightness
- Don't use solid dark backgrounds for panels — frosted glass is the system
- Don't use cyan decoratively — it must mean "interactive" or "active"
- Don't use drop shadows for depth on dark surfaces — use luminance stepping
- Don't exceed weight 600 — there is no bold (700) in this system
- Don't use uppercase for body text or descriptions — uppercase is reserved for Label and Micro roles only
- Don't use warm colors (orange, terracotta, pink) in the UI chrome — the palette is strictly cool
- Don't use generic Tailwind blue/slate defaults without mapping to design tokens
- Don't place decorative gradients — any gradient must be functional (e.g., a fade-to-transparent at the edge of a scrollable panel)
- Don't create progress bars thicker than 4px — density demands restraint

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | < 768px | Side panels collapse to bottom sheets; header simplifies to icon-only; KPI strip scrollable |
| Tablet | 768px – 1023px | Left panel as overlay drawer; right panel collapses; header shows brand + scenario only |
| Desktop | 1024px – 1439px | Both panels visible; full header; standard panel widths |
| Wide | >= 1440px | Maximum map real estate; panels may widen slightly |

### Touch Targets
- Minimum interactive element: 32×32px (desktop), 44×44px (mobile/tablet)
- Minimum spacing between touch targets: 8px
- All icon buttons maintain 32px minimum hit area

### Font Scaling
- Mobile: Body 13px, H2 16px, Display 24px
- Tablet: Body 13px, H2 17px, Display 30px
- Desktop+: Full type scale as defined in Section 3

### Collapsing Strategy
- **Panels:** Slide-out drawers below 1024px. On mobile, transform to bottom-sheet with 50vh max-height.
- **Header:** Below 768px, hide satellite sensor banner and UTC clock. Show only logo + scenario dropdown + SitRep button.
- **KPI Strip:** Horizontal scroll with fade-edge on mobile. Maintains all metrics but in a scrollable row.
- **Bottom Chronology:** Full-width expansion. Max-height reduces from 200px to 150px on mobile.

## 9. Agent Prompt Guide

### Quick Color Reference
```
Canvas:     #06080e     Panel Glass: rgba(8,12,20,0.85)
Surface-1:  rgba(255,255,255,0.02)  Surface-2: rgba(255,255,255,0.04)
Accent:     #00d4ff     Accent-Hover: #33dfff
Text-1:     #e8ecf2     Text-2:  #a0aec0     Text-3: #5a6577
Border:     rgba(255,255,255,0.06)   Border-Strong: rgba(255,255,255,0.10)
Critical:   #ff3b3b     Warning: #ffaa00     Success: #00e68a
```

### Component Prompts

**"Build the tactical header"**
- Container: full-width, height 52px, `rgba(8,12,20,0.90)` bg + `blur(16px)`, border-bottom `rgba(255,255,255,0.06)`
- Logo: Inter Variable 15px weight 700, `#e8ecf2`, letter-spacing 0.05em. Shield icon 20px in `#00d4ff`.
- Sensor pill: `rgba(255,255,255,0.03)` bg, 9999px radius, JetBrains Mono 11px weight 500
- CTA: `#00d4ff` bg, `#06080e` text, 6px radius, 13px weight 600

**"Build a glass side panel"**
- Container: width 300px, full height minus header, `rgba(8,12,20,0.85)` bg + `blur(16px) saturate(1.2)`, border `1px solid rgba(255,255,255,0.06)`
- Panel header: 44px, Inter Variable 11px weight 600 uppercase tracking 0.02em, `#00d4ff` text, bottom border `rgba(255,255,255,0.04)`
- Content: padding 12px, gap-12px between sections

**"Build a severity assessment card"**
- Container: `rgba(255,255,255,0.02)` bg, border `1px solid rgba(255,255,255,0.06)`, 8px radius, 14px padding
- Title: Inter Variable 13px weight 600, `#e8ecf2`, flex with icon
- Progress bar: height 4px, track `rgba(255,255,255,0.06)`, fill semantic color, 3px radius
- Metric text: JetBrains Mono 12px weight 500, `#a0aec0`

**"Build the KPI metrics strip"**
- Container: full-width, height 40px, `rgba(8,12,20,0.90)` bg + `blur(16px)`, border-top `rgba(255,255,255,0.06)`
- Each metric: flex column. Label in Micro (10px uppercase, `#5a6577`). Value in Mono Data (13px weight 600, color varies by metric type)
- Dividers: `1px solid rgba(255,255,255,0.04)`, height 20px, margin 0 12px
