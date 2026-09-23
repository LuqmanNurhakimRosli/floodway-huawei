import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Navigation,
  ShieldAlert,
  Maximize2,
  Minimize2,
  Compass,
  SlidersHorizontal,
  CloudRain,
  Sun,
  Waves,
  ShieldCheck,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { TerraceHouseScene } from '../components/simulation/TerraceHouseScene';
import { FamilySosModal } from '../components/simulation/FamilySosModal';
import { useApp } from '../contexts/AppContext';

type CameraPreset = 'front' | 'iso' | 'top' | 'rear';
type WeatherMode = 'daylight' | 'storm';

export function SimulationPage() {
  const navigate = useNavigate();
  const { waterLevelM, setWaterLevelM } = useApp();

  // Environmental Factor State (Default: Sunny morning dry baseline)
  const [levelM, setLevelM] = useState(0.00);
  const [weatherMode, setWeatherMode] = useState<WeatherMode>('daylight');
  const [rainfallMmHr, setRainfallMmHr] = useState(0);
  const [soilSaturationPct, setSoilSaturationPct] = useState(30);

  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('front');
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sri Muda Replay Sequence
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const replaySteps = [0.00, 0.18, 0.40, 0.95, 1.65];

  useEffect(() => {
    if (!isReplaying) return;
    const timer = setInterval(() => {
      setReplayIndex((prev) => {
        const next = (prev + 1) % replaySteps.length;
        const newLvl = replaySteps[next];
        setLevelM(newLvl);
        if (newLvl > 0.20) setWeatherMode('storm');
        else setWeatherMode('daylight');
        return next;
      });
    }, 2200);

    return () => clearInterval(timer);
  }, [isReplaying]);

  // Phase computation
  const phase = useMemo(() => {
    if (levelM >= 0.90) return 'DANGER';
    if (levelM >= 0.35) return 'WARNING';
    if (levelM >= 0.15) return 'CAUTION';
    return 'SAFE';
  }, [levelM]);

  // Three.js OrbitControls camera manipulation
  const controlsRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const setCameraAngle = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (!controlsRef.current) return;
    if (preset === 'front') {
      controlsRef.current.object.position.set(0, 4.2, 22);
      controlsRef.current.target.set(0, 1.6, 5);
    } else if (preset === 'iso') {
      controlsRef.current.object.position.set(13, 8.5, 20);
      controlsRef.current.target.set(0, 1.6, 4);
    } else if (preset === 'top') {
      controlsRef.current.object.position.set(0, 24, 4);
      controlsRef.current.target.set(0, 0, 4);
    } else if (preset === 'rear') {
      controlsRef.current.object.position.set(0, 7, -18);
      controlsRef.current.target.set(0, 1.6, -2);
    }
    controlsRef.current.update();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      canvasContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Preset Scenario Handler — snaps camera to the exact perspective illustrating the flood mechanism
  const applyPreset = (
    depth: number,
    rain: number,
    saturation: number,
    weather: WeatherMode,
    camPos?: [number, number, number],
    camTarget?: [number, number, number]
  ) => {
    setLevelM(depth);
    setRainfallMmHr(rain);
    setSoilSaturationPct(saturation);
    setWeatherMode(weather);
    if (camPos && camTarget && controlsRef.current) {
      controlsRef.current.object.position.set(...camPos);
      controlsRef.current.target.set(...camTarget);
      controlsRef.current.update();
    }
  };

  return (
    <div className="min-h-screen flex bg-[#071426]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 h-screen overflow-hidden">
        <Header />

        {/* FULL-WIDTH 3D DIGITAL TWIN CANVAS (100% WIDTH - NO RIGHT SIDEBAR) */}
        <div ref={canvasContainerRef} className="relative flex-1 w-full h-full overflow-hidden bg-gradient-to-b from-[#7ec0ee] to-[#d6eefe]">
          <Canvas
            shadows
            gl={{
              antialias: true,
              powerPreference: 'default',
              preserveDrawingBuffer: false,
              failIfMajorPerformanceCaveat: false,
            }}
            onCreated={({ gl }) => {
              gl.domElement.addEventListener('webglcontextlost', (e) => {
                e.preventDefault();
                console.warn('WebGL context lost handled gracefully');
              });
            }}
            camera={{ position: [13, 8.5, 20], fov: 45 }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          >
            {/* Dynamic Sky & Lighting */}
            {weatherMode === 'daylight' ? (
              <>
                <color attach="background" args={['#7ec0ee']} />
                <fog attach="fog" args={['#7ec0ee', 24, 75]} />
                <ambientLight intensity={1.1} />
                <directionalLight
                  position={[12, 18, 10]}
                  intensity={1.8}
                  castShadow
                  shadow-mapSize={[1024, 1024]}
                  shadow-camera-left={-15}
                  shadow-camera-right={15}
                  shadow-camera-top={15}
                  shadow-camera-bottom={-15}
                />
                {/* 360 Exterior Soft Fill Light so left and rear slopes/walls are beautifully sunlit */}
                <directionalLight
                  position={[-12, 14, -10]}
                  intensity={0.65}
                  color="#fffbeb"
                />
                <hemisphereLight intensity={0.5} groundColor="#1e3a24" color="#dbeafe" />
              </>
            ) : (
              <>
                <color attach="background" args={['#1e293b']} />
                <fog attach="fog" args={['#1e293b', 16, 55]} />
                <ambientLight intensity={0.4} />
                <directionalLight position={[6, 12, 4]} intensity={0.6} castShadow color="#94a3b8" />
                <pointLight position={[-4, 8, -2]} intensity={2.2} color="#60a5fa" />
              </>
            )}

            <Suspense fallback={null}>
              <TerraceHouseScene
                waterLevelM={levelM}
                showCallouts={true}
                weatherMode={weatherMode}
              />
            </Suspense>

            <OrbitControls
              ref={controlsRef}
              target={[0, 1.6, 4]}
              makeDefault
              maxPolarAngle={Math.PI / 2 - 0.04}
              minDistance={4}
              maxDistance={35}
              enableDamping
              dampingFactor={0.06}
            />
          </Canvas>

          {/* Top Floating Info Bar */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-2xl bg-[#091122]/85 backdrop-blur-md border border-slate-700/80 text-white shadow-xl flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${weatherMode === 'daylight' ? 'bg-amber-400' : 'bg-blue-400 animate-pulse'}`} />
              <span className="font-heading font-extrabold text-xs tracking-wider uppercase hidden sm:inline">
                3D Digital Twin · {weatherMode === 'daylight' ? 'Sunny Baseline' : 'Storm Inundation'}
              </span>
              <span className="font-heading font-extrabold text-xs tracking-wider uppercase sm:hidden">
                {weatherMode === 'daylight' ? '☀️ Dry' : '🌧️ Storm'}
              </span>
            </div>

            <button
              onClick={() => applyPreset(0.00, 0, 30, 'daylight', [13, 8.5, 20], [0, 1.6, 4])}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg"
              title="Reset Baseline"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Top Right Fullscreen & Camera Presets */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5">
            <button
              onClick={() => setWeatherMode(weatherMode === 'daylight' ? 'storm' : 'daylight')}
              className={`p-2 rounded-xl border backdrop-blur-md text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg ${
                weatherMode === 'daylight'
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-blue-500/20 border-blue-400/40 text-blue-300 hover:bg-blue-500/30'
              }`}
              title="Toggle Daylight / Storm Weather"
            >
              {weatherMode === 'daylight' ? <Sun className="w-4 h-4" /> : <CloudRain className="w-4 h-4" />}
              <span className="hidden sm:inline">{weatherMode === 'daylight' ? 'Sunny Morning' : 'Monsoon Storm'}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white backdrop-blur-md transition-colors cursor-pointer shadow-lg"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* EXPANDABLE BOTTOM ENVIRONMENTAL CONTROLS DRAWER */}
          {isDrawerOpen && (
            <div className="absolute bottom-20 left-4 right-4 md:left-6 md:right-auto md:w-[480px] z-20 bg-[#091428]/95 backdrop-blur-xl rounded-3xl border border-slate-700/80 p-4 shadow-2xl text-white animate-in slide-in-from-bottom-5 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                  <span className="font-heading font-extrabold text-xs tracking-wider uppercase text-white">
                    Environmental Factor Controls
                  </span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-3 text-xs">
                {/* Surface Flood Level */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300 font-semibold">Surface Flood Depth:</span>
                    <span className="font-mono font-extrabold text-blue-400 text-sm">{levelM.toFixed(2)} m</span>
                  </div>
                  <input
                    type="range"
                    min="0.00"
                    max="2.00"
                    step="0.02"
                    value={levelM}
                    onChange={(e) => setLevelM(parseFloat(e.target.value))}
                    className="w-full accent-[#1677FF] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0.00m (Dry)</span>
                    <span>0.15m (Porch)</span>
                    <span>0.35m (Exhaust)</span>
                    <span>0.90m (Floor)</span>
                    <span>2.00m</span>
                  </div>
                </div>

                {/* Rainfall Intensity */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300 font-semibold">Rainfall Precipitation:</span>
                    <span className="font-mono font-extrabold text-amber-400 text-xs">{rainfallMmHr} mm/h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    step="5"
                    value={rainfallMmHr}
                    onChange={(e) => {
                      const r = parseInt(e.target.value);
                      setRainfallMmHr(r);
                      if (r > 40) setWeatherMode('storm');
                    }}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Soil Saturation */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-300 font-semibold">Soil Drainage Saturation:</span>
                    <span className="font-mono font-extrabold text-emerald-400 text-xs">{soilSaturationPct}%</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="100"
                    step="5"
                    value={soilSaturationPct}
                    onChange={(e) => setSoilSaturationPct(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Quick Scenario Presets */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Calibrated Scenario Presets
                </span>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    onClick={() => applyPreset(0.00, 0, 30, 'daylight', [13, 8.5, 20], [0, 1.6, 4])}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-left border border-slate-700/60 font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-emerald-400">🌱 Normal Baseline</div>
                    <div className="text-[10px] text-slate-400">0.00m · Dry Sunny Baseline</div>
                  </button>
                  <button
                    onClick={() => applyPreset(0.20, 55, 65, 'daylight', [9, 5.5, 17], [0, 0.8, 9])}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-left border border-slate-700/60 font-semibold text-amber-300 transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-amber-300">🚗 Porch Spillover</div>
                    <div className="text-[10px] text-slate-400">0.20m · Curbside Overflow</div>
                  </button>
                  <button
                    onClick={() => applyPreset(0.40, 95, 85, 'storm', [-9, 4.5, 15], [-1.4, 0.6, 8.5])}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-left border border-slate-700/60 font-semibold text-orange-400 transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-orange-400">⚠️ Vehicle Stall</div>
                    <div className="text-[10px] text-slate-400">0.40m · Exhaust Submerged</div>
                  </button>
                  <button
                    onClick={() => applyPreset(0.95, 160, 98, 'storm', [8, 6.0, 14], [0, 1.2, 4])}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-left border border-slate-700/60 font-semibold text-red-400 transition-colors cursor-pointer"
                  >
                    <div className="font-bold text-red-400">🚨 Living Floor Breach</div>
                    <div className="text-[10px] text-slate-400">0.95m · Interior Ingress (+60cm)</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DOCKED BOTTOM COCKPIT COMMAND BAR */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-[#091122]/90 backdrop-blur-md border border-slate-700/80 shadow-2xl text-white">
            {/* Status & Live Depth */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <span
                className={`px-3 py-1 rounded-xl text-xs font-black tracking-wider shadow-sm ${
                  phase === 'SAFE'
                    ? 'bg-emerald-500 text-slate-950 font-extrabold'
                    : phase === 'CAUTION'
                    ? 'bg-amber-400 text-slate-950 font-extrabold'
                    : phase === 'WARNING'
                    ? 'bg-orange-500 text-white font-extrabold'
                    : 'bg-red-600 text-white font-extrabold animate-pulse'
                }`}
              >
                {phase}
              </span>

              <div className="flex items-baseline gap-1">
                <span className="font-mono text-lg font-black text-white">
                  {(levelM * 100).toFixed(0)}
                </span>
                <span className="text-xs text-slate-400 font-semibold">cm</span>
              </div>

              {/* Toggle Environmental Factors Drawer Button */}
              <button
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md ${
                  isDrawerOpen
                    ? 'bg-blue-600 border-blue-400 text-white'
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Simulation Controls</span>
                {isDrawerOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Camera Presets */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
              {(['front', 'iso', 'top', 'rear'] as CameraPreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setCameraAngle(p)}
                  className={`px-2.5 py-1 rounded-lg transition-all capitalize cursor-pointer ${
                    cameraPreset === p
                      ? 'bg-[#1677FF] text-white shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => navigate('/map')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-400" />
                <span>Route to Shelter</span>
              </button>

              <button
                onClick={() => setIsSosOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-red-500/25 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                <span>1-Tap SOS</span>
              </button>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>

      <FamilySosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        depthCm={Math.round(levelM * 100)}
        onProceedToNavigation={() => {
          setIsSosOpen(false);
          navigate('/map');
        }}
      />
    </div>
  );
}
