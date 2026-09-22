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
  ChevronUp,
  ChevronDown,
  Layers,
  Radio,
  Cpu
} from 'lucide-react';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { TerraceHouseScene } from '../components/simulation/TerraceHouseScene';
import { SimulationControlPanel } from '../components/simulation/SimulationControlPanel';
import { SimulationResultStrip } from '../components/simulation/SimulationResultStrip';
import { FamilySosModal } from '../components/simulation/FamilySosModal';
import { useApp } from '../contexts/AppContext';

export function SimulationPage() {
  const navigate = useNavigate();
  const { waterLevelM, setWaterLevelM } = useApp();

  // Primary digital twin water level
  const [levelM, setLevelM] = useState(0.90);
  const [rainfallMmHr, setRainfallMmHr] = useState(95);
  const [timeOffsetMin, setTimeOffsetMin] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState('current');

  const [cameraPreset, setCameraPreset] = useState<'iso' | 'top' | 'front'>('iso');
  const [showCallouts, setShowCallouts] = useState(true);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active layer filter pills
  const [activeLayers, setActiveLayers] = useState({
    floodScenario: true,
    waterFlow: true,
    hazardLayer: true,
    buildingLayer: true,
  });

  // Replay sequence state
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const replaySteps = [0.15, 0.45, 0.90, 1.35, 1.80];

  useEffect(() => {
    if (!isReplaying) return;
    const timer = setInterval(() => {
      setReplayIndex((prev) => {
        const next = (prev + 1) % replaySteps.length;
        setLevelM(replaySteps[next]);
        return next;
      });
    }, 2200);

    return () => clearInterval(timer);
  }, [isReplaying]);

  // Scenario selection handler
  const handleScenarioChange = (scenario: string) => {
    setSelectedScenario(scenario);
    setIsReplaying(false);
    if (scenario === 'sri-muda-2021') {
      setLevelM(1.65);
      setRainfallMmHr(140);
    } else if (scenario === 'heavy-rain') {
      setLevelM(1.20);
      setRainfallMmHr(120);
    } else if (scenario === 'rapid-rise') {
      setLevelM(1.40);
      setRainfallMmHr(110);
    } else if (scenario === 'drain-failure') {
      setLevelM(0.95);
      setRainfallMmHr(85);
    } else if (scenario === 'synthetic-extreme') {
      setLevelM(2.00);
      setRainfallMmHr(175);
    } else {
      setLevelM(0.90);
      setRainfallMmHr(95);
    }
  };

  const phase = useMemo(() => {
    if (levelM >= 1.00) return 'SEVERE';
    if (levelM >= 0.60) return 'HIGH RISK';
    if (levelM >= 0.30) return 'CAUTION';
    return 'SAFE';
  }, [levelM]);

  // Three.js OrbitControls camera manipulation
  const controlsRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const setCameraAngle = (preset: 'iso' | 'top' | 'front') => {
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
    setCameraAngle('iso');
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

  const toggleLayer = (layerKey: keyof typeof activeLayers) => {
    setActiveLayers((prev) => ({
      ...prev,
      [layerKey]: !prev[layerKey],
    }));
  };

  return (
    <div className="min-h-screen flex bg-[#050B14]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0 bg-[#050B14]">
        <Header />

        {/* Top Simulation Header Context Bar */}
        <div className="bg-[#071426] border-b border-[#18273d] px-4 py-3 text-white flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-start md:items-center gap-3">
            <button
              onClick={() => navigate('/map')}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Return to Evacuation Map"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-heading">
                  3D Digital Twin
                </span>
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span className="text-[10px] font-semibold text-slate-400">
                  Sri Muda Residential Flood Scenario
                </span>
              </div>
              <h1 className="font-heading font-extrabold text-base md:text-lg text-white leading-tight">
                Malaysia Single-Storey Terrace House
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Visualise flood impact, water flow and evacuation scenarios in real-time.
              </p>
            </div>
          </div>

          {/* Layer Filter Pills & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 4 Layer Toggles */}
            <div className="hidden xl:flex items-center gap-1 bg-[#0b1a2d] p-1 rounded-xl border border-[#182d47] text-xs font-semibold">
              <button
                onClick={() => toggleLayer('floodScenario')}
                className={`py-1 px-2.5 rounded-lg transition-colors ${
                  activeLayers.floodScenario ? 'bg-[#1677FF] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Flood Scenario
              </button>
              <button
                onClick={() => toggleLayer('waterFlow')}
                className={`py-1 px-2.5 rounded-lg transition-colors ${
                  activeLayers.waterFlow ? 'bg-[#1677FF] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Water Flow
              </button>
              <button
                onClick={() => toggleLayer('hazardLayer')}
                className={`py-1 px-2.5 rounded-lg transition-colors ${
                  activeLayers.hazardLayer ? 'bg-[#1677FF] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Hazard Layer
              </button>
              <button
                onClick={() => toggleLayer('buildingLayer')}
                className={`py-1 px-2.5 rounded-lg transition-colors ${
                  activeLayers.buildingLayer ? 'bg-[#1677FF] text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Building Layer
              </button>
            </div>

            {/* Replay Control */}
            <button
              onClick={() => setIsReplaying(!isReplaying)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                isReplaying
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-amber-500/20'
                  : 'bg-[#0f1e32] text-slate-200 border border-[#243A55] hover:bg-[#162a45]'
              }`}
            >
              {isReplaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isReplaying ? 'Pause Replay' : '▶ Sri Muda 2021 Replay'}</span>
            </button>

            {/* Label Toggle */}
            <button
              onClick={() => setShowCallouts(!showCallouts)}
              className="px-3 py-1.5 rounded-xl bg-[#0f1e32] text-slate-300 hover:text-white text-xs font-semibold border border-[#243A55] transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 inline mr-1" />
              <span>{showCallouts ? 'Hide Labels' : 'Show Labels'}</span>
            </button>
          </div>
        </div>

        {/* Center Spatial Workspace (Canvas + Right Control Panel) */}
        <div className="relative flex-1 flex flex-col lg:flex-row min-h-[460px] lg:min-h-[520px] bg-[#050B14] overflow-hidden">
          {/* Main Three.js Digital Twin Canvas (~65-70% width) */}
          <div ref={canvasContainerRef} className="relative flex-1 h-[460px] lg:h-auto bg-[#050B14] overflow-hidden">
            <Suspense fallback={<div className="text-white p-8 font-mono text-sm">Loading 3D Twin Physics Canvas...</div>}>
              <Canvas
                shadows
                camera={{ position: [11, 9, 13], fov: 45 }}
                className="w-full h-full cursor-grab active:cursor-grabbing"
              >
                <color attach="background" args={['#050B14']} />
                <ambientLight intensity={0.85} />
                <directionalLight
                  position={[10, 18, 12]}
                  intensity={1.9}
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
                {/* Secondary cyan fill light for dark theme contrast */}
                <directionalLight position={[-12, 10, -12]} intensity={0.45} color="#38bdf8" />
                <pointLight position={[-8, 6, -6]} intensity={0.35} />

                <TerraceHouseScene
                  waterLevelM={levelM}
                  showCallouts={showCallouts}
                  activeLayers={activeLayers}
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
            <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden sm:flex items-center gap-4 text-white">
              {/* Compass Rose */}
              <div className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-700/80 backdrop-blur-md flex flex-col items-center justify-center text-[10px] font-black text-slate-300 shadow-xl">
                <span className="text-[#1677FF] font-bold text-xs">▲</span>
                <span className="leading-none text-[9px]">N</span>
              </div>

              {/* Metric Scale Bar */}
              <div className="bg-slate-900/80 border border-slate-700/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-slate-300 text-[10px] font-mono shadow-xl">
                <div className="flex justify-between w-32 border-b border-slate-400 pb-0.5">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                  <span>15</span>
                  <span>20m</span>
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

          {/* Right-Side Simulation Control Panel */}
          <SimulationControlPanel
            waterLevelM={levelM}
            onWaterLevelChange={setLevelM}
            rainfallMmHr={rainfallMmHr}
            onRainfallChange={setRainfallMmHr}
            timeOffsetMin={timeOffsetMin}
            onTimeOffsetChange={setTimeOffsetMin}
            selectedScenario={selectedScenario}
            onSelectScenario={handleScenarioChange}
            isRunning={isReplaying}
            onToggleRun={() => setIsReplaying(!isReplaying)}
          />
        </div>

        {/* Bottom Analytical Interpretation Strip */}
        <SimulationResultStrip
          waterLevelM={levelM}
          cameraPreset={cameraPreset}
          onSelectCameraPreset={setCameraAngle}
          onOpenFullForecast={() => navigate('/map')}
        />

        {/* Quick-Control Bottom Emergency Toolbar */}
        <div className="bg-[#071426] border-t border-[#18273d] px-4 py-2.5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 z-20">
          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                phase === 'SEVERE'
                  ? 'bg-red-600 text-white animate-pulse'
                  : phase === 'HIGH RISK'
                  ? 'bg-rose-600 text-white'
                  : phase === 'CAUTION'
                  ? 'bg-amber-500 text-slate-950 font-extrabold'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {phase === 'SEVERE' ? '🔴 DANGER' : phase === 'HIGH RISK' ? '🟠 HIGH RISK' : phase}
            </span>
            <span className="font-mono text-base font-extrabold text-white">
              {levelM.toFixed(2)} <span className="text-xs text-slate-400 font-normal">m</span>
            </span>

            {/* Compact Quick Slider */}
            <input
              type="range"
              min="0"
              max="200"
              value={Math.round(levelM * 100)}
              onChange={(e) => {
                setIsReplaying(false);
                setLevelM(Number(e.target.value) / 100);
              }}
              className="w-28 sm:w-36 h-1.5 bg-slate-800 rounded-lg cursor-pointer accent-[#1677FF]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/map')}
              className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5 text-[#1677FF]" />
              <span>View Safe Route</span>
            </button>

            <button
              onClick={() => setIsSosOpen(true)}
              className="py-1.5 px-3.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-transform active:scale-95 cursor-pointer"
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
