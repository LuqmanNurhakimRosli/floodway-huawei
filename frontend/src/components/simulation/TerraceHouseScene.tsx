import { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { AlertTriangle, Home, Waves, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
    activeLayers?: ActiveLayers;
}

// Single Malaysian Modern Terrace House Dimensions
const HOUSE_WIDTH = 7.0;   // 24ft frontage
const HOUSE_DEPTH = 14.0;  // Modern lot depth
const CEILING_HEIGHT = 3.2;
const ROOF_APEX_H = 1.85;  // Gable apex height above ceiling
const ROOF_DEPTH = HOUSE_DEPTH - 5.5; // Main living block roof length

export function TerraceHouseScene({ waterLevelM, showCallouts = true, activeLayers = { floodScenario: true, waterFlow: true, hazardLayer: true, buildingLayer: true } }: TerraceHouseSceneProps) {
    const waterMeshRef = useRef<THREE.Mesh>(null);
    const waveClock = useRef(0);

    // Water level datum (0.0m = street asphalt surface)
    // 0.15m = road curb & car porch slab
    // 0.35m = car exhaust level (hydrolock hazard)
    // 0.90m = front door threshold / living room floor
    const waterY = Math.max(0.01, waterLevelM);

    const hazardLevel = useMemo(() => {
        if (waterLevelM >= 1.00) return 'SEVERE';
        if (waterLevelM >= 0.60) return 'HIGH_RISK';
        if (waterLevelM >= 0.30) return 'CAUTION';
        return 'SAFE';
    }, [waterLevelM]);

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

    // Curated materials for modern Malaysian Terrace House (Rumah Teres Moden)
    const materials = useMemo(() => ({
        // Walls
        wallMain: new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.85 }),      // Crisp off-white
        wallAccent: new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.65 }),    // Warm terracotta orange feature
        wallDark: new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.70 }),      // Architectural charcoal
        timberPanel: new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.55 }),   // Malaysian Balau timber accent
        
        // Roof
        roofTile: new THREE.MeshStandardMaterial({ color: '#b45309', roughness: 0.50, metalness: 0.15 }), // Terracotta clay roof
        ridgeCap: new THREE.MeshStandardMaterial({ color: '#9a3412', roughness: 0.60 }),      // Darker terracotta ridge
        fasciaBoard: new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.75 }),   // Slate fascia
        
        // Door & Windows
        frontDoor: new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.40 }),     // Solid dark mahogany timber door
        doorHandle: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.20, metalness: 0.85 }), // Stainless steel
        windowFrame: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.35, metalness: 0.3 }), // Black powder-coated aluminium
        glass: new THREE.MeshPhysicalMaterial({
            color: '#38bdf8',
            roughness: 0.1,
            metalness: 0.1,
            transmission: 0.7,
            transparent: true,
            opacity: 0.6
        }),

        // Driveway & Grounds
        porchFloor: new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.80 }),    // Light grey porch tiles
        porchAwning: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.40, metalness: 0.2 }), // Modern dark awning
        pillar: new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.80 }),
        road: new THREE.MeshStandardMaterial({ color: '#181e26', roughness: 0.95 }),          // Dark asphalt
        roadCurbs: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.90 }),     // Concrete curb
        grass: new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.90 }),         // Tropical green lawn
        gateMetal: new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.30, metalness: 0.60 }), // Sleek black gate
        
        // Car
        carBody: new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.25, metalness: 0.70 }), // Electric blue metallic
        carGlass: new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.15, metalness: 0.4 }),
        carWheel: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.95 }),
        carRim: new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.20, metalness: 0.85 }),
        carLightFront: new THREE.MeshBasicMaterial({ color: '#fef08a' }),
        carLightTail: new THREE.MeshBasicMaterial({ color: '#ef4444' }),

        // Environment & Details
        pottery: new THREE.MeshStandardMaterial({ color: '#c2410c', roughness: 0.85 }),       // Terracotta pot
        foliage: new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.80 }),       // Shrub green
        gaugeYellow: new THREE.MeshBasicMaterial({ color: '#eab308' }),
        gaugeRed: new THREE.MeshBasicMaterial({ color: '#ef4444' }),
    }), []);

    // Create triangular gable geometry for closed attic ends
    const gableGeometry = useMemo(() => {
        const shape = new THREE.Shape();
        shape.moveTo(-HOUSE_WIDTH / 2, 0);
        shape.lineTo(0, ROOF_APEX_H);
        shape.lineTo(HOUSE_WIDTH / 2, 0);
        shape.closePath();
        return new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false });
    }, []);

    // Roof pitch calculation
    // Slope horizontal run = HOUSE_WIDTH / 2 = 3.5m; Rise = 1.85m
    const pitchAngle = Math.atan2(ROOF_APEX_H, HOUSE_WIDTH / 2); // ~27.8 degrees
    const slopeLength = Math.hypot(HOUSE_WIDTH / 2, ROOF_APEX_H) + 0.35; // with overhang

    return (
        <group position={[0, 0, 0]}>
            {/* 1. FRONT STREET ASPHALT ROAD */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, HOUSE_DEPTH / 2 + 5.5]} receiveShadow>
                <planeGeometry args={[28, 9]} />
                <primitive object={materials.road} />
            </mesh>

            {/* Road White Divider Marking Lines */}
            {[-8, -3, 2, 7].map((x) => (
                <mesh key={`dash-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.015, HOUSE_DEPTH / 2 + 5.5]}>
                    <planeGeometry args={[2.0, 0.18]} />
                    <meshBasicMaterial color="#ffffff" />
                </mesh>
            ))}

            {/* Concrete Road Curb (+0.15m step up) */}
            <mesh position={[0, 0.075, HOUSE_DEPTH / 2 + 1.05]} castShadow receiveShadow>
                <boxGeometry args={[28, 0.15, 0.25]} />
                <primitive object={materials.roadCurbs} />
            </mesh>

            {/* Front Grass Lawn Verge */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, HOUSE_DEPTH / 2 + 0.5]} receiveShadow>
                <planeGeometry args={[28, 0.9]} />
                <primitive object={materials.grass} />
            </mesh>

            {/* 2. MAIN HOUSE COMPLEX */}
            <group position={[0, 0, 0]}>
                {/* Ground Concrete Foundation Slab */}
                <mesh position={[0, 0.15, 0]} receiveShadow>
                    <boxGeometry args={[HOUSE_WIDTH + 0.6, 0.30, HOUSE_DEPTH + 0.6]} />
                    <primitive object={materials.porchFloor} />
                </mesh>

                {/* Main Enclosed Living Quarter Body */}
                <mesh position={[0, CEILING_HEIGHT / 2 + 0.3, -1.8]} castShadow receiveShadow>
                    <boxGeometry args={[HOUSE_WIDTH, CEILING_HEIGHT, ROOF_DEPTH]} />
                    <primitive object={materials.wallMain} />
                </mesh>

                {/* Architectural Accent Feature Panel (Warm Terracotta Orange) */}
                <mesh position={[-1.6, CEILING_HEIGHT / 2 + 0.3, 2.5]} castShadow>
                    <boxGeometry args={[2.8, CEILING_HEIGHT - 0.2, 0.15]} />
                    <primitive object={materials.wallAccent} />
                </mesh>

                {/* Timber Slat Accent strip next to door */}
                <mesh position={[0.45, CEILING_HEIGHT / 2 + 0.3, 2.5]} castShadow>
                    <boxGeometry args={[0.9, CEILING_HEIGHT - 0.2, 0.12]} />
                    <primitive object={materials.timberPanel} />
                </mesh>

                {/* Front Large Living Room Windows with Black Aluminium Frame */}
                <mesh position={[-1.6, 1.8, 2.58]} castShadow>
                    <boxGeometry args={[2.2, 1.6, 0.08]} />
                    <primitive object={materials.windowFrame} />
                </mesh>
                <mesh position={[-1.6, 1.8, 2.62]}>
                    <boxGeometry args={[2.0, 1.4, 0.04]} />
                    <primitive object={materials.glass} />
                </mesh>
                <mesh position={[-1.6, 1.8, 2.64]}>
                    <boxGeometry args={[2.0, 0.04, 0.06]} />
                    <primitive object={materials.windowFrame} />
                </mesh>

                {/* Main Front Entrance Door */}
                <mesh position={[1.8, 1.45, 2.53]} castShadow>
                    <boxGeometry args={[1.1, 2.3, 0.12]} />
                    <primitive object={materials.windowFrame} />
                </mesh>
                <mesh position={[1.8, 1.45, 2.56]} castShadow>
                    <boxGeometry args={[0.95, 2.15, 0.06]} />
                    <primitive object={materials.frontDoor} />
                </mesh>
                <mesh position={[2.18, 1.4, 2.62]} castShadow>
                    <boxGeometry args={[0.04, 0.60, 0.04]} />
                    <primitive object={materials.doorHandle} />
                </mesh>

                {/* Exterior Wall Entry Lamp */}
                <mesh position={[1.05, 2.2, 2.6]} castShadow>
                    <boxGeometry args={[0.15, 0.25, 0.12]} />
                    <primitive object={materials.wallDark} />
                </mesh>
                <pointLight position={[1.05, 2.15, 2.75]} intensity={0.4} color="#fef08a" distance={4} />

                {/* 3. ROOF STRUCTURE — PITCHED GABLE ROOF WITH TERRACOTTA TILES */}
                <group position={[0, CEILING_HEIGHT + 0.3, -1.8]}>
                    {/* Left Roof Slope (Terracotta) */}
                    <mesh
                        position={[-HOUSE_WIDTH / 4 - 0.05, ROOF_APEX_H / 2, 0]}
                        rotation={[0, 0, pitchAngle]}
                        castShadow
                    >
                        <boxGeometry args={[slopeLength, 0.16, ROOF_DEPTH + 0.6]} />
                        <primitive object={materials.roofTile} />
                    </mesh>

                    {/* Right Roof Slope (Terracotta) */}
                    <mesh
                        position={[HOUSE_WIDTH / 4 + 0.05, ROOF_APEX_H / 2, 0]}
                        rotation={[0, 0, -pitchAngle]}
                        castShadow
                    >
                        <boxGeometry args={[slopeLength, 0.16, ROOF_DEPTH + 0.6]} />
                        <primitive object={materials.roofTile} />
                    </mesh>

                    {/* Ridge Capping Tile along apex */}
                    <mesh position={[0, ROOF_APEX_H + 0.08, 0]} castShadow>
                        <boxGeometry args={[0.32, 0.22, ROOF_DEPTH + 0.65]} />
                        <primitive object={materials.ridgeCap} />
                    </mesh>

                    {/* Front Triangular Gable Attic Wall (Closed - no hole) */}
                    <mesh
                        geometry={gableGeometry}
                        position={[0, 0, ROOF_DEPTH / 2 - 0.09]}
                        castShadow
                    >
                        <primitive object={materials.wallMain} />
                    </mesh>

                    {/* Rear Triangular Gable Attic Wall (Closed - no hole) */}
                    <mesh
                        geometry={gableGeometry}
                        position={[0, 0, -ROOF_DEPTH / 2 - 0.09]}
                        castShadow
                    >
                        <primitive object={materials.wallMain} />
                    </mesh>

                    {/* Fascia Boards */}
                    <mesh position={[-HOUSE_WIDTH / 2 - 0.22, 0.15, 0]} rotation={[0, 0, pitchAngle]} castShadow>
                        <boxGeometry args={[0.06, 0.32, ROOF_DEPTH + 0.65]} />
                        <primitive object={materials.fasciaBoard} />
                    </mesh>
                    <mesh position={[HOUSE_WIDTH / 2 + 0.22, 0.15, 0]} rotation={[0, 0, -pitchAngle]} castShadow>
                        <boxGeometry args={[0.06, 0.32, ROOF_DEPTH + 0.65]} />
                        <primitive object={materials.fasciaBoard} />
                    </mesh>
                </group>

                {/* 4. CAR PORCH & DRIVEWAY SLAB (Raised +0.15m) */}
                <mesh position={[0, 0.15, HOUSE_DEPTH / 2 - 2.6]} receiveShadow>
                    <boxGeometry args={[HOUSE_WIDTH, 0.20, 5.8]} />
                    <primitive object={materials.porchFloor} />
                </mesh>

                {/* Modern Flat Car Porch Canopy / Awning */}
                <mesh position={[0, CEILING_HEIGHT + 0.05, HOUSE_DEPTH / 2 - 2.6]} castShadow receiveShadow>
                    <boxGeometry args={[HOUSE_WIDTH + 0.2, 0.22, 5.8]} />
                    <primitive object={materials.porchAwning} />
                </mesh>

                {/* Front Left Pillar */}
                <mesh position={[-HOUSE_WIDTH / 2 + 0.25, (CEILING_HEIGHT + 0.05) / 2, HOUSE_DEPTH / 2 - 0.3]} castShadow>
                    <boxGeometry args={[0.35, CEILING_HEIGHT, 0.35]} />
                    <primitive object={materials.pillar} />
                </mesh>

                {/* Front Right Pillar */}
                <mesh position={[HOUSE_WIDTH / 2 - 0.25, (CEILING_HEIGHT + 0.05) / 2, HOUSE_DEPTH / 2 - 0.3]} castShadow>
                    <boxGeometry args={[0.35, CEILING_HEIGHT, 0.35]} />
                    <primitive object={materials.pillar} />
                </mesh>

                {/* 5. FRONT SLIDING MAIN GATE & PERIMETER WALL */}
                {/* Left Low Perimeter Wall */}
                <mesh position={[-HOUSE_WIDTH / 2 + 0.7, 0.65, HOUSE_DEPTH / 2]} castShadow>
                    <boxGeometry args={[1.4, 1.1, 0.25]} />
                    <primitive object={materials.wallDark} />
                </mesh>

                {/* Right Gate Pillar with Mailbox */}
                <group position={[HOUSE_WIDTH / 2 - 0.6, 0.8, HOUSE_DEPTH / 2]}>
                    <mesh castShadow>
                        <boxGeometry args={[1.0, 1.4, 0.4]} />
                        <primitive object={materials.wallDark} />
                    </mesh>
                    <mesh position={[0, 0.35, 0.21]} castShadow>
                        <boxGeometry args={[0.45, 0.15, 0.04]} />
                        <primitive object={materials.doorHandle} />
                    </mesh>
                    <mesh position={[0, 0.05, 0.21]} castShadow>
                        <boxGeometry args={[0.3, 0.2, 0.03]} />
                        <meshStandardMaterial color="#0f172a" roughness={0.3} />
                    </mesh>
                    <mesh position={[0, -0.3, 0.21]} castShadow>
                        <boxGeometry args={[0.4, 0.35, 0.03]} />
                        <primitive object={materials.gateMetal} />
                    </mesh>
                </group>

                {/* Main Horizontal Louver Sliding Steel Gate */}
                <group position={[-0.4, 0.75, HOUSE_DEPTH / 2 + 0.05]}>
                    <mesh castShadow>
                        <boxGeometry args={[4.4, 1.2, 0.06]} />
                        <primitive object={materials.gateMetal} />
                    </mesh>
                    {Array.from({ length: 6 }).map((_, lIdx) => (
                        <mesh key={`louver-${lIdx}`} position={[0, -0.45 + lIdx * 0.18, 0]}>
                            <boxGeometry args={[4.2, 0.08, 0.04]} />
                            <primitive object={materials.gateMetal} />
                        </mesh>
                    ))}
                </group>

                {/* 6. PARKED FAMILY CAR (Sleek Blue Metallic Hatchback) */}
                <group position={[-0.9, 0.65, HOUSE_DEPTH / 2 - 2.8]}>
                    {/* Main Chassis / Lower Body */}
                    <mesh position={[0, 0.25, 0]} castShadow>
                        <boxGeometry args={[1.75, 0.65, 3.6]} />
                        <primitive object={materials.carBody} />
                    </mesh>
                    {/* Cabin / Greenhouse Roof */}
                    <mesh position={[0, 0.75, -0.2]} castShadow>
                        <boxGeometry args={[1.5, 0.55, 1.9]} />
                        <primitive object={materials.carGlass} />
                    </mesh>
                    {/* Front Hood Slope */}
                    <mesh position={[0, 0.45, 1.2]} rotation={[-0.2, 0, 0]} castShadow>
                        <boxGeometry args={[1.65, 0.2, 1.0]} />
                        <primitive object={materials.carBody} />
                    </mesh>
                    {/* Headlights */}
                    <mesh position={[-0.6, 0.35, 1.81]}>
                        <boxGeometry args={[0.3, 0.15, 0.04]} />
                        <primitive object={materials.carLightFront} />
                    </mesh>
                    <mesh position={[0.6, 0.35, 1.81]}>
                        <boxGeometry args={[0.3, 0.15, 0.04]} />
                        <primitive object={materials.carLightFront} />
                    </mesh>
                    {/* Taillights */}
                    <mesh position={[-0.6, 0.45, -1.81]}>
                        <boxGeometry args={[0.3, 0.15, 0.04]} />
                        <primitive object={materials.carLightTail} />
                    </mesh>
                    <mesh position={[0.6, 0.45, -1.81]}>
                        <boxGeometry args={[0.3, 0.15, 0.04]} />
                        <primitive object={materials.carLightTail} />
                    </mesh>
                    {/* 4 Wheels */}
                    {[-0.88, 0.88].map((wx, wxi) =>
                        [-1.15, 1.15].map((wz, wzi) => (
                            <group key={`wheel-${wxi}-${wzi}`} position={[wx, 0.05, wz]}>
                                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                                    <cylinderGeometry args={[0.28, 0.28, 0.22, 20]} />
                                    <primitive object={materials.carWheel} />
                                </mesh>
                                <mesh rotation={[0, 0, Math.PI / 2]} position={[wx > 0 ? 0.02 : -0.02, 0, 0]}>
                                    <cylinderGeometry args={[0.18, 0.18, 0.23, 16]} />
                                    <primitive object={materials.carRim} />
                                </mesh>
                            </group>
                        ))
                    )}
                </group>

                {/* 7. POTTED PLANTS & GARDEN ACCESSORIES */}
                <group position={[1.4, 0.35, HOUSE_DEPTH / 2 - 1.2]}>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.22, 0.16, 0.4, 16]} />
                        <primitive object={materials.pottery} />
                    </mesh>
                    <mesh position={[0, 0.35, 0]} castShadow>
                        <sphereGeometry args={[0.32, 12, 12]} />
                        <primitive object={materials.foliage} />
                    </mesh>
                </group>
                <group position={[2.2, 0.35, HOUSE_DEPTH / 2 - 1.2]}>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.18, 0.14, 0.35, 16]} />
                        <primitive object={materials.pottery} />
                    </mesh>
                    <mesh position={[0, 0.3, 0]} castShadow>
                        <sphereGeometry args={[0.26, 12, 12]} />
                        <primitive object={materials.foliage} />
                    </mesh>
                </group>
            </group>

            {/* 8. JPS WATER DEPTH GAUGE POLE (Tiang Pengukur Air JPS) */}
            <group position={[HOUSE_WIDTH / 2 + 1.8, 1.0, HOUSE_DEPTH / 2 + 0.6]}>
                <mesh castShadow>
                    <boxGeometry args={[0.12, 2.0, 0.12]} />
                    <primitive object={materials.fasciaBoard} />
                </mesh>
                <mesh position={[0, -0.6, 0.07]}>
                    <planeGeometry args={[0.14, 0.4]} />
                    <meshBasicMaterial color="#22c55e" />
                </mesh>
                <mesh position={[0, -0.2, 0.07]}>
                    <planeGeometry args={[0.14, 0.4]} />
                    <primitive object={materials.gaugeYellow} />
                </mesh>
                <mesh position={[0, 0.3, 0.07]}>
                    <planeGeometry args={[0.14, 0.6]} />
                    <primitive object={materials.gaugeRed} />
                </mesh>

                <Html position={[0.3, 0.6, 0]} transform distanceFactor={22} className="pointer-events-none select-none">
                    <div className="bg-slate-900/95 text-yellow-400 font-mono text-[9px] font-bold px-2 py-0.5 rounded-lg border border-yellow-500/60 whitespace-nowrap shadow-xl">
                        JPS 2.0m GAUGE
                    </div>
                </Html>
            </group>

            {/* 9. ENHANCED DYNAMIC FLOODWATER (Transparent Blue with Subtle Reflection) */}
            {activeLayers.floodScenario !== false && (
                <mesh
                    ref={waterMeshRef}
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, waterY, 0]}
                    receiveShadow
                >
                    <planeGeometry args={[32, 28, 32, 32]} />
                    <meshStandardMaterial
                        color={waterLevelM >= 1.0 ? '#034B78' : waterLevelM >= 0.5 ? '#0877B8' : '#18BFFF'}
                        transparent
                        opacity={waterLevelM > 0.02 ? 0.78 : 0.0}
                        roughness={0.10}
                        metalness={0.35}
                    />
                </mesh>
            )}

            {/* Glowing Roof Hazard Outline for High Risk / Severe State */}
            {activeLayers.hazardLayer !== false && hazardLevel !== 'SAFE' && (
                <mesh position={[0, CEILING_HEIGHT + ROOF_APEX_H * 0.45, -0.2]}>
                    <boxGeometry args={[HOUSE_WIDTH + 0.3, ROOF_APEX_H + 0.2, ROOF_DEPTH + 0.3]} />
                    <meshBasicMaterial
                        color={hazardLevel === 'SEVERE' || hazardLevel === 'HIGH_RISK' ? '#EF4444' : '#F59E0B'}
                        wireframe
                        transparent
                        opacity={0.8}
                    />
                </mesh>
            )}

            {/* 10. GEOSPATIAL MEASUREMENT CALLOUTS (Matching Exact Reference Design) */}
            {showCallouts && (
                <>
                    {/* Callout 1: Rooftop Risk Badge */}
                    {hazardLevel !== 'SAFE' && (
                        <Html position={[0, CEILING_HEIGHT + ROOF_APEX_H + 0.85, -0.2]} center distanceFactor={18}>
                            <div className={`px-3 py-1.5 rounded-xl text-white font-extrabold text-xs shadow-2xl flex items-center gap-1.5 backdrop-blur-md border ${
                                hazardLevel === 'SEVERE'
                                    ? 'bg-red-600/95 border-red-400 animate-bounce ring-2 ring-red-400/50'
                                    : hazardLevel === 'HIGH_RISK'
                                    ? 'bg-rose-600/95 border-rose-400 animate-pulse ring-2 ring-rose-400/50'
                                    : 'bg-amber-600/95 border-amber-400'
                            }`}>
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <span>{hazardLevel === 'SEVERE' ? 'Severe Flooding' : hazardLevel === 'HIGH_RISK' ? 'High Risk' : 'Caution Stage'}</span>
                            </div>
                        </Html>
                    )}

                    {/* Callout 2: Water Level (est.) */}
                    <Html position={[-3.8, Math.max(0.8, waterY + 0.4), 4.2]} center distanceFactor={19}>
                        <div className="bg-[#030C18]/92 backdrop-blur-md border border-[#1677FF] text-white rounded-xl px-3 py-2 shadow-2xl pointer-events-none min-w-[130px]">
                            <div className="text-[10px] font-semibold text-blue-400 flex items-center gap-1">
                                <span>≋</span>
                                <span>Water Level (est.)</span>
                            </div>
                            <div className="text-base font-extrabold text-white mt-0.5 tracking-tight">
                                {waterLevelM.toFixed(2)} m
                            </div>
                        </div>
                    </Html>

                    {/* Callout 3: House Elevation */}
                    <Html position={[4.0, 1.5, 3.0]} center distanceFactor={19}>
                        <div className="bg-[#030C18]/92 backdrop-blur-md border border-[#1677FF] text-white rounded-xl px-3 py-2 shadow-2xl pointer-events-none min-w-[130px]">
                            <div className="text-[10px] font-semibold text-blue-400 flex items-center gap-1.5">
                                <Home className="w-3 h-3 text-blue-400" />
                                <span>House Elevation</span>
                            </div>
                            <div className="text-base font-extrabold text-white mt-0.5 tracking-tight">
                                0.35 m
                            </div>
                        </div>
                    </Html>

                    {/* Callout 4: Road Flooding */}
                    {waterLevelM > 0.05 && (
                        <Html position={[-1.4, Math.max(0.5, waterY + 0.2), 7.6]} center distanceFactor={19}>
                            <div className="bg-[#030C18]/92 backdrop-blur-md border border-[#1677FF] text-white rounded-xl px-3 py-2 shadow-2xl pointer-events-none min-w-[130px]">
                                <div className="text-[10px] font-semibold text-blue-400 flex items-center gap-1">
                                    <span>≋</span>
                                    <span>Road Flooding</span>
                                </div>
                                <div className="text-base font-extrabold text-white mt-0.5 tracking-tight">
                                    {Math.max(0, waterLevelM - 0.10).toFixed(2)} m
                                </div>
                            </div>
                        </Html>
                    )}
                </>
            )}
        </group>
    );
}
