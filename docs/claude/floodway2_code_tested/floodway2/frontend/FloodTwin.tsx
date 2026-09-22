import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { floodMask, type Terrain } from "./floodMask";
import { flushQueue, newKey, sendSos, smsHref, sosText, type SosResult } from "./sosClient";
import { useTwinState, type Phase, type TwinState } from "./useTwinState";

const VEXAG = 3;                         // vertical exaggeration - the HUD says so; never hide it

/* ---------------- 3D scene ---------------- */
function Scene({ terrain, levelM }: { terrain: Terrain; levelM: number }) {
  const { rows, cols, cell_m: cell, elev_rel_m: elev } = terrain;
  const shown = useRef(levelM);
  const mask = useMemo(() => floodMask(terrain, levelM), [terrain, levelM]);

  const { ground, water } = useMemo(() => {
    const mk = () => {
      const g = new THREE.PlaneGeometry((cols - 1) * cell, (rows - 1) * cell, cols - 1, rows - 1);
      g.rotateX(-Math.PI / 2);
      return g;
    };
    const g = mk(), w = mk();
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setY(i, elev[i] * VEXAG);
    g.computeVertexNormals();
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3));
    return { ground: g, water: w };
  }, [terrain]);

  // tint terrain + place water only where flooded AND connected to the sensor
  useEffect(() => {
    const col = ground.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < col.count; i++) {
      const wet = mask[i] === 1;
      const d = wet ? Math.min(1, Math.max(0, (levelM - elev[i]) / 1.5)) : 0;
      col.setXYZ(i, wet ? 0.25 - 0.15 * d : 0.42, wet ? 0.45 - 0.2 * d : 0.55, wet ? 0.6 : 0.35);
    }
    col.needsUpdate = true;
  }, [mask, levelM]);

  useFrame((_, dt) => {                        // damped rise so the level never "teleports"
    shown.current = THREE.MathUtils.damp(shown.current, levelM, 1.8, dt);
    const pos = water.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setY(i, mask[i] ? shown.current * VEXAG : elev[i] * VEXAG - 0.5);
    pos.needsUpdate = true;
  });

  const span = Math.max(cols, rows) * cell;
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[span, span, span / 2]} intensity={0.9} />
      <mesh geometry={ground}><meshLambertMaterial vertexColors /></mesh>
      <mesh geometry={water}><meshPhongMaterial color="#2a7fbf" transparent opacity={0.72} shininess={80} /></mesh>
      <OrbitControls maxPolarAngle={Math.PI / 2.1} minDistance={span * 0.2} maxDistance={span * 1.4} target={[0, 0, 0]} />
    </>
  );
}

/* ---------------- HUD ---------------- */
const TONE: Record<Phase, { bg: string; title: string; sub: string }> = {
  NORMAL:  { bg: "#14532d", title: "No flood risk at this sensor", sub: "Keep the app open during heavy rain." },
  WARNING: { bg: "#92400e", title: "Water rising - prepare to leave", sub: "Pedestrian routes close first. Go before it reaches your street." },
  DANGER:  { bg: "#991b1b", title: "EVACUATE NOW", sub: "Water is at a level that stops cars and makes walking unsafe." },
};

function Forecast({ s }: { s: TwinState }) {
  if (!s.forecast) return <p style={{ opacity: 0.85 }}>Forecast unavailable - showing sensor reading only.</p>;
  const f = s.forecast;
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {f.horizons_min.map((h, i) => (
        <div key={h} style={{ flex: 1, background: "#0002", borderRadius: 8, padding: 6, textAlign: "center" }}>
          <div style={{ fontSize: 12 }}>+{h} min</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{f.p50[i].toFixed(2)} m</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>{f.p10[i].toFixed(2)}-{f.p90[i].toFixed(2)}</div>
        </div>
      ))}
    </div>
  );
}

export interface FloodTwinProps {
  deviceId: string; lat: number; lon: number; profile: string;
  terrainUrl: string; familyGroupId: string; familyNumbers: string[];   // numbers only for the SMS fallback
  getIdToken: () => Promise<string>;
  onNavigateToShelter: (dest: { name: string; lat: number; lon: number }, profile: string) => void;
  demoLevelM?: number;                                                  // demo mode ONLY: replays a recorded event, shows a DEMO badge
}

