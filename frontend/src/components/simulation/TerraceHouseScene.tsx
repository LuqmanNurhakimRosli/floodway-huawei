import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
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

// Each zone: the depth at which it starts flooding, its surface Y when full, its XZ size & position
const WATER_ZONES = [
    {
        id: 'street',
        triggerDepth: 0.01,    // Always present once any water
        surfaceY: 0.02,
        targetYFn: (d: number) => Math.min(d, 0.12),          // Street layer — caps at curb height
        size: [34, 34] as [number, number],
        pos: [0, 0, 0] as [number, number, number],
        color: (d: number) => d >= 0.10 ? '#0877B8' : '#18BFFF',
    },
    {
        id: 'porch',
        triggerDepth: 0.15,    // 0.15m = water reaches porch slab
        surfaceY: 0.18,
        targetYFn: (d: number) => Math.min(d, 0.35),
        size: [7.2, 3.5] as [number, number],
        pos: [0, 0, 7.5] as [number, number, number],          // front porch area
        color: () => '#0971b8',
    },
    {
        id: 'carport',
        triggerDepth: 0.20,    // 0.20m = carport spills over
        surfaceY: 0.22,
        targetYFn: (d: number) => Math.min(d - 0.18, 0.22),
        size: [7.2, 5.0] as [number, number],
        pos: [0, 0, 4.0] as [number, number, number],
        color: () => '#076bab',
    },
    {
        id: 'living',
        triggerDepth: 0.90,    // 0.90m = living room floor breach
        surfaceY: 0.95,
        targetYFn: (d: number) => Math.min(d, 1.5),
        size: [7.2, 13.0] as [number, number],
        pos: [0, 0, 0] as [number, number, number],
        color: () => '#034B78',
    },
    {
        id: 'upper',
        triggerDepth: 1.50,    // 1.50m+ = severe inundation
        surfaceY: 1.55,
        targetYFn: (d: number) => d,
        size: [34, 34] as [number, number],
        pos: [0, 0, 0] as [number, number, number],
        color: () => '#01355a',
    },
];

function WaterZone({
    zone,
    waterLevelM,
}: {
    zone: typeof WATER_ZONES[0];
    waterLevelM: number;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const waveClock = useRef(0);
    const isActive = waterLevelM >= zone.triggerDepth;
    const targetY = isActive ? zone.surfaceY + zone.targetYFn(waterLevelM) : -2;

    useFrame((_, dt) => {
        waveClock.current += dt * 1.5;
        if (meshRef.current) {
            meshRef.current.position.y = THREE.MathUtils.lerp(
                meshRef.current.position.y,
                targetY,
                dt * 2.8
            );
            // Subtle wave undulation
            if (isActive) {
                meshRef.current.position.y += Math.sin(waveClock.current * 2 + zone.pos[2]) * 0.005;
            }
        }
    });

    const material = useMemo(() => new THREE.MeshStandardMaterial({
        color: zone.color(waterLevelM),
        transparent: true,
        opacity: isActive ? 0.78 : 0,
        roughness: 0.08,
        metalness: 0.30,
    }), [waterLevelM, isActive]);

    return (
        <mesh
            ref={meshRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[zone.pos[0], isActive ? targetY : -2, zone.pos[2]]}
            receiveShadow
        >
            <planeGeometry args={[zone.size[0], zone.size[1], 16, 16]} />
            <primitive object={material} />
        </mesh>
    );
}

export function TerraceHouseScene({
    waterLevelM,
    activeLayers = { floodScenario: true, waterFlow: true, hazardLayer: true, buildingLayer: true }
}: TerraceHouseSceneProps) {
    return (
        <group position={[0, 0, 0]}>
            {/* Complete Solid Malaysian Terrace House */}
            <CompleteTerraceHouseModel />

            {/* 5 Independent Flood Water Zones — each triggers at its own depth */}
            {activeLayers.floodScenario !== false && waterLevelM > 0.01 &&
                WATER_ZONES.map((zone) => (
                    <WaterZone
                        key={zone.id}
                        zone={zone}
                        waterLevelM={waterLevelM}
                    />
                ))
            }
        </group>
    );
}
