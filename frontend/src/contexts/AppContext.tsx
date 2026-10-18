import React, { createContext, useContext, useState, useEffect } from 'react';
import { FloodPhase, Shelter, CitizenReport, SosEvent, IoTStationTelemetry } from '../types';
import { fetchShelters, fetchReports } from '../services/api';
import type { Scenario } from '../components/map/FloodProneLayer';

interface AppContextType {
  waterLevelM: number;
  setWaterLevelM: (level: number) => void;
  floodPhase: FloodPhase;
  shelters: Shelter[];
  /** true once the shelter fetch has finished (successfully or not), so screens can tell loading from empty. */
  sheltersReady: boolean;
  reports: CitizenReport[];
  activeSos: SosEvent | null;
  setActiveSos: (sos: SosEvent | null) => void;
  familySafetyStatus: 'IDLE' | 'SOS_ACTIVE' | 'ARRIVED_SAFE';
  setFamilySafetyStatus: (status: 'IDLE' | 'SOS_ACTIVE' | 'ARRIVED_SAFE') => void;
  telemetry: IoTStationTelemetry;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  /** Simulated flood scenario for the demo map, shared so Home, the family circle and the map agree. */
  floodScenario: Scenario;
  setFloodScenario: (s: Scenario) => void;
  addReport: (r: CitizenReport) => void;
  upvoteReport: (id: string) => void;
  approveReport: (id: string, reviewerName: string, role: string, notes?: string) => void;
  rejectReport: (id: string, reason?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [waterLevelM, setWaterLevelM] = useState(1.20);
  const [selectedLocation, setSelectedLocation] = useState('Kampung Baru, Kuala Lumpur');
  const [floodScenario, setFloodScenario] = useState<Scenario>('warning');
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [sheltersReady, setSheltersReady] = useState(false);
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
    fetchShelters().then(setShelters).finally(() => setSheltersReady(true));
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

  const approveReport = (id: string, reviewerName: string, role: string, notes?: string) => {
    setReports((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'OFFICIAL_VERIFIED',
              humanVerification: {
                verifiedBy: reviewerName,
                role: (role as any) || 'Demo reviewer',
                reviewedAt: 'Just now',
                verdict: 'APPROVED',
                officialNotes: notes || 'Approved in the demo review desk. No agency was involved.',
              },
            }
          : item
      )
    );
  };

  const rejectReport = (id: string, reason?: string) => {
    setReports((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'REJECTED',
              humanVerification: {
                verifiedBy: 'Demo reviewer',
                role: 'Demo reviewer' as any,
                reviewedAt: 'Just now',
                verdict: 'REJECTED',
                officialNotes: reason || 'Rejected in the demo review desk.',
              },
            }
          : item
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        waterLevelM,
        setWaterLevelM,
        floodPhase,
        shelters,
        sheltersReady,
        reports,
        activeSos,
        setActiveSos,
        familySafetyStatus,
        setFamilySafetyStatus,
        telemetry,
        selectedLocation,
        setSelectedLocation,
        floodScenario,
        setFloodScenario,
        addReport,
        upvoteReport,
        approveReport,
        rejectReport
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