export default function FloodTwin(p: FloodTwinProps) {
  const { state, offline } = useTwinState({ deviceId: p.deviceId, lat: p.lat, lon: p.lon, profile: p.profile });
  const [terrain, setTerrain] = useState<Terrain | null>(null);
  const [sos, setSos] = useState<{ phase: "idle" | "countdown" | "done"; left: number; result?: SosResult }>({ phase: "idle", left: 5 });
  const sosKey = useRef<string>(newKey());

  useEffect(() => { fetch(p.terrainUrl).then((r) => r.json()).then(setTerrain).catch(() => setTerrain(null)); }, [p.terrainUrl]);
  useEffect(() => {                                             // flush queued SOS when the network returns
    const go = () => void flushQueue(p.getIdToken);
    window.addEventListener("online", go); go();
    return () => window.removeEventListener("online", go);
  }, []);

  useEffect(() => {                                             // 5 s undo window, then send
    if (sos.phase !== "countdown") return;
    if (sos.left <= 0) { void doSend(); return; }
    const t = setTimeout(() => setSos((s) => ({ ...s, left: s.left - 1 })), 1000);
    return () => clearTimeout(t);
  }, [sos]);

  async function doSend() {
    const pos = await new Promise<GeolocationPosition | null>((res) =>
      navigator.geolocation.getCurrentPosition(res, () => res(null), { timeout: 6000, maximumAge: 60_000, enableHighAccuracy: true }));
    const batt = await (navigator as any).getBattery?.().then((b: any) => Math.round(b.level * 100)).catch(() => undefined);
    const payload = {
      family_group_id: p.familyGroupId, lat: pos?.coords.latitude ?? p.lat, lon: pos?.coords.longitude ?? p.lon,
      accuracy_m: pos?.coords.accuracy, battery_pct: batt, level_m: state?.level_m, shelter_name: state?.shelter?.name,
      idempotency_key: sosKey.current,
    };
    const result = await sendSos(payload, p.getIdToken);
    setSos({ phase: "done", left: 0, result });
    if (result.state === "sent") sosKey.current = newKey();      // next SOS is a new event
  }

  if (!state) return <div style={{ padding: 24 }}>Connecting to sensor... {offline && "(no connection)"}</div>;

  const level = p.demoLevelM ?? state.level_m;
  const tone = TONE[state.phase];
  const showRoute = state.phase !== "NORMAL" && state.shelter;
  const smsBody = sosText({ lat: p.lat, lon: p.lon, level_m: level, shelter_name: state.shelter?.name });

  return (
    <div style={{ position: "relative", height: "100dvh", background: "#0b1220", color: "#fff" }}>
      {terrain && <Canvas camera={{ position: [0, 700, 900], fov: 45, far: 20000 }}><Scene terrain={terrain} levelM={level} /></Canvas>}

      <div style={{ position: "absolute", inset: "0 0 auto 0", padding: 12, background: tone.bg, animation: state.phase === "DANGER" ? "fwpulse 1s infinite" : undefined }}>
        <div style={{ fontSize: 20, fontWeight: 800 }}>{tone.title}</div>
        <div style={{ fontSize: 13 }}>{tone.sub}</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          {level.toFixed(2)} m now{state.stale && " - SENSOR OFFLINE, last reading " + Math.round((state.sensor_age_s ?? 0) / 60) + " min ago"}
          {offline && " - no connection, showing last known state"}{p.demoLevelM != null && " - DEMO REPLAY"} - heights x{VEXAG}
        </div>
      </div>

      <div style={{ position: "absolute", inset: "auto 0 0 0", padding: 12, display: "grid", gap: 8, background: "linear-gradient(transparent, #000c 30%)" }}>
        <Forecast s={state} />
        {showRoute && (
          <button onClick={() => p.onNavigateToShelter(state.shelter!, p.profile)}
            style={{ padding: 16, fontSize: 18, fontWeight: 800, borderRadius: 12, border: 0, color: "#fff",
                     background: state.phase === "DANGER" ? "#dc2626" : "#d97706", animation: state.phase === "DANGER" ? "fwpulse 1s infinite" : undefined }}>
            Navigate to Safe Shelter (PPS) - {state.shelter!.name} ({Math.round(state.shelter!.distance_m)} m)
          </button>
        )}
        {sos.phase === "idle" && (
          <button onClick={() => setSos({ phase: "countdown", left: 5 })} style={{ padding: 14, fontSize: 16, fontWeight: 700, borderRadius: 12, border: "2px solid #fff", background: "transparent", color: "#fff" }}>
            SOS - tell my family I'm evacuating
          </button>
        )}
        {sos.phase === "countdown" && (
          <button onClick={() => setSos({ phase: "idle", left: 5 })} style={{ padding: 14, fontSize: 16, fontWeight: 700, borderRadius: 12, border: 0, background: "#fff", color: "#111" }}>
            Sending in {sos.left}s - tap to CANCEL
          </button>
        )}
        {sos.phase === "done" && (
          <div style={{ padding: 12, borderRadius: 12, background: "#0008" }}>
            {sos.result?.state === "sent" && "Family notified."}
            {sos.result?.state === "queued" && (<>No data connection - SOS will send automatically when it returns. <a style={{ color: "#fff", fontWeight: 700 }} href={smsHref(p.familyNumbers, smsBody, navigator.userAgent)}>Send by SMS now</a></>)}
            {sos.result?.state === "rejected" && <>Could not send ({sos.result.detail}). <a style={{ color: "#fff", fontWeight: 700 }} href={smsHref(p.familyNumbers, smsBody, navigator.userAgent)}>Send by SMS</a></>}
            <button onClick={() => setSos({ phase: "idle", left: 5 })} style={{ marginLeft: 8 }}>OK</button>
          </div>
        )}
        <div style={{ fontSize: 11, opacity: 0.8 }}>{state.disclaimer}</div>
      </div>
      <style>{`@keyframes fwpulse{50%{filter:brightness(1.35)}}`}</style>
    </div>
  );
}
