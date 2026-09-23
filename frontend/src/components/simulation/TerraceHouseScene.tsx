import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { CompleteTerraceHouseModel } from '../sandbox/HouseStudio360';

interface ActiveLayers {
  floodScenario?: boolean;
  waterFlow?: boolean;
  hazardLayer?: boolean;
  buildingLayer?: boolean;
}

interface TerraceHouseSceneProps {
  waterLevelM: number;
  showCallouts?: boolean;
  weatherCondition?: 'clear' | 'rain' | 'storm';
  weatherMode?: 'daylight' | 'storm';
  activeLayers?: ActiveLayers;
}

// Calibrated Architectural Water Inundation Zones
const WATER_ZONES = [
  {
    id: 'street',
    triggerDepth: 0.01,
    surfaceY: 0.02,
    targetYFn: (d: number) => Math.min(d, 0.15),
    size: [34, 10] as [number, number],
    pos: [0, 0, 16.0] as [number, number, number],
    color: (d: number) => (d >= 0.10 ? '#0284c7' : '#38bdf8'),
  },
  {
    id: 'longkang',
    triggerDepth: 0.04,
    surfaceY: 0.02,
    targetYFn: (d: number) => Math.min(d, 0.16),
    size: [14, 1.4] as [number, number],
    pos: [0, 0, 12.0] as [number, number, number],
    color: () => '#0369a1',
  },
  {
    id: 'carport',
    triggerDepth: 0.15, // Curbside breached (0.15m) -> spills over carport tiles
    surfaceY: 0.10,
    targetYFn: (d: number) => Math.min(d, 0.35),
    size: [7.2, 5.2] as [number, number],
    pos: [0, 0, 9.0] as [number, number, number],
    color: () => '#0284c7',
  },
  {
    id: 'porchStep',
    triggerDepth: 0.28, // Water submerges entrance landing step (+0.30m)
    surfaceY: 0.20,
    targetYFn: (d: number) => Math.min(d, 0.45),
    size: [2.6, 2.0] as [number, number],
    pos: [1.8, 0, 7.3] as [number, number, number],
    color: () => '#0369a1',
  },
  {
    id: 'livingRoom',
    triggerDepth: 0.35, // Living room finished floor (+0.35m) breached!
    surfaceY: 0.35,
    targetYFn: (d: number) => d,
    size: [6.8, 12.0] as [number, number],
    pos: [0, 0, 0.2] as [number, number, number],
    color: () => '#075985',
  },
  {
    id: 'severeSurge',
    triggerDepth: 1.10, // Extreme flood surge inundating whole neighbourhood
    surfaceY: 1.10,
    targetYFn: (d: number) => d,
    size: [36, 36] as [number, number],
    pos: [0, 0, 0] as [number, number, number],
    color: () => '#0c4a6e',
  },
];

function WaterZone({
  zone,
  waterLevelM,
}: {
  zone: (typeof WATER_ZONES)[0];
  waterLevelM: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const waveClock = useRef(0);
  const isActive = waterLevelM >= zone.triggerDepth;
  const targetY = isActive ? zone.surfaceY + zone.targetYFn(waterLevelM) : -3;

  useFrame((_, dt) => {
    waveClock.current += dt * 1.8;
    if (meshRef.current) {
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        targetY,
        dt * 3.2
      );
      if (isActive) {
        meshRef.current.position.y +=
          Math.sin(waveClock.current * 2.2 + zone.pos[2]) * 0.006;
      }
    }
  });

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: zone.color(waterLevelM),
        transparent: true,
        opacity: isActive ? 0.82 : 0,
        roughness: 0.04,
        metalness: 0.25,
      }),
    [waterLevelM, isActive]
  );

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[zone.pos[0], isActive ? targetY : -3, zone.pos[2]]}
      receiveShadow
    >
      <planeGeometry args={[zone.size[0], zone.size[1], 16, 16]} />
      <primitive object={material} />
    </mesh>
  );
}

