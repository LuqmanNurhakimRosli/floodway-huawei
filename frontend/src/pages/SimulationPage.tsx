import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import { Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, Eye, Navigation, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { TerraceHouseScene } from '../components/simulation/TerraceHouseScene';
import { FamilySosModal } from '../components/simulation/FamilySosModal';
import { useApp } from '../contexts/AppContext';

type CameraPreset = 'front' | 'iso' | 'top' | 'rear';

export function SimulationPage() {
  const navigate = useNavigate();
  const { waterLevelM, setWaterLevelM } = useApp();

  // Effective water level in meters
  const [levelM, setLevelM] = useState(0.18);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('front');
  const [showCallouts, setShowCallouts] = useState(true);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isCockpitMinimized, setIsCockpitMinimized] = useState(false);

  // Sri Muda 2021 Demo Sequence Replay (5-step flood progression)
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const replaySteps = [0.05, 0.18, 0.38, 0.75, 1.10];

  useEffect(() => {
    if (!isReplaying) return;
    const timer = setInterval(() => {
      setReplayIndex((prev) => {
        const next = (prev + 1) % replaySteps.length;
        setLevelM(replaySteps[next]);
        return next;
      });
    }, 2400);

    return () => clearInterval(timer);
  }, [isReplaying]);

  const phase = useMemo(() => {
    if (levelM >= 0.35) return 'DANGER';
    if (levelM >= 0.15) return 'WARNING';
    return 'NORMAL';
  }, [levelM]);

  // Controls ref for camera presets
  const controlsRef = useRef<any>(null);

  const setCameraAngle = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (!controlsRef.current) return;
    if (preset === 'front') {
      controlsRef.current.object.position.set(0, 3.5, 12);
      controlsRef.current.target.set(0, 1.2, 0);
    } else if (preset === 'iso') {
      controlsRef.current.object.position.set(11, 9, 13);
      controlsRef.current.target.set(0, 1.2, 0);
    } else if (preset === 'top') {
      controlsRef.current.object.position.set(0, 18, 0.1);
      controlsRef.current.target.set(0, 0, 0);
    } else if (preset === 'rear') {
      controlsRef.current.object.position.set(0, 4.5, -12);
      controlsRef.current.target.set(0, 1.5, -2);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header />

        <div className="relative flex-1 w-full h-[calc(100vh-64px)] bg-[#071426] overflow-hidden select-none">
          {/* Top Title Overlay */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
              3D Digital Twin Simulation
            </span>
            <h1 className="font-heading font-extrabold text-lg md:text-xl text-white">
              Malaysian Single-Storey Terrace House
            </h1>
            <p className="text-xs text-slate-400">
              High-fidelity Three.js physics twin with road, curb, exhaust & floor breach callouts.
            </p>
          </div>

          {/* Top-Right Demonstration Toolbar */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
            <button
              onClick={() => setIsReplaying(!isReplaying)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-colors ${
                isReplaying
                  ? 'bg-amber-500 text-slate-950 font-extrabold'
                  : 'bg-slate-900/90 text-white border border-slate-700 hover:bg-slate-800'
              }`}
            >
              {isReplaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isReplaying ? 'Pause Replay' : 'Sri Muda 2021 Replay'}</span>
            </button>

            <button
              onClick={() => setShowCallouts(!showCallouts)}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold backdrop-blur-md"
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              <span>{showCallouts ? 'Hide Labels' : 'Show Labels'}</span>
            </button>
          </div>

          {/* Canvas WebGL Scene */}
          <Suspense fallback={<div className="text-white p-8">Loading 3D Terrace House...</div>}>
            <Canvas
              shadows
              camera={{ position: [11, 9, 13], fov: 45 }}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            >
              <ambientLight intensity={0.9} />
              <directionalLight
                position={[10, 16, 12]}
                intensity={1.8}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
              />
              <pointLight position={[-8, 6, -6]} intensity={0.4} />

              <TerraceHouseScene waterLevelM={levelM} showCallouts={showCallouts} />

              <ContactShadows position={[0, 0.01, 0]} opacity={0.65} scale={26} blur={1.5} far={8} />
              <OrbitControls
                ref={controlsRef}
                enableDamping
                dampingFactor={0.05}
                maxPolarAngle={Math.PI / 2 - 0.05}
                minDistance={5}
                maxDistance={25}
              />
            </Canvas>
          </Suspense>

          {/* Ultra-Slim Cockpit Bar (~48px height) with 1-Tap Minimize */}
          {isCockpitMinimized ? (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
              <button
                onClick={() => setIsCockpitMinimized(false)}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 shadow-2xl hover:bg-slate-800 transition-all text-xs font-bold"
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    phase === 'DANGER' ? 'bg-red-500 animate-ping' : phase === 'WARNING' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                />
                <span>{(levelM * 100).toFixed(0)} cm Depth · {phase}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-blue-400 border border-slate-600 flex items-center gap-1">
                  Controls <ChevronUp className="w-3 h-3" />
                </span>
              </button>
            </div>
          ) : (
            <div className="absolute bottom-4 left-3 right-3 md:left-6 md:right-6 z-30">
              <div className="max-w-4xl mx-auto rounded-2xl bg-[#071426]/95 backdrop-blur-xl border border-slate-700/80 p-2.5 md:px-4 md:py-2 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Depth Slider */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                        phase === 'DANGER'
                          ? 'bg-red-600 text-white'
                          : phase === 'WARNING'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {phase}
                    </span>
                    <span className="font-heading font-extrabold text-sm md:text-base text-white">
                      {(levelM * 100).toFixed(0)} <span className="text-xs font-medium text-slate-400">cm</span>
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="150"
                    value={Math.round(levelM * 100)}
                    onChange={(e) => {
                      setIsReplaying(false);
                      setLevelM(Number(e.target.value) / 100.0);
                    }}
                    className="flex-1 accent-[#1677FF] h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Camera View Switcher */}
                <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl shrink-0">
                  {(['front', 'iso', 'top', 'rear'] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setCameraAngle(v)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg capitalize transition-colors ${
                        cameraPreset === v ? 'bg-[#1677FF] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>

                {/* Evac, SOS and Minimize Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate('/navigation/shelter-01')}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 border border-slate-700"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#1677FF]" />
                    <span>Route</span>
                  </button>

                  <button
                    onClick={() => setIsSosOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-transform active:scale-95"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>1-Tap SOS</span>
                  </button>

                  <button
                    onClick={() => setIsCockpitMinimized(true)}
                    className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Minimize Cockpit"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Family SOS Modal */}
          <FamilySosModal
            isOpen={isSosOpen}
            onClose={() => setIsSosOpen(false)}
            depthCm={Math.round(levelM * 100)}
            onProceedToNavigation={() => navigate('/navigation/shelter-01')}
          />
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
