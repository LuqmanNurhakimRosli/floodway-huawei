# FloodWay — 3D Simulation Module

## Overview

The 3D Flood Simulation (v3.0 "KL Digital Twin") provides visceral, immersive flood visualization using WebGL. It replaces earlier 2D approaches that failed to communicate physical danger to users.

**File**: `src/pages/SimulationPage.tsx` (856 lines, largest component)

## Evolution

```
v1.0 [RETIRED] → 2D Static Risk Map (Leaflet circles)
v2.0 [RETIRED] → 2D Animated Timeline (SVG bars)
v3.0 [CURRENT] → 3D WebGL City (React Three Fiber)
v4.0 [PLANNED] → GPS-Anchored Street-Level (Mapbox/Cesium)
v5.0 [FUTURE]  → Augmented Reality Overlay (WebXR)
```

## Tech Stack

- **React Three Fiber** (`@react-three/fiber` v9.5.0)
- **Three.js** (v0.183.1)
- **@react-three/drei** (v10.7.7) — useGLTF, OrbitControls, Environment, ContactShadows, Float
- **Custom GLSL shaders** — vertex + fragment for water surface

## Scene Components

| Component | Description |
|---|---|
| `CityModel` | Loads `city.glb` via `useGLTF`, clones scene, applies PBR materials |
| `WaterPlane` | Custom ShaderMaterial: 3-layer sine waves, deep/shallow gradient, foam |
| `RainSystem` | 200 instanced cylinders (InstancedMesh) with per-frame gravity |
| `FloatingDebris` | 10 box meshes orbiting + bobbing on water surface |
| `PulseRing` | Expanding/fading ring geometry as danger indicator |
| `Atmosphere` | FogExp2 + scene.background color per flood level |
| `DynamicLights` | PointLight refs that lerp color/intensity per frame |

## Flood Levels

| Level | Label | Water Y | Opacity | Rain Drops | Water Level | Risk |
|---|---|---|---|---|---|---|
| `normal` | ☀️ Normal | -12 | 0 | 0 | 0.0m | Safe |
| `medium` | 🌧️ Medium | -1.8 | 0.62 | 80 | 1.5m | Warning |
| `high` | 🌊 High | 2.8 | 0.80 | 200 | 4.2m | Critical |

## GLSL Water Shader

**Vertex shader**: Three sine wave layers for realistic water motion:
```glsl
float w1 = sin(p.x*1.6 + uTime*uSpeed) * uWaveH;
float w2 = sin(p.z*1.3 + uTime*uSpeed*0.75 + 1.5) * uWaveH*0.6;
float w3 = cos((p.x+p.z)*0.9 + uTime*uSpeed*1.4) * uWaveH*0.35;
```

**Fragment shader**: Deep/shallow color gradient with foam highlights at wave peaks.

## Uniforms (animated per-frame via `useFrame`)

| Uniform | Description | Lerp Speed |
|---|---|---|
| `uTime` | Elapsed time | Direct increment |
| `uColor` | Water color | dt × 2.5 |
| `uOpacity` | Water transparency | dt × 1.8 |
| `uWaveH` | Wave amplitude | dt × 1.5 |
| `uSpeed` | Wave speed | dt × 1.5 |
| Water Y position | Vertical position | dt × 1.4 |

## UI Layout

- **Desktop** (`lg:`): Persistent 292px sidebar with all controls
- **Mobile**: Full-screen 3D viewport + centered pill FAB at bottom → bottom-sheet drawer

## Control Panel Contents

1. Status badge (Safe/Warning/Critical)
2. Level picker (3 buttons: Normal/Medium/High)
3. Status message banner
4. Water level gauge with animated knob
5. Live metrics (Rainfall mm/h, Wind, Temperature)
6. Scene layer toggles (Water, Rain, Debris)
7. Demo Cycle button (auto-sequences levels every 4.2s)

## Canvas Configuration

```typescript
<Canvas
  shadows
  dpr={[1, 1.8]}
  camera={{ position: [28, 12, 28], fov: 48, near: 0.1, far: 300 }}
  gl={{ antialias: true, alpha: false }}
>
```

## 3D Model

- **File**: `public/city.glb` (24.7 KB)
- **Source**: Blender export
- **Materials**: PBR with `roughness: 0.4`, `metalness: 0.25`
- **Position**: `[0, -3, 0]`, Scale: `[0.7, 0.7, 0.7]`
- Casts and receives shadows

## Performance Notes

- PlaneGeometry: 32×32 units, 96×96 segments (high detail for wave deformation)
- Rain uses InstancedMesh (single draw call for 200 cylinders)
- DPR capped at 1.8 to balance quality vs performance on mobile
- Debris visibility toggles based on water opacity threshold (0.25)

## Known Limitations

- City model is generic, not GPS-anchored to user's actual street
- No LOD (level of detail) system
- Mobile devices may experience lower FPS with all effects enabled
- Model is small (24KB) — represents a stylized city block, not real KL topology
