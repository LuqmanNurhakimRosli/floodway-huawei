import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { TerraceHouseScene } from '../components/simulation/TerraceHouseScene';
import { SimulationCockpit } from '../components/simulation/SimulationCockpit';
import { FamilySosModal } from '../components/simulation/FamilySosModal';

export function SimulationPage() {
  const navigate = useNavigate();
  const [depthCm, setDepthCm] = useState(18);
  const [cameraView, setCameraView] = useState<'overview' | 'ground' | 'top'>('overview');
  const [isSosOpen, setIsSosOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header />

        <div className="relative flex-1 w-full h-[calc(100vh-64px)] bg-[#071426] overflow-hidden">
          {/* Top Title Overlay */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
              3D Digital Twin Simulation
            </span>
            <h1 className="font-heading font-extrabold text-lg md:text-xl text-white">
              Malaysian Single-Storey Terrace House
            </h1>
            <p className="text-xs text-slate-400">
              Live physics simulation with water accretion, rain particle system & flood staff gauge.
            </p>
          </div>

          {/* Three.js 3D Canvas */}
          <TerraceHouseScene waterDepthCm={depthCm} cameraView={cameraView} />

          {/* Ultra-Slim Cockpit Bar (~48px height) with 1-Tap Minimize */}
          <SimulationCockpit
            depthCm={depthCm}
            setDepthCm={setDepthCm}
            cameraView={cameraView}
            setCameraView={setCameraView}
            onOpenSos={() => setIsSosOpen(true)}
            onNavigate={() => navigate('/navigation/shelter-01')}
          />

          {/* Family LifeLine SOS Modal with Telegram Broadcast Trigger */}
          <FamilySosModal
            isOpen={isSosOpen}
            onClose={() => setIsSosOpen(false)}
            depthCm={depthCm}
            onProceedToNavigation={() => navigate('/navigation/shelter-01')}
          />
        </div>

        <BottomNav />
      </div>
    </div>
  );
}
