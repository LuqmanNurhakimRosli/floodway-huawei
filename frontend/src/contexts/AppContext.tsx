import React, { createContext, useContext, useState, useEffect } from 'react';
import { FloodPhase, Shelter, CitizenReport, SosEvent, IoTStationTelemetry } from '../types';
import { fetchShelters, fetchReports } from '../services/api';

interface AppContextType {
  waterLevelM: number;
  setWaterLevelM: (level: number) => void;
  floodPhase: FloodPhase;
  shelters: Shelter[];
  reports: CitizenReport[];
  activeSos: SosEvent | null;
  setActiveSos: (sos: SosEvent | null) => void;
  familySafetyStatus: 'IDLE' | 'SOS_ACTIVE' | 'ARRIVED_SAFE';
  setFamilySafetyStatus: (status: 'IDLE' | 'SOS_ACTIVE' | 'ARRIVED_SAFE') => void;
  telemetry: IoTStationTelemetry;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  addReport: (r: CitizenReport) => void;
  upvoteReport: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [waterLevelM, setWaterLevelM] = useState(1.20);
  const [selectedLocation, setSelectedLocation] = useState('Kampung Baru, Kuala Lumpur');
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [activeSos, setActiveSos] = useState<SosEvent | null>(null);
  const [familySafetyStatus, setFamilySafetyStatus] = useState<'IDLE' | 'SOS_ACTIVE' | 'ARRIVED_SAFE'>('IDLE');

  const [telemetry, setTelemetry] = useState<IoTStationTelemetry>({
    deviceId: 'fw-node-01',
    name: 'Kampung Baru Station (Klang River)',
    mountHeightCm: 400,
    distanceCm: 280,
    waterLevelM: 1.20,
    waterDepthCm: 120,
    stage: 'Warning',
    batteryPct: 94,
    isOnline: true,
    lastUpdated: '2 min ago'
  });

  useEffect(() => {
    fetchShelters().then(setShelters);
    fetchReports().then(setReports);
  }, []);

  const floodPhase: FloodPhase = waterLevelM >= 1.50 ? 'DANGER' : waterLevelM >= 1.15 ? 'WARNING' : waterLevelM >= 0.70 ? 'ADVISORY' : 'NORMAL';

  const addReport = (r: CitizenReport) => {
    setReports((prev) => [r, ...prev]);
  };

  const upvoteReport = (id: string) => {
    setReports((prev) =>
      prev.map((item) => (item.id === id ? { ...item, upvotes: item.upvotes + 1 } : item))
    );
  };

  return (
    <AppContext.Provider
      value={{
        waterLevelM,
        setWaterLevelM,
        floodPhase,
        shelters,
        reports,
        activeSos,
        setActiveSos,
        familySafetyStatus,
        setFamilySafetyStatus,
        telemetry,
        selectedLocation,
        setSelectedLocation,
        addReport,
        upvoteReport
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
