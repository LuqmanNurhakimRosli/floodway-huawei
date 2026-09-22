import React, { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows } from '@react-three/drei';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Navigation,
  ShieldAlert,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Compass,
  SlidersHorizontal,
  CloudRain,
  Sun,
  CloudLightning,
  Clock,
  Waves,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ChevronRight
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

  // Primary Environmental Factors
  const [levelM, setLevelM] = useState(0.48);
  const [weatherMode, setWeatherMode] = useState<WeatherMode>('daylight');
  const [rainfallMmHr, setRainfallMmHr] = useState(65);
  const [soilSaturationPct, setSoilSaturationPct] = useState(45);
  const [forecastHorizonMin, setForecastHorizonMin] = useState(0);

  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('front');
  const [showCallouts, setShowCallouts] = useState(true);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sri Muda 2021 Replay Sequence
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
      controlsRef.current.object.position.set(0, 3.2, 12.5);
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

  const handleZoomIn = () => {
    if (controlsRef.current?.object) {
      controlsRef.current.object.position.multiplyScalar(0.85);
    }
  };

  const handleZoomOut = () => {
    if (controlsRef.current?.object) {
      controlsRef.current.object.position.multiplyScalar(1.15);
    }
  };

  const handleResetCamera = () => {
    setCameraAngle('front');
  };

  const toggleFullscreen = () => {
    if (!canvasContainerRef.current) return;
    if (!document.fullscreenElement) {
      canvasContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Preset Scenarios
  const handleSelectPreset = (name: string) => {
    setIsReplaying(false);
    if (name === 'dry') {
      setLevelM(0.00);
      setWeatherMode('daylight');
      setRainfallMmHr(0);
      setSoilSaturationPct(15);
    } else if (name === 'curb') {
      setLevelM(0.20);
      setWeatherMode('daylight');
      setRainfallMmHr(45);
      setSoilSaturationPct(55);
    } else if (name === 'exhaust') {
      setLevelM(0.40);
      setWeatherMode('storm');
      setRainfallMmHr(85);
      setSoilSaturationPct(80);
    } else if (name === 'living') {
      setLevelM(0.95);
      setWeatherMode('storm');
      setRainfallMmHr(120);
      setSoilSaturationPct(95);
    } else if (name === 'sri-muda') {
      setLevelM(1.65);
      setWeatherMode('storm');
      setRainfallMmHr(150);
      setSoilSaturationPct(100);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#050B14]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 bg-[#050B14]">
        <Header />

        {/* Top Simulation Header Context Bar */}
        <div className="bg-[#071426] border-b border-[#18273d] px-4 py-2.5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/map')}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Return to Evacuation Map"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block font-heading">
                3D Digital Twin Simulation
              </span>
              <h1 className="font-heading font-extrabold text-base md:text-lg text-white leading-tight">
                Malaysian Single-Storey Terrace House
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                High-fidelity Three.js physics twin with road, curb, exhaust & floor breach callouts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sri Muda Replay Button */}
            <button
              onClick={() => setIsReplaying(!isReplaying)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                isReplaying
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-amber-500/20'
                  : 'bg-[#0f1e32] text-slate-200 border border-[#243A55] hover:bg-[#162a45]'
              }`}
            >
              {isReplaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isReplaying ? 'Pause Replay' : 'Sri Muda 2021 Replay'}</span>
            </button>

            {/* Labels Toggle */}
            <button
              onClick={() => setShowCallouts(!showCallouts)}
              className="px-3 py-1.5 rounded-xl bg-[#0f1e32] text-slate-300 hover:text-white text-xs font-semibold border border-[#243A55] transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              <span>{showCallouts ? 'Hide Labels' : 'Show Labels'}</span>
            </button>
          </div>
        </div>

        {/* Center Spatial Workspace (3D Canvas + Right Sidebar Drawer) */}
        <div className="relative flex-1 flex flex-col lg:flex-row min-h-[460px] lg:min-h-[520px] bg-[#050B14] overflow-hidden">
          {/* Main Three.js Digital Twin Canvas */}
          <div ref={canvasContainerRef} className="relative flex-1 h-[460px] lg:h-auto overflow-hidden">
            <Suspense fallback={<div className="text-white p-8 font-mono text-sm">Loading 3D Twin Environment...</div>}>
              <Canvas
                shadows
                camera={{ position: [0, 3.2, 12.5], fov: 45 }}
                className="w-full h-full cursor-grab active:cursor-grabbing"
              >
                {/* Dynamic Background Color: Daylight tropical sky vs Monsoon storm */}
                <color attach="background" args={[weatherMode === 'daylight' ? '#7ec0ee' : '#071426']} />

                {/* Tropical Sunlight / Storm Lighting */}
                <ambientLight intensity={weatherMode === 'daylight' ? 1.1 : 0.6} />
                <directionalLight
                  position={[12, 20, 14]}
                  intensity={weatherMode === 'daylight' ? 2.2 : 1.4}
                  color={weatherMode === 'daylight' ? '#fffdf0' : '#e2e8f0'}
                  castShadow
                  shadow-mapSize-width={2048}
                  shadow-mapSize-height={2048}
                  shadow-camera-near={0.5}
                  shadow-camera-far={50}
                  shadow-camera-left={-10}
                  shadow-camera-right={10}
                  shadow-camera-top={10}
                  shadow-camera-bottom={-10}
                />
                {/* Secondary Blue Sky Fill Light */}
                <directionalLight
                  position={[-12, 10, -12]}
                  intensity={weatherMode === 'daylight' ? 0.6 : 0.35}
                  color={weatherMode === 'daylight' ? '#bae6fd' : '#38bdf8'}
                />

                <TerraceHouseScene
                  waterLevelM={levelM}
                  showCallouts={showCallouts}
                  weatherMode={weatherMode}
                />

                <ContactShadows position={[0, 0.01, 0]} opacity={0.65} scale={28} blur={1.4} far={8} />
                <OrbitControls
                  ref={controlsRef}
                  enableDamping
                  dampingFactor={0.05}
                  maxPolarAngle={Math.PI / 2 - 0.05}
                  minDistance={5}
                  maxDistance={26}
                />
              </Canvas>
            </Suspense>

            {/* Bottom-Left Compass & Scale Overlay */}
            <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden sm:flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-full bg-slate-900/85 border border-slate-700/80 backdrop-blur-md flex flex-col items-center justify-center text-[10px] font-black text-slate-200 shadow-xl">
                <span className="text-[#1677FF] font-bold text-xs">▲</span>
                <span className="leading-none text-[9px]">N</span>
              </div>

              <div className="bg-slate-900/85 border border-slate-700/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-slate-300 text-[10px] font-mono shadow-xl">
                <div className="flex justify-between w-28 border-b border-slate-400 pb-0.5">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                  <span>15m</span>
                </div>
                <div className="text-[9px] text-slate-400 text-center mt-0.5">Scale 1:100</div>
              </div>
            </div>

            {/* Right Edge On-Canvas Camera Toolbar */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
              <button
                onClick={handleZoomIn}
                className="w-9 h-9 rounded-xl bg-[#0b1a2d]/90 hover:bg-[#1677FF] text-slate-200 hover:text-white border border-[#1b2f4a] flex items-center justify-center transition-all shadow-xl cursor-pointer"
                title="Zoom In"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="w-9 h-9 rounded-xl bg-[#0b1a2d]/90 hover:bg-[#1677FF] text-slate-200 hover:text-white border border-[#1b2f4a] flex items-center justify-center transition-all shadow-xl cursor-pointer"
                title="Zoom Out"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="w-9 h-9 rounded-xl bg-[#0b1a2d]/90 hover:bg-[#1677FF] text-slate-200 hover:text-white border border-[#1b2f4a] flex items-center justify-center transition-all shadow-xl cursor-pointer"
                title="Fullscreen Toggle"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleResetCamera}
                className="w-9 h-9 rounded-xl bg-[#0b1a2d]/90 hover:bg-[#1677FF] text-slate-200 hover:text-white border border-[#1b2f4a] flex items-center justify-center transition-all shadow-xl cursor-pointer"
                title="Reset Camera View"
              >
                <Compass className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SIMULATOR RIGHT SIDEBAR DRAWER (Cleanly integrated matching /map layout) */}
          <div className="w-full lg:w-[360px] xl:w-[390px] bg-[#071426] border-l border-[#18273d] flex flex-col z-20 text-white shrink-0 overflow-y-auto max-h-[calc(100vh-140px)]">
            {/* Section 1: Environment & Weather Toggle */}
            <div className="p-4 border-b border-[#18273d] space-y-3 bg-[#0b1a2d]/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#1677FF]/20 border border-[#1677FF]/40 flex items-center justify-center text-[#38BDF8]">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <h3 className="font-heading font-black text-xs tracking-wider uppercase text-white">
                    Environmental Factors
                  </h3>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold">
                  TWIN COCKPIT
                </span>
              </div>

              {/* Weather Mode Switcher */}
              <div className="grid grid-cols-2 gap-1.5 bg-[#071426] p-1 rounded-xl border border-[#182d47] text-xs font-bold">
                <button
                  onClick={() => {
                    setWeatherMode('daylight');
                    if (levelM > 0.35) setLevelM(0.00);
                  }}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    weatherMode === 'daylight'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Daylight Normal</span>
                </button>

                <button
                  onClick={() => {
                    setWeatherMode('storm');
                    if (levelM === 0) setLevelM(0.48);
                  }}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    weatherMode === 'storm'
                      ? 'bg-[#1677FF] text-white font-extrabold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <CloudLightning className="w-3.5 h-3.5" />
                  <span>Monsoon Storm</span>
                </button>
              </div>
            </div>

            {/* Section 2: Physical Factor Sliders */}
            <div className="p-4 space-y-4 border-b border-[#18273d]">
              {/* Factor 1: Water Level */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-300">Surface Flood Level (m)</span>
                  <span className="font-mono text-xl font-black text-[#38BDF8]">
                    {levelM.toFixed(2)} m
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={Math.round(levelM * 100)}
                  onChange={(e) => {
                    setIsReplaying(false);
                    setLevelM(Number(e.target.value) / 100);
                  }}
                  className="w-full h-2 bg-[#18314D] rounded-lg appearance-none cursor-pointer accent-[#2F8CFF]"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>0.0m (Dry)</span>
                  <span>0.15m (Porch)</span>
                  <span>0.35m (Exhaust)</span>
                  <span>0.90m (Floor)</span>
                  <span>2.0m</span>
                </div>
              </div>

              {/* Factor 2: Rainfall Rate */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-300">Rainfall Precipitation</span>
                  <span className="font-mono text-sm font-black text-amber-400">
                    {rainfallMmHr} mm/h
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="180"
                  value={rainfallMmHr}
                  onChange={(e) => setRainfallMmHr(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#18314D] rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>0 (Clear)</span>
                  <span>50 (Moderate)</span>
                  <span>100 (Torrential)</span>
                  <span>180+ (Cloudburst)</span>
                </div>
              </div>

              {/* Factor 3: Soil Saturation & Drainage */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-300">Soil Saturation / Drainage</span>
                  <span className="font-mono text-sm font-black text-emerald-400">
                    {soilSaturationPct}% Full
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={soilSaturationPct}
                  onChange={(e) => setSoilSaturationPct(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#18314D] rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Permeable</span>
                  <span>Surface Runoff</span>
                  <span>Saturated (Inundation)</span>
                </div>
              </div>
            </div>

            {/* Section 3: Preset Flood Scenarios */}
            <div className="p-4 space-y-2.5 border-b border-[#18273d]">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Calibrated Scenario Presets
              </span>

              <div className="grid grid-cols-1 gap-1.5">
                <button
                  onClick={() => handleSelectPreset('dry')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    levelM === 0 && weatherMode === 'daylight'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400'
                      : 'border-[#1b2e47] bg-[#0b1a2d]/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div>
                    <span className="font-bold block">☀️ Normal Baseline (Dry)</span>
                    <span className="text-[10px] text-slate-400">0.00m · Green lawn & dry street</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700">SAFE</span>
                </button>

                <button
                  onClick={() => handleSelectPreset('curb')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    Math.abs(levelM - 0.20) < 0.05
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 ring-1 ring-amber-400'
                      : 'border-[#1b2e47] bg-[#0b1a2d]/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div>
                    <span className="font-bold block">🌧️ Curbside Spillover</span>
                    <span className="text-[10px] text-slate-400">0.20m · Porch threshold breached</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700">CAUTION</span>
                </button>

                <button
                  onClick={() => handleSelectPreset('exhaust')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    Math.abs(levelM - 0.40) < 0.05
                      ? 'border-rose-500 bg-rose-500/15 text-rose-300 ring-1 ring-rose-400'
                      : 'border-[#1b2e47] bg-[#0b1a2d]/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div>
                    <span className="font-bold block">⚠️ Exhaust Hydrolock Threat</span>
                    <span className="text-[10px] text-slate-400">0.40m · Vehicle tailpipe underwater</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-700">WARNING</span>
                </button>

                <button
                  onClick={() => handleSelectPreset('living')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    Math.abs(levelM - 0.95) < 0.05
                      ? 'border-red-500 bg-red-500/20 text-red-300 ring-1 ring-red-400'
                      : 'border-[#1b2e47] bg-[#0b1a2d]/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div>
                    <span className="font-bold block">🚨 Living Room Floor Breach</span>
                    <span className="text-[10px] text-slate-400">0.95m · Ingress to living quarters</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-700 animate-pulse">DANGER</span>
                </button>

                <button
                  onClick={() => handleSelectPreset('sri-muda')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    Math.abs(levelM - 1.65) < 0.05
                      ? 'border-red-600 bg-red-600/30 text-white ring-2 ring-red-500'
                      : 'border-[#1b2e47] bg-[#0b1a2d]/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div>
                    <span className="font-bold block text-red-400">🌊 Sri Muda 2021 Catastrophe</span>
                    <span className="text-[10px] text-slate-400">1.65m · Roof sanctuary level</span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-600 text-white">CRITICAL</span>
                </button>
              </div>
            </div>

            {/* Section 4: Physical Damage Assessment Card */}
            <div className="p-4 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Impact On Residence
              </span>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between p-2 rounded-lg bg-[#0b1a2d] border border-[#182d47]">
                  <span className="text-slate-400">Car Porch Slab (+0.15m):</span>
                  <span className={`font-bold ${levelM >= 0.15 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {levelM >= 0.15 ? 'SUBMERGED' : 'DRY'}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#0b1a2d] border border-[#182d47]">
                  <span className="text-slate-400">Sedan Car Exhaust (+0.35m):</span>
                  <span className={`font-bold ${levelM >= 0.35 ? 'text-red-400 font-black animate-pulse' : 'text-emerald-400'}`}>
                    {levelM >= 0.35 ? 'HYDROLOCK IMMOBILIZED' : 'SAFE'}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-[#0b1a2d] border border-[#182d47]">
                  <span className="text-slate-400">Main Living Floor (+0.90m):</span>
                  <span className={`font-bold ${levelM >= 0.90 ? 'text-red-400 font-black animate-pulse' : 'text-emerald-400'}`}>
                    {levelM >= 0.90 ? 'BREACHED (EVACUATE)' : 'SECURE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM QUICK-CONTROL COCKPIT BAR (Matching Screenshot 100%) */}
        <div className="bg-[#071426] border-t border-[#18273d] p-2.5 md:px-5 md:py-2.5 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 z-30 shrink-0">
          {/* Risk Badge & Depth Slider */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span
              className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider shrink-0 ${
                phase === 'DANGER'
                  ? 'bg-red-600 text-white animate-pulse'
                  : phase === 'WARNING'
                  ? 'bg-amber-500 text-slate-950 font-extrabold'
                  : phase === 'CAUTION'
                  ? 'bg-yellow-500 text-slate-950'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {phase}
            </span>

            <span className="font-heading font-extrabold text-base text-white shrink-0">
              {(levelM * 100).toFixed(0)} <span className="text-xs font-normal text-slate-400">cm</span>
            </span>

            <input
              type="range"
              min="0"
              max="200"
              value={Math.round(levelM * 100)}
              onChange={(e) => {
                setIsReplaying(false);
                const val = Number(e.target.value) / 100;
                setLevelM(val);
                if (val > 0.20) setWeatherMode('storm');
              }}
              className="flex-1 accent-[#1677FF] h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* 4 Camera Presets (Front, Iso, Top, Rear) */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl shrink-0">
            {(['front', 'iso', 'top', 'rear'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setCameraAngle(mode)}
                className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-colors cursor-pointer ${
                  cameraPreset === mode ? 'bg-[#1677FF] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Actions: Route & 1-Tap SOS */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/map')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-[#1677FF]" />
              <span>Route</span>
            </button>

            <button
              onClick={() => setIsSosOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-transform active:scale-95 cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>1-Tap SOS</span>
            </button>
          </div>
        </div>

        {/* Resized, Non-intrusive Family SOS Modal */}
        <FamilySosModal
          isOpen={isSosOpen}
          onClose={() => setIsSosOpen(false)}
          depthCm={Math.round(levelM * 100)}
          onProceedToNavigation={() => navigate('/map')}
        />

        <BottomNav />
      </div>
    </div>
  );
}
