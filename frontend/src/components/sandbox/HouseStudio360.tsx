import React, { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import {
  RotateCcw,
  Sun,
  Eye,
  Camera,
  Maximize2,
  Compass,
  Home,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ARCHITECTURAL DIMENSIONS FOR MALAYSIAN SINGLE-STOREY TERRACE HOUSE
const LOT_WIDTH = 7.2;
const HOUSE_DEPTH = 13.0;
const CARPORT_DEPTH = 5.0;
const WALL_HEIGHT = 3.3;
const ROOF_PEAK_H = 1.9;

// Materials defined at module scope so HMR replaces them cleanly on every save.
// (useMemo with [] would cache the first-created objects and ignore updates.)
const MATS = {
  // Walls
  wallMain: new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.85 }),
  wallCharcoal: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.70 }),
  wallAccent: new THREE.MeshStandardMaterial({ color: '#c2410c', roughness: 0.65 }),
  timberBatten: new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.50 }),

  // Roof & Fascia
  roofClay: new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.40, metalness: 0.10 }),
  roofRidge: new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.45 }),
  fasciaTrim: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.75 }),
  gutter: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.35, metalness: 0.6 }),

  // Windows & Doors
  doorWood: new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.35 }),
  handleMetal: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.20, metalness: 0.90 }),
  windowAlum: new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.25, metalness: 0.6 }),
  // Light-blue transparent glass — NO transmission, works without an env map
  windowGlass: new THREE.MeshStandardMaterial({
    color: '#7dd3fc',
    roughness: 0.05,
    metalness: 0.15,
    transparent: true,
    opacity: 0.45,
  }),

  // Porch, Ground & Street
  porchTiles: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.75 }),
  curbConcrete: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.90 }),
  roadAsphalt: new THREE.MeshStandardMaterial({ color: '#181e26', roughness: 0.95 }),
  grassLawn: new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.85 }),
  boundaryWall: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.85 }),
  gateSteel: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.30, metalness: 0.75 }),

  // Sedan Car
  carBody: new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.20, metalness: 0.75 }),
  carGlass: new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.10, metalness: 0.4 }),
  carTire: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.95 }),
  carAlloyRim: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.20, metalness: 0.90 }),
  carLightFront: new THREE.MeshBasicMaterial({ color: '#fef08a' }),
  carLightTail: new THREE.MeshBasicMaterial({ color: '#ef4444' }),

  // Landscaping
  potClay: new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.80 }),
  foliage: new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.75 }),
};