function EngineeringDatumBadge({
  position,
  label,
  datumM,
  currentDepthM,
  dangerNote,
}: {
  position: [number, number, number];
  label: string;
  datumM: number;
  currentDepthM: number;
  dangerNote: string;
}) {
  const isBreached = currentDepthM >= datumM;
  const isNear = !isBreached && currentDepthM >= datumM - 0.10;

  return (
    <Html position={position} center distanceFactor={24} zIndexRange={[100, 0]}>
      <div
        className={`px-2 py-0.5 rounded-lg text-[9px] font-bold whitespace-nowrap shadow-lg border backdrop-blur-md transition-all select-none pointer-events-none flex items-center gap-1.5 ${
          isBreached
            ? 'bg-red-600/90 text-white border-red-400 ring-2 ring-red-500/50'
            : isNear
            ? 'bg-amber-500/90 text-slate-950 border-amber-300 font-extrabold'
            : 'bg-slate-900/80 text-slate-300 border-slate-700/80 opacity-80'
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isBreached ? 'bg-white animate-ping' : isNear ? 'bg-slate-950' : 'bg-blue-400'
          }`}
        />
        <span>
          {label} ({datumM.toFixed(2)}m)
        </span>
        {isBreached && (
          <span className="font-extrabold text-[8px] uppercase tracking-wide bg-red-800/80 px-1 py-0.2 rounded">
            {dangerNote}
          </span>
        )}
      </div>
    </Html>
  );
}

export function TerraceHouseScene({
  waterLevelM,
  showCallouts = true,
  activeLayers = { floodScenario: true, waterFlow: true, hazardLayer: true, buildingLayer: true },
}: TerraceHouseSceneProps) {
  return (
    <group position={[0, 0, 0]}>
      {/* Complete Authentic Malaysian Terrace House with Furnished Living Room */}
      <CompleteTerraceHouseModel />

      {/* Calibrated Flood Water Inundation Zones */}
      {activeLayers.floodScenario !== false &&
        waterLevelM > 0.01 &&
        WATER_ZONES.map((zone) => (
          <WaterZone key={zone.id} zone={zone} waterLevelM={waterLevelM} />
        ))}

      {/* 3D Engineering Datum Floating Markers (Staggered around lot to prevent overlap) */}
      {showCallouts !== false && (
        <>
          {/* Datum 1: Curbside Drain (0.15m) - Right curb edge */}
          <EngineeringDatumBadge
            position={[4.6, 0.45, 13.5]}
            label="Curbside Drain"
            datumM={0.15}
            currentDepthM={waterLevelM}
            dangerNote="Overflow"
          />

          {/* Datum 2: Car Exhaust Submersion (0.35m) - Left of sedan */}
          <EngineeringDatumBadge
            position={[-2.8, 0.75, 9.2]}
            label="Car Exhaust Pipe"
            datumM={0.35}
            currentDepthM={waterLevelM}
            dangerNote="Stall Risk"
          />

          {/* Datum 3: Porch Step Datum (0.30m) - Right porch step */}
          <EngineeringDatumBadge
            position={[3.2, 0.85, 7.5]}
            label="Front Porch Step"
            datumM={0.30}
            currentDepthM={waterLevelM}
            dangerNote="Slab Ingress"
          />

          {/* Datum 4: Living Room Finished Floor (0.35m) - Above window */}
          <EngineeringDatumBadge
            position={[-1.6, 2.2, 5.0]}
            label="Living Room Floor"
            datumM={0.35}
            currentDepthM={waterLevelM}
            dangerNote="Breached - Cut Power"
          />

          {/* Datum 5: Main DB Box (1.60m) - Left upper wall */}
          <EngineeringDatumBadge
            position={[-3.8, 2.7, 4.0]}
            label="Main DB Board"
            datumM={1.60}
            currentDepthM={waterLevelM}
            dangerNote="Grid Cutoff"
          />
        </>
      )}
    </group>
  );
}
