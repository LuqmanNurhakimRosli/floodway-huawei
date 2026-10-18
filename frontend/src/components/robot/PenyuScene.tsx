import { ContactShadows, Html, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import * as THREE from 'three';
import type { PartId, RobotMode } from './robotSpec';

// PENYU concept robot, built from primitives (no model file to load). Units are metres.
// CONCEPT DESIGN, NOT BUILT: this is an illustration of the idea, not a CAD model of a working machine.

const C = {
  hull: '#7A8B63',      // recycled HDPE, olive
  hullDark: '#5C6B48',
  solar: '#1E3A5F',
  seam: '#A8B8C8',
  bumper: '#F97316',    // safety orange buoyancy ring
  metal: '#334155',
  rubber: '#1F2937',
  glass: '#38BDF8',
  water: '#5BA8C4',
  road: '#4B5563',
};

const WATER_Y: Record<RobotMode, number> = { patrol: -0.05, wade: 0.22, float: 0.58, dock: -0.05 };
const BODY_Y: Record<RobotMode, number> = { patrol: 0.34, wade: 0.34, float: 0.62, dock: 0.34 };
const BODY_X: Record<RobotMode, number> = { patrol: 0, wade: 0, float: 0, dock: -0.95 };

interface SceneProps {
  mode: RobotMode;
  exploded: boolean;
  selected: PartId | null;
  onSelect: (id: PartId) => void;
  reducedMotion: boolean;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A numbered hotspot. Real buttons, so they work with a keyboard and a screen reader as well as a pointer. */
function Hotspot({ n, id, label, position, selected, onSelect }: { n: number; id: PartId; label: string; position: [number, number, number]; selected: boolean; onSelect: (id: PartId) => void }) {
  return (
    <Html position={position} center zIndexRange={[20, 0]}>
      <button
        type="button"
        onClick={() => onSelect(id)}
        aria-label={`${n}. ${label}`}
        aria-pressed={selected}
        className="group flex h-11 w-11 items-center justify-center rounded-full focus:outline-none"
      >
        {/* 44px tap area, 32px dot */}
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-extrabold shadow-lg transition-transform group-focus-visible:ring-2 group-focus-visible:ring-[#1677FF] group-focus-visible:ring-offset-2 motion-reduce:transition-none ${
            selected ? 'scale-110 border-white bg-[#0958D9] text-white' : 'border-white bg-white/90 text-slate-900 group-hover:scale-110'
          }`}
        >
          {n}
        </span>
      </button>
    </Html>
  );
}

function Wheg({ position, spin }: { position: [number, number, number]; spin: MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.z = spin.current;
  });
  return (
    <group position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.08, 20]} />
        <meshStandardMaterial color={C.metal} metalness={0.6} roughness={0.35} />
      </mesh>
      <group ref={ref}>
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, 0, (i * Math.PI * 2) / 3]}>
            <mesh position={[0, 0.1, 0]} castShadow>
              <boxGeometry args={[0.035, 0.2, 0.06]} />
              <meshStandardMaterial color={C.rubber} roughness={0.8} />
            </mesh>
            <mesh position={[0.03, 0.2, 0]} rotation={[0, 0, -0.5]} castShadow>
              <boxGeometry args={[0.09, 0.03, 0.09]} />
              <meshStandardMaterial color={C.rubber} roughness={0.8} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function Water({ mode, reducedMotion }: { mode: RobotMode; reducedMotion: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(9, 9, 40, 40), []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  useFrame(({ clock }, dt) => {
    const m = mesh.current;
    if (!m) return;
    m.position.y = lerp(m.position.y, WATER_Y[mode], Math.min(1, dt * 1.6));
    (m.material as THREE.MeshStandardMaterial).opacity = lerp((m.material as THREE.MeshStandardMaterial).opacity, WATER_Y[mode] > 0 ? 0.55 : 0, Math.min(1, dt * 2));
    if (reducedMotion) return;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      pos.setZ(i, Math.sin(x * 2.1 + t * 1.4) * 0.012 + Math.cos(y * 2.7 + t * 1.1) * 0.01);
    }
    pos.needsUpdate = true;
  });
  return (
    <mesh ref={mesh} geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      <meshStandardMaterial color={C.water} transparent opacity={0} roughness={0.15} metalness={0.1} depthWrite={false} />
    </mesh>
  );
}

function Dock({ visible }: { visible: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    const s = lerp(ref.current.scale.y, visible ? 1 : 0.0001, Math.min(1, dt * 3));
    ref.current.scale.set(1, s, 1);
  });
  return (
    <group ref={ref} position={[-1.75, 0, 0]}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 2.4, 16]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.25, 2.45, 0]} rotation={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[0.7, 0.03, 0.45]} />
        <meshStandardMaterial color={C.solar} metalness={0.3} roughness={0.25} />
      </mesh>
      <mesh position={[0.35, 0.45, 0]} castShadow>
        <boxGeometry args={[0.55, 0.05, 0.8]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.6} />
      </mesh>
      <mesh position={[0.45, 0.48, 0]}>
        <boxGeometry args={[0.25, 0.012, 0.25]} />
        <meshStandardMaterial color="#22C55E" emissive="#22C55E" emissiveIntensity={visible ? 0.9 : 0} />
      </mesh>
    </group>
  );
}

function Robot({ mode, exploded, selected, onSelect, reducedMotion }: SceneProps) {
  const root = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Group>(null);
  const probe = useRef<THREE.Group>(null);
  const beacon = useRef<THREE.MeshStandardMaterial>(null);
  const spin = useRef(0);
  const ex = useRef(0);

  useFrame(({ clock }, dt) => {
    const k = Math.min(1, dt * 2.2);
    const r = root.current;
    if (!r) return;
    const t = clock.elapsedTime;
    const bob = mode === 'float' && !reducedMotion ? Math.sin(t * 1.3) * 0.025 : 0;
    r.position.y = lerp(r.position.y, BODY_Y[mode] + bob, k);
    r.position.x = lerp(r.position.x, BODY_X[mode], k * 0.6);
    r.position.z = lerp(r.position.z, mode === 'dock' ? 0 : 0, k);
    r.rotation.z = mode === 'float' && !reducedMotion ? Math.sin(t * 0.9) * 0.03 : lerp(r.rotation.z, 0, k);
    if (!reducedMotion && (mode === 'patrol' || mode === 'float')) spin.current -= dt * (mode === 'patrol' ? 2.2 : 1.2);
    ex.current = lerp(ex.current, exploded ? 1 : 0, k);
    if (shell.current) shell.current.position.y = 0.06 + ex.current * 0.35;
    if (probe.current) {
      const down = mode === 'wade' || mode === 'float' ? 1 : 0;
      probe.current.position.y = lerp(probe.current.position.y, -0.05 - down * 0.28, k);
    }
    if (beacon.current) beacon.current.emissiveIntensity = reducedMotion ? 1 : 0.4 + 0.9 * (Math.sin(t * 5) > 0.2 ? 1 : 0);
  });

  const e = exploded ? 1 : 0;
  const hs = (id: PartId) => selected === id;
  const seams = useMemo(() => new THREE.SphereGeometry(1, 14, 4, 0, Math.PI * 2, 0, Math.PI / 3.2), []);
  return (
    <group ref={root} position={[0, BODY_Y.patrol, 0]}>
      {/* hull and bumper */}
      <group onClick={(ev) => { ev.stopPropagation(); onSelect('hull'); }}>
        <mesh scale={[0.55, 0.16, 0.38]} castShadow receiveShadow>
          <sphereGeometry args={[1, 40, 20]} />
          <meshStandardMaterial color={C.hullDark} roughness={0.85} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={[0.57, 0.4, 1]} castShadow>
          <torusGeometry args={[1, 0.06, 12, 48]} />
          <meshStandardMaterial color={C.bumper} roughness={0.6} emissive={hs('hull') ? C.bumper : '#000'} emissiveIntensity={hs('hull') ? 0.25 : 0} />
        </mesh>
      </group>

      {/* solar shell: faceted dome so the panels read as tiles */}
      <group ref={shell} position={[0, 0.06, 0]} onClick={(ev) => { ev.stopPropagation(); onSelect('shell'); }}>
        <mesh scale={[0.5, 0.26, 0.35]} castShadow>
          <sphereGeometry args={[1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={C.hull} roughness={0.8} />
        </mesh>
        <mesh scale={[0.505, 0.265, 0.355]}>
          <sphereGeometry args={[1, 14, 4, 0, Math.PI * 2, 0, Math.PI / 3.2]} />
          <meshStandardMaterial color={C.solar} metalness={0.35} roughness={0.2} flatShading emissive={hs('shell') ? '#1D4ED8' : '#000'} emissiveIntensity={hs('shell') ? 0.35 : 0} />
        </mesh>
        <lineSegments scale={[0.507, 0.267, 0.357]}>
          <edgesGeometry args={[seams]} />
          <lineBasicMaterial color={C.seam} />
        </lineSegments>
      </group>

      {/* vision head */}
      <group position={[0.5 + e * 0.3, 0.05, 0]} onClick={(ev) => { ev.stopPropagation(); onSelect('head'); }}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.13, 0.26]} />
          <meshStandardMaterial color={C.hull} roughness={0.7} emissive={hs('head') ? '#38BDF8' : '#000'} emissiveIntensity={hs('head') ? 0.2 : 0} />
        </mesh>
        {[-0.065, 0.065].map((z) => (
          <mesh key={z} position={[0.085, 0.015, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 20]} />
            <meshStandardMaterial color={C.glass} emissive={C.glass} emissiveIntensity={0.6} metalness={0.2} roughness={0.1} />
          </mesh>
        ))}
        <mesh position={[0.082, -0.04, 0]}>
          <boxGeometry args={[0.01, 0.018, 0.2]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* debris rake */}
      <group position={[0.66 + e * 0.45, -0.18, 0]} onClick={(ev) => { ev.stopPropagation(); onSelect('rake'); }}>
        <mesh>
          <boxGeometry args={[0.03, 0.03, 0.56]} />
          <meshStandardMaterial color={C.metal} metalness={0.7} roughness={0.3} emissive={hs('rake') ? '#F59E0B' : '#000'} emissiveIntensity={hs('rake') ? 0.4 : 0} />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} position={[0.03, -0.05, -0.24 + i * 0.06]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.012, 0.11, 0.012]} />
            <meshStandardMaterial color={C.metal} metalness={0.7} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* LoRa mast and beacon */}
      <group position={[-0.38 - e * 0.25, 0.22 + e * 0.25, -0.12]} onClick={(ev) => { ev.stopPropagation(); onSelect('antenna'); }}>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.008, 0.012, 0.42, 8]} />
          <meshStandardMaterial color={C.metal} />
        </mesh>
        <mesh position={[0, 0.41, 0]}>
          <sphereGeometry args={[0.03, 16, 12]} />
          <meshStandardMaterial ref={beacon} color="#F59E0B" emissive="#F59E0B" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* depth probe: striped mast on the side that lowers to the road */}
      <group position={[0.15, 0, 0.42 + e * 0.3]} onClick={(ev) => { ev.stopPropagation(); onSelect('probe'); }}>
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[0.07, 0.08, 0.06]} />
          <meshStandardMaterial color={C.metal} />
        </mesh>
        <group ref={probe} position={[0, -0.05, 0]}>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[0, 0.2 - i * 0.05, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.05, 10]} />
              <meshStandardMaterial color={i % 2 ? '#FFFFFF' : '#DC2626'} emissive={hs('probe') ? '#DC2626' : '#000'} emissiveIntensity={hs('probe') ? 0.3 : 0} />
            </mesh>
          ))}
        </group>
      </group>

      {/* sonar pod under the hull */}
      <mesh position={[0.05, -0.17 - e * 0.25, 0]} onClick={(ev) => { ev.stopPropagation(); onSelect('sonar'); }}>
        <cylinderGeometry args={[0.07, 0.05, 0.05, 20]} />
        <meshStandardMaterial color="#0F172A" emissive={hs('sonar') ? '#38BDF8' : '#000'} emissiveIntensity={hs('sonar') ? 0.5 : 0} />
      </mesh>

      {/* wheel-legs */}
      <group onClick={(ev) => { ev.stopPropagation(); onSelect('whegs'); }}>
        {[[0.33, -0.16, 0.38], [-0.33, -0.16, 0.38], [0.33, -0.16, -0.38], [-0.33, -0.16, -0.38]].map((p, i) => (
          <Wheg key={i} position={[p[0] * (1 + e * 0.3), p[1] - e * 0.12, p[2] * (1 + e * 0.5)]} spin={spin} />
        ))}
      </group>

      <Hotspot n={1} id="shell" label="Solar shell" position={[0, 0.42 + e * 0.35, 0]} selected={hs('shell')} onSelect={onSelect} />
      <Hotspot n={2} id="hull" label="Recycled-plastic hull" position={[-0.16, 0, -0.41]} selected={hs('hull')} onSelect={onSelect} />
      <Hotspot n={3} id="whegs" label="Wheel-legs" position={[-0.33 * (1 + e * 0.3), -0.16 - e * 0.12, 0.5 + e * 0.2]} selected={hs('whegs')} onSelect={onSelect} />
      <Hotspot n={4} id="head" label="Vision head" position={[0.6 + e * 0.3, 0.16, 0]} selected={hs('head')} onSelect={onSelect} />
      <Hotspot n={5} id="probe" label="Depth probe" position={[0.15, 0.2, 0.52 + e * 0.3]} selected={hs('probe')} onSelect={onSelect} />
      <Hotspot n={6} id="rake" label="Debris rake" position={[0.74 + e * 0.45, -0.1, 0.3]} selected={hs('rake')} onSelect={onSelect} />
      <Hotspot n={7} id="antenna" label="LoRa relay mast" position={[-0.38 - e * 0.25, 0.72 + e * 0.25, -0.12]} selected={hs('antenna')} onSelect={onSelect} />
      <Hotspot n={8} id="sonar" label="Down-looking sonar" position={[0.05, -0.28 - e * 0.25, -0.2]} selected={hs('sonar')} onSelect={onSelect} />
    </group>
  );
}

function Road() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 9]} />
        <meshStandardMaterial color={C.road} roughness={0.95} />
      </mesh>
      {[-2.4, -0.8, 0.8, 2.4].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.002, 1.2]}>
          <planeGeometry args={[0.9, 0.08]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 0.075, -1.1]} receiveShadow castShadow>
        <boxGeometry args={[9, 0.15, 0.3]} />
        <meshStandardMaterial color="#9CA3AF" roughness={0.9} />
      </mesh>
      {/* a drain grate by the kerb, the thing the rake clears */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.2, 0.004, -0.8]}>
        <planeGeometry args={[0.6, 0.3]} />
        <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

export function PenyuScene(props: SceneProps) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [1.85, 1.2, 2.05], fov: 40 }} gl={{ antialias: true }} onPointerMissed={() => undefined}>
      <color attach="background" args={['#E2E8F0']} />
      <fog attach="fog" args={['#E2E8F0', 5, 11]} />
      <hemisphereLight args={['#F8FAFC', '#64748B', 0.85]} />
      <directionalLight position={[3, 5, 2]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
      <Road />
      <Dock visible={props.mode === 'dock'} />
      <Robot {...props} />
      <Water mode={props.mode} reducedMotion={props.reducedMotion} />
      <ContactShadows position={[0, 0.005, 0]} opacity={0.45} scale={6} blur={2} far={2} />
      <OrbitControls enablePan={false} minDistance={1.6} maxDistance={5} maxPolarAngle={Math.PI / 2.05} target={[0, 0.38, 0]} />
    </Canvas>
  );
}
