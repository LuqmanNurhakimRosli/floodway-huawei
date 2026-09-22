export type FloodPhase = 'NORMAL' | 'ADVISORY' | 'WARNING' | 'DANGER';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isDemo?: boolean;
}

export interface FamilyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  notifyOnSos: boolean;
}

export interface IoTStationTelemetry {
  deviceId: string;
  name: string;
  mountHeightCm: number;
  distanceCm: number;
  waterLevelM: number;
  waterDepthCm: number;
  stage: 'Normal' | 'Alert' | 'Warning' | 'Danger';
  batteryPct: number;
  isOnline: boolean;
  lastUpdated: string;
}

export interface ForecastData {
  source: string;
  horizonsMin: number[];
  p10: number[];
  p50: number[];
  p90: number[];
  peakLevelM: number;
  timeToPeakMin: number;
  timeToDangerMin: number | null;
  confidenceScore: number;
}

export interface Shelter {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  address: string;
  status: 'OPEN' | 'FULL' | 'STANDBY';
  currentCapacity: number;
  maxCapacity: number;
  contact: string;
  facilities: string[];
  elevationM: number;
  routeStatus: 'CLEAR' | 'ADVISORY' | 'BLOCKED';
  distanceKm: number;
  travelTimeMin: number;
}

export interface CitizenReport {
  id: string;
  title: string;
  location: string;
  lat: number;
  lon: number;
  waterDepthCm: number;
  status: 'VERIFIED' | 'UNDER_REVIEW' | 'RESOLVED';
  verifiedBy: string;
  timestampStr: string;
  author: string;
  upvotes: number;
  imageUrl?: string;
}

export interface SosEvent {
  id: string;
  timestamp: string;
  userName: string;
  phone: string;
  lat: number;
  lon: number;
  waterDepthCm: number;
  shelterName: string;
  note?: string;
  telegramSent: boolean;
  status: 'ACTIVE' | 'ARRIVED' | 'RESOLVED';
}
