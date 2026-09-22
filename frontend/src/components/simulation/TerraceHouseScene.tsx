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

export function TerraceHouseScene({
    waterLevelM,
    weatherMode = 'daylight',
    activeLayers = { floodScenario: true, waterFlow: true, hazardLayer: true, buildingLayer: true }
}: TerraceHouseSceneProps) {
    const waterMeshRef = useRef<THREE.Mesh>(null);
    const waveClock = useRef(0);

    // 0.0m = street asphalt surface
    // 0.15m = driveway slab
    // 0.35m = car exhaust level
    // 0.90m = living room floor
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

    return (
        <group position={[0, 0, 0]}>
            {/* Complete, Solid, Enclosed Malaysian Modern Terrace House */}
            <CompleteTerraceHouseModel />

            {/* Dynamic Interactive Flood Water Plane */}
            {activeLayers.floodScenario !== false && (
                <mesh
                    ref={waterMeshRef}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, waterY, 0]}
                    receiveShadow
                >
                    <planeGeometry args={[34, 34, 32, 32]} />
                    <meshStandardMaterial
                        color={waterLevelM >= 1.0 ? '#034B78' : waterLevelM >= 0.5 ? '#0877B8' : '#18BFFF'}
                        transparent
                        opacity={waterLevelM > 0.02 ? 0.80 : 0.0}
                        roughness={0.10}
                        metalness={0.35}
                    />
                </mesh>
            )}
        </group>
    );
}