function CompleteTerraceHouseModel() {
  // Use module-level materials (HMR-safe)
  const mats = MATS;


  // Roof Slope calculations
  // Horizontal half-width = LOT_WIDTH / 2 = 3.6m. Rise = 1.9m
  const halfWidth = LOT_WIDTH / 2;
  const slopeHypot = Math.hypot(halfWidth, ROOF_PEAK_H) + 0.35; // Overhang at eaves
  const pitchAngle = Math.atan2(ROOF_PEAK_H, halfWidth); // ~27.8 deg
  const totalRoofLength = HOUSE_DEPTH + 1.0; // Overhang front and back

  // Triangular gable wall
  const gableShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-halfWidth, 0);
    s.lineTo(0, ROOF_PEAK_H);
    s.lineTo(halfWidth, 0);
    s.closePath();
    return new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: false });
  }, [halfWidth]);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. STREET & SITE BASELINE */}
      {/* Green Turf Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[34, 34]} />
        <primitive object={mats.grassLawn} />
      </mesh>

      {/* Front Asphalt Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, HOUSE_DEPTH / 2 + CARPORT_DEPTH + 3.8]} receiveShadow>
        <planeGeometry args={[34, 7.5]} />
        <primitive object={mats.roadAsphalt} />
      </mesh>

      {/* Road Dashed Markings */}
      {[-9, -4.5, 0, 4.5, 9].map((x) => (
        <mesh key={`dash-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.015, HOUSE_DEPTH / 2 + CARPORT_DEPTH + 3.8]}>
          <planeGeometry args={[2.2, 0.18]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Raised Concrete Curb */}
      <mesh position={[0, 0.075, HOUSE_DEPTH / 2 + CARPORT_DEPTH + 0.15]} receiveShadow castShadow>
        <boxGeometry args={[LOT_WIDTH + 6, 0.15, 0.28]} />
        <primitive object={mats.curbConcrete} />
      </mesh>

      {/* 2. BOUNDARY WALLS & CARPORT SLAB */}
      {/* Tiled Carport Driveway Apron */}
      <mesh position={[0, 0.08, HOUSE_DEPTH / 2 + CARPORT_DEPTH / 2]} receiveShadow>
        <boxGeometry args={[LOT_WIDTH, 0.16, CARPORT_DEPTH]} />
        <primitive object={mats.porchTiles} />
      </mesh>

      {/* Left Party Wall */}
      <mesh position={[-LOT_WIDTH / 2 - 0.1, 0.75, (HOUSE_DEPTH + CARPORT_DEPTH) / 2 - 2.5]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 1.35, HOUSE_DEPTH + CARPORT_DEPTH]} />
        <primitive object={mats.boundaryWall} />
      </mesh>

      {/* Right Party Wall */}
      <mesh position={[LOT_WIDTH / 2 + 0.1, 0.75, (HOUSE_DEPTH + CARPORT_DEPTH) / 2 - 2.5]} castShadow receiveShadow>
        <boxGeometry args={[0.2, 1.35, HOUSE_DEPTH + CARPORT_DEPTH]} />
        <primitive object={mats.boundaryWall} />
      </mesh>

      {/* Rear Boundary Wall */}
      <mesh position={[0, 0.85, -HOUSE_DEPTH / 2 - 2.5]} castShadow receiveShadow>
        <boxGeometry args={[LOT_WIDTH + 0.4, 1.5, 0.2]} />
        <primitive object={mats.boundaryWall} />
      </mesh>

      {/* Front Entrance Gate Posts */}
      <mesh position={[-LOT_WIDTH / 2, 0.95, HOUSE_DEPTH / 2 + CARPORT_DEPTH]} castShadow>
        <boxGeometry args={[0.42, 1.75, 0.42]} />
        <primitive object={mats.wallCharcoal} />
      </mesh>
      <mesh position={[LOT_WIDTH / 2, 0.95, HOUSE_DEPTH / 2 + CARPORT_DEPTH]} castShadow>
        <boxGeometry args={[0.42, 1.75, 0.42]} />
        <primitive object={mats.wallCharcoal} />
      </mesh>

      {/* Black Sliding Autogate */}
      <group position={[0.3, 0.65, HOUSE_DEPTH / 2 + CARPORT_DEPTH]}>
        <mesh castShadow>
          <boxGeometry args={[5.2, 1.15, 0.06]} />
          <primitive object={mats.gateSteel} />
        </mesh>
        {[-2.0, -1.2, -0.4, 0.4, 1.2, 2.0].map((gx) => (
          <mesh key={`gate-slat-${gx}`} position={[gx, 0, 0.04]} castShadow>
            <boxGeometry args={[0.06, 0.95, 0.02]} />
            <primitive object={mats.timberBatten} />
          </mesh>
        ))}
      </group>

      {/* 3. MAIN HOUSE LIVING ENCLOSURE */}
      <mesh position={[0, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[LOT_WIDTH, WALL_HEIGHT, HOUSE_DEPTH]} />
        <primitive object={mats.wallMain} />
      </mesh>

      {/* Front Architectural Feature Wall (Warm Terracotta Orange Accent) */}
      <mesh position={[-1.6, WALL_HEIGHT / 2, HOUSE_DEPTH / 2 + 0.05]} castShadow>
        <boxGeometry args={[3.2, WALL_HEIGHT - 0.2, 0.1]} />
        <primitive object={mats.wallAccent} />
      </mesh>

      {/* Front Decorative Timber Battens */}
      {[-2.8, -2.4, -2.0, -1.6, -1.2, -0.8].map((lx) => (
        <mesh key={`batten-${lx}`} position={[lx, WALL_HEIGHT * 0.65, HOUSE_DEPTH / 2 + 0.12]} castShadow>
          <boxGeometry args={[0.08, 1.5, 0.05]} />
          <primitive object={mats.timberBatten} />
        </mesh>
      ))}

      {/* Front Porch Entrance Step (+0.30m) */}
      <mesh position={[1.4, 0.18, HOUSE_DEPTH / 2 + 0.8]} receiveShadow castShadow>
        <boxGeometry args={[2.8, 0.36, 1.6]} />
        <primitive object={mats.porchTiles} />
      </mesh>

      {/* Solid Dark Mahogany Front Door with Frame */}
      <group position={[1.6, 1.35, HOUSE_DEPTH / 2 + 0.06]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 2.25, 0.12]} />
          <primitive object={mats.wallCharcoal} />
        </mesh>
        <mesh position={[0, 0, 0.02]} castShadow>
          <boxGeometry args={[1.05, 2.1, 0.08]} />
          <primitive object={mats.doorWood} />
        </mesh>
        {/* Steel Handle */}
        <mesh position={[-0.38, 0, 0.08]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.35, 12]} />
          <primitive object={mats.handleMetal} />
        </mesh>
        {/* Entrance Light Sconce */}
        <mesh position={[0.7, 0.45, 0.08]} castShadow>
          <boxGeometry args={[0.12, 0.22, 0.1]} />
          <primitive object={mats.wallCharcoal} />
        </mesh>
      </group>

      {/* Front Living Room Aluminium Picture Window */}
      <group position={[-1.6, 1.65, HOUSE_DEPTH / 2 + 0.08]}>
        <mesh castShadow>
          <boxGeometry args={[2.2, 1.45, 0.1]} />
          <primitive object={mats.windowAlum} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[2.0, 1.25]} />
          <primitive object={mats.windowGlass} />
        </mesh>
        {/* Window Concrete Sill */}
        <mesh position={[0, -0.76, 0.06]} castShadow>
          <boxGeometry args={[2.3, 0.08, 0.22]} />
          <primitive object={mats.curbConcrete} />
        </mesh>
      </group>

      {/* 4. CARPORT AWNING & PILLARS */}
      {/* Left Column */}
      <mesh position={[-LOT_WIDTH / 2 + 0.4, (WALL_HEIGHT - 0.2) / 2, HOUSE_DEPTH / 2 + CARPORT_DEPTH - 0.3]} castShadow>
        <boxGeometry args={[0.38, WALL_HEIGHT - 0.2, 0.38]} />
        <primitive object={mats.wallCharcoal} />
      </mesh>

      {/* Right Column */}
      <mesh position={[LOT_WIDTH / 2 - 0.4, (WALL_HEIGHT - 0.2) / 2, HOUSE_DEPTH / 2 + CARPORT_DEPTH - 0.3]} castShadow>
        <boxGeometry args={[0.38, WALL_HEIGHT - 0.2, 0.38]} />
        <primitive object={mats.wallCharcoal} />
      </mesh>

      {/* Carport Awning Roof */}
      <group position={[0, WALL_HEIGHT - 0.15, HOUSE_DEPTH / 2 + CARPORT_DEPTH / 2]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[LOT_WIDTH + 0.2, 0.18, CARPORT_DEPTH + 0.3]} />
          <primitive object={mats.wallCharcoal} />
        </mesh>
        {/* Recessed Porch Lights */}
        {[-1.8, 0, 1.8].map((dx) => (
          <mesh key={`plight-${dx}`} position={[dx, -0.1, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
            <meshBasicMaterial color="#fef08a" />
          </mesh>
        ))}
      </group>

      {/* 5. COMPLETE SOLID CLAY TILE GABLE ROOF */}
      {/* Front Gable Wall — nudged 1.5 cm outward to remove z-fight with main wall */}
      <mesh
        geometry={gableShape}
        position={[0, WALL_HEIGHT + 0.015, HOUSE_DEPTH / 2 + 0.015]}
        castShadow
        receiveShadow
      >
        <primitive object={mats.wallMain} />
      </mesh>

      {/* Rear Gable Wall — nudged 1.5 cm outward */}
      <mesh
        geometry={gableShape}
        position={[0, WALL_HEIGHT + 0.015, -HOUSE_DEPTH / 2 - 0.015]}
        castShadow
        receiveShadow
      >
        <primitive object={mats.wallMain} />
      </mesh>

      {/* Left Roof Slope (Terracotta Clay Tiles) */}
      <mesh
        position={[-halfWidth / 2, WALL_HEIGHT + ROOF_PEAK_H / 2, 0]}
        rotation={[0, 0, pitchAngle]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[slopeHypot, 0.14, totalRoofLength]} />
        <primitive object={mats.roofClay} />
      </mesh>

      {/* Right Roof Slope (Terracotta Clay Tiles) */}
      <mesh
        position={[halfWidth / 2, WALL_HEIGHT + ROOF_PEAK_H / 2, 0]}
        rotation={[0, 0, -pitchAngle]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[slopeHypot, 0.14, totalRoofLength]} />
        <primitive object={mats.roofClay} />
      </mesh>

      {/* Dark Ridge Cap along apex */}
      <mesh position={[0, WALL_HEIGHT + ROOF_PEAK_H + 0.08, 0]} castShadow>
        <boxGeometry args={[0.34, 0.16, totalRoofLength + 0.1]} />
        <primitive object={mats.roofRidge} />
      </mesh>

      {/* Dark Fascia Rakes along eaves */}
      <mesh position={[-LOT_WIDTH / 2 - 0.18, WALL_HEIGHT - 0.05, 0]} castShadow>
        <boxGeometry args={[0.06, 0.22, totalRoofLength + 0.05]} />
        <primitive object={mats.fasciaTrim} />
      </mesh>
      <mesh position={[LOT_WIDTH / 2 + 0.18, WALL_HEIGHT - 0.05, 0]} castShadow>
        <boxGeometry args={[0.06, 0.22, totalRoofLength + 0.05]} />
        <primitive object={mats.fasciaTrim} />
      </mesh>

      {/* Rainwater Gutters */}
      <mesh position={[-LOT_WIDTH / 2 - 0.24, WALL_HEIGHT - 0.14, 0]} castShadow>
        <boxGeometry args={[0.10, 0.08, totalRoofLength + 0.05]} />
        <primitive object={mats.gutter} />
      </mesh>
      <mesh position={[LOT_WIDTH / 2 + 0.24, WALL_HEIGHT - 0.14, 0]} castShadow>
        <boxGeometry args={[0.10, 0.08, totalRoofLength + 0.05]} />
        <primitive object={mats.gutter} />
      </mesh>

      {/* 6. PARKED BLUE SEDAN CAR */}
      <group position={[-1.4, 0.28, HOUSE_DEPTH / 2 + CARPORT_DEPTH / 2 - 0.2]}>
        {/* Chassis */}
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.75, 0.44, 3.8]} />
          <primitive object={mats.carBody} />
        </mesh>
        {/* Cabin Glass */}
        <mesh position={[0, 0.62, -0.15]} castShadow>
          <boxGeometry args={[1.48, 0.40, 2.1]} />
          <primitive object={mats.carGlass} />
        </mesh>
        {/* Roof */}
        <mesh position={[0, 0.83, -0.15]} castShadow>
          <boxGeometry args={[1.44, 0.05, 1.7]} />
          <primitive object={mats.carBody} />
        </mesh>
        {/* Headlights */}
        <mesh position={[-0.6, 0.25, 1.91]}>
          <boxGeometry args={[0.28, 0.12, 0.05]} />
          <primitive object={mats.carLightFront} />
        </mesh>
        <mesh position={[0.6, 0.25, 1.91]}>
          <boxGeometry args={[0.28, 0.12, 0.05]} />
          <primitive object={mats.carLightFront} />
        </mesh>
        {/* Taillights */}
        <mesh position={[-0.6, 0.28, -1.91]}>
          <boxGeometry args={[0.28, 0.12, 0.05]} />
          <primitive object={mats.carLightTail} />
        </mesh>
        <mesh position={[0.6, 0.28, -1.91]}>
          <boxGeometry args={[0.28, 0.12, 0.05]} />
          <primitive object={mats.carLightTail} />
        </mesh>
        {/* Exhaust Tailpipe (0.35m datum) */}
        <mesh position={[0.55, 0.12, -1.94]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.14, 12]} />
          <primitive object={mats.handleMetal} />
        </mesh>
        {/* 4 Wheels */}
        {[
          [-0.85, 0.18, 1.15],
          [0.85, 0.18, 1.15],
          [-0.85, 0.18, -1.15],
          [0.85, 0.18, -1.15],
        ].map((wp, i) => (
          <group key={`wheel-${i}`} position={wp as [number, number, number]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.26, 0.26, 0.22, 16]} />
              <primitive object={mats.carTire} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.16, 0.16, 0.24, 16]} />
              <primitive object={mats.carAlloyRim} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 6b. REAR KITCHEN WINDOW — visible from rear/iso camera */}
      <group position={[0.8, 1.55, -HOUSE_DEPTH / 2 - 0.06]}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 1.0, 0.1]} />
          <primitive object={mats.windowAlum} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[1.2, 0.82]} />
          <primitive object={mats.windowGlass} />
        </mesh>
        {/* Concrete sill */}
        <mesh position={[0, -0.54, 0.06]} castShadow>
          <boxGeometry args={[1.5, 0.07, 0.18]} />
          <primitive object={mats.curbConcrete} />
        </mesh>
      </group>

      {/* 6c. LEFT-SIDE AIRWELL WINDOW — visible from left/iso camera */}
      <group position={[-LOT_WIDTH / 2 - 0.06, 1.65, -HOUSE_DEPTH / 4]}>
        <mesh castShadow rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[1.1, 0.9, 0.1]} />
          <primitive object={mats.windowAlum} />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.92, 0.74]} />
          <primitive object={mats.windowGlass} />
        </mesh>
      </group>

      {/* 7. LANDSCAPING */}
      {[2.2, 2.8].map((px) => (
        <group key={`pot-${px}`} position={[px, 0.24, HOUSE_DEPTH / 2 + CARPORT_DEPTH - 0.4]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.15, 0.30, 12]} />
            <primitive object={mats.potClay} />
          </mesh>
          <mesh position={[0, 0.26, 0]} castShadow>
            <sphereGeometry args={[0.24, 12, 12]} />
            <primitive object={mats.foliage} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function HouseStudio360() {
  const navigate = useNavigate();
  const controlsRef = useRef<any>(null);

  const setViewAngle = (preset: 'front' | 'iso' | 'rear' | 'top' | 'street') => {
    if (!controlsRef.current) return;
    if (preset === 'front') {
      controlsRef.current.object.position.set(0, 3.5, 17);
      controlsRef.current.target.set(0, 1.8, 0);
    } else if (preset === 'iso') {
      controlsRef.current.object.position.set(16, 11, 17);
      controlsRef.current.target.set(0, 1.8, 0);
    } else if (preset === 'rear') {
      controlsRef.current.object.position.set(0, 6, -18);
      controlsRef.current.target.set(0, 1.8, 0);
    } else if (preset === 'top') {
      controlsRef.current.object.position.set(0, 24, 0.1);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'street') {
      controlsRef.current.object.position.set(-6, 1.8, 14);
      controlsRef.current.target.set(0, 1.8, 4);
    }
  };

  return (
    <div className="w-full h-screen bg-[#071426] flex flex-col overflow-hidden select-none">
      {/* Top Studio Control Bar */}
      <header className="h-16 bg-[#0B1528] border-b border-slate-800 px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Home className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-extrabold text-sm text-white tracking-wide uppercase">
                3D Architecture Studio · 360° POV Review
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Complete Architecture</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Malaysian Single-Storey Modern Terrace House · Solid Gable Roof · Full Carport
            </p>
          </div>
        </div>

        {/* View Angle Presets */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          {(['front', 'iso', 'rear', 'street', 'top'] as const).map((angle) => (
            <button
              key={angle}
              onClick={() => setViewAngle(angle)}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white capitalize font-semibold transition-colors cursor-pointer"
            >
              {angle}
            </button>
          ))}
        </div>

        {/* Return / Combine Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/simulation')}
            className="px-4 py-2 rounded-xl bg-[#1677FF] hover:bg-[#0958D9] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/25 transition-transform hover:scale-105 cursor-pointer"
          >
            <span>Return to Simulation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 360 3D Studio Canvas */}
      <div className="relative flex-1 w-full h-full bg-gradient-to-b from-[#7ec0ee] to-[#cce8fd]">
        <Canvas
          shadows
          camera={{ position: [0, 3.5, 17], fov: 45 }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <color attach="background" args={['#7ec0ee']} />
          <fog attach="fog" args={['#7ec0ee', 30, 85]} />

          <ambientLight intensity={1.1} />
          <directionalLight
            position={[14, 20, 12]}
            intensity={2.0}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-16}
            shadow-camera-right={16}
            shadow-camera-top={16}
            shadow-camera-bottom={-16}
          />
          <hemisphereLight intensity={0.5} groundColor="#1e3a24" color="#dbeafe" />

          <Suspense fallback={null}>
            <CompleteTerraceHouseModel />
            <ContactShadows position={[0, 0.01, 0]} opacity={0.65} scale={32} blur={1.6} far={8} />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            makeDefault
            maxPolarAngle={Math.PI / 2 - 0.02}
            minDistance={3}
            maxDistance={40}
            enableDamping
            dampingFactor={0.06}
          />
        </Canvas>

        {/* Bottom Orbiting Guide */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-white text-xs font-semibold shadow-xl pointer-events-none flex items-center gap-2">
          <RotateCcw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          <span>Click & Drag to Rotate 360° · Scroll to Zoom · Right Click to Pan</span>
        </div>
      </div>
    </div>
  );
}

export { CompleteTerraceHouseModel };
