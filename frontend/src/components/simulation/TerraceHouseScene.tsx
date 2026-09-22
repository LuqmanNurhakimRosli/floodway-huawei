import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface Props {
  waterLevelM: number;
  showCallouts?: boolean;
}

export function TerraceHouseScene({ waterLevelM, showCallouts = true }: Props) {
  const waterMeshRef = useRef<THREE.Mesh>(null);
  const waveClock = useRef(0);

  // Water level datum (0.0m = street asphalt surface)
  const waterY = Math.max(0.01, waterLevelM);

  useFrame((_, dt) => {
    waveClock.current += dt * 1.5;
    if (waterMeshRef.current) {
      waterMeshRef.current.position.y = THREE.MathUtils.lerp(
        waterMeshRef.current.position.y,
        waterY,
        dt * 3.0
      );
    }
  });

  // Physically-calibrated materials for Malaysian Modern Terrace House (Rumah Teres Moden)
  const materials = useMemo(() => ({
    wallMain: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.85 }),
    wallAccent: new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.65 }),
    wallDark: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.70 }),
    timberPanel: new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.55 }),
    roofTile: new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.50, metalness: 0.15 }),
    ridgeCap: new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.60 }),
    fasciaBoard: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.75 }),
    frontDoor: new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.40 }),
    doorHandle: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.20, metalness: 0.85 }),
    windowFrame: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.35, metalness: 0.3 }),
    glass: new THREE.MeshPhysicalMaterial({
      color: '#38bdf8',
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.8,
    }),
    curb: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.75 }),
    porchTiles: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.60 }),
    road: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.95 }),
    column: new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.80 }),
    gate: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.40, metalness: 0.70 }),
    water: new THREE.MeshPhysicalMaterial({
      color: '#0284c7',
      transparent: true,
      opacity: 0.72,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.65,
    }),
  }), []);

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Street Asphalt Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 26]} />
        <primitive object={materials.road} />
      </mesh>

      {/* 2. Raised Car Porch Slab (0.15m elevation) */}
      <mesh position={[0, 0.075, 2.5]} receiveShadow>
        <boxGeometry args={[6.8, 0.15, 6.0]} />
        <primitive object={materials.porchTiles} />
      </mesh>

      {/* Curb edge */}
      <mesh position={[0, 0.075, 5.55]}>
        <boxGeometry args={[7.0, 0.15, 0.15]} />
        <primitive object={materials.curb} />
      </mesh>

      {/* 3. Main Living Block (House Interior Raised Floor at 0.90m) */}
      <group position={[0, 1.6, -2.5]}>
        {/* Main Walls */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[6.6, 3.2, 7.5]} />
          <primitive object={materials.wallMain} />
        </mesh>

        {/* Terracotta Accent Feature Wall */}
        <mesh position={[1.8, 0, 3.76]} castShadow>
          <boxGeometry args={[2.6, 3.2, 0.1]} />
          <primitive object={materials.wallAccent} />
        </mesh>

        {/* Balau Timber Slats Accent */}
        <mesh position={[-1.8, 0.3, 3.78]} castShadow>
          <boxGeometry args={[2.0, 2.2, 0.06]} />
          <primitive object={materials.timberPanel} />
        </mesh>

        {/* Front Mahogany Door */}
        <mesh position={[-1.2, -0.4, 3.8]} castShadow>
          <boxGeometry args={[1.1, 2.2, 0.08]} />
          <primitive object={materials.frontDoor} />
        </mesh>

        {/* Door Handle */}
        <mesh position={[-0.75, -0.4, 3.86]}>
          <cylinderGeometry args={[0.02, 0.02, 0.35, 12]} />
          <primitive object={materials.doorHandle} />
        </mesh>

        {/* Aluminum-framed Living Room Louver Windows */}
        <mesh position={[1.8, 0.2, 3.82]} castShadow>
          <boxGeometry args={[1.8, 1.4, 0.08]} />
          <primitive object={materials.windowFrame} />
        </mesh>
        <mesh position={[1.8, 0.2, 3.84]}>
          <boxGeometry args={[1.65, 1.25, 0.02]} />
          <primitive object={materials.glass} />
        </mesh>
      </group>

      {/* 4. Pitched Gabled Terracotta Clay Roof */}
      <group position={[0, 3.85, -2.5]}>
        <mesh rotation={[0, Math.PI / 4, 0]} scale={[1.1, 1, 1.4]} castShadow>
          <coneGeometry args={[5.2, 1.85, 4]} />
          <primitive object={materials.roofTile} />
        </mesh>
        {/* Ridge Capping */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[0.25, 0.12, 7.8]} />
          <primitive object={materials.ridgeCap} />
        </mesh>
      </group>

      {/* 5. Car Porch Structure */}
      {/* Flat Porch Slab Roof with Fascia */}
      <mesh position={[0, 2.8, 2.4]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 0.25, 4.8]} />
        <primitive object={materials.fasciaBoard} />
      </mesh>

      {/* Twin Square Concrete Columns */}
      <mesh position={[-2.8, 1.4, 4.6]} castShadow receiveShadow>
        <boxGeometry args={[0.35, 2.65, 0.35]} />
        <primitive object={materials.column} />
      </mesh>
      <mesh position={[2.8, 1.4, 4.6]} castShadow receiveShadow>
        <boxGeometry args={[0.35, 2.65, 0.35]} />
        <primitive object={materials.column} />
      </mesh>

      {/* Crossbeam */}
      <mesh position={[0, 2.6, 4.6]} castShadow>
        <boxGeometry args={[6.0, 0.25, 0.35]} />
        <primitive object={materials.column} />
      </mesh>

      {/* 6. Perimeter Boundary Walls & Metal Gate */}
      <mesh position={[-3.45, 0.55, 3.0]} castShadow>
        <boxGeometry args={[0.15, 0.95, 5.5]} />
        <primitive object={materials.wallDark} />
      </mesh>
      <mesh position={[3.45, 0.55, 3.0]} castShadow>
        <boxGeometry args={[0.15, 0.95, 5.5]} />
        <primitive object={materials.wallDark} />
      </mesh>

      {/* Sliding Gate Frame */}
      <mesh position={[0, 0.6, 5.75]} castShadow>
        <boxGeometry args={[5.6, 1.1, 0.06]} />
        <primitive object={materials.gate} />
      </mesh>

      {/* 7. Dynamic Flood Water Plane */}
      <mesh
        ref={waterMeshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, waterY, 0]}
      >
        <planeGeometry args={[24, 24, 32, 32]} />
        <primitive object={materials.water} />
      </mesh>

      {/* 8. Calibrated Flood Staff Gauge (Graduated in metres) */}
      <group position={[-3.2, 1.1, 5.3]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.08, 2.2, 16]} />
          <meshStandardMaterial color="#facc15" roughness={0.4} />
        </mesh>
        {/* Gauge tick rings */}
        {[0.15, 0.35, 0.60, 0.90, 1.20].map((h, i) => (
          <mesh key={i} position={[0, h - 1.1, 0]}>
            <cylinderGeometry args={[0.085, 0.085, 0.02, 16]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        ))}
      </group>

      {/* 9. In-Scene 3D Callouts */}
      {showCallouts && (
        <>
          <Html position={[3.2, 0.05, 5.5]} center distanceFactor={14}>
            <div className="callout-badge">
              🛣️ Road Level (0.00m)
            </div>
          </Html>

          <Html position={[2.9, 0.25, 2.5]} center distanceFactor={14}>
            <div className={`callout-badge ${waterLevelM >= 0.15 ? 'callout-badge--warning' : ''}`}>
              🚗 Car Porch (0.15m)
            </div>
          </Html>

          <Html position={[-1.2, 0.45, 2.5]} center distanceFactor={14}>
            <div className={`callout-badge ${waterLevelM >= 0.35 ? 'callout-badge--danger' : ''}`}>
              ⚠️ Exhaust Intake (0.35m)
            </div>
          </Html>

          <Html position={[-1.2, 1.05, 1.2]} center distanceFactor={14}>
            <div className={`callout-badge ${waterLevelM >= 0.90 ? 'callout-badge--danger animate-pulse' : ''}`}>
              🏠 Living Floor (0.90m)
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
