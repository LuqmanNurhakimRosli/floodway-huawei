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
  status: 'OPEN' | 'FULL' | 'STANDBY' | 'CLOSED';
  currentCapacity: number;
  maxCapacity: number;
  contact: string;
  facilities: string[];
  elevationM: number;
  routeStatus: 'CLEAR' | 'ADVISORY' | 'BLOCKED';
  distanceKm: number;
  travelTimeMin: number;
}

export interface AiVerificationResult {
  verified: boolean;
  confidenceScore: number;
  detectedHazards: string[];
  estimatedDepthCm: number;
  engine: string;
  notes: string;
}

export interface HumanVerificationResult {
  verifiedBy: string;
  role: string;
  reviewedAt: string;
  verdict: 'APPROVED' | 'REJECTED';
  officialNotes?: string;
}

export interface CitizenReport {
  id: string;
  title: string;
  location: string;
  lat: number;
  lon: number;
  waterDepthCm: number;
  status: 'OFFICIAL_VERIFIED' | 'AI_VERIFIED' | 'VERIFIED' | 'UNDER_REVIEW' | 'REJECTED';
  verifiedBy: string;
  timestampStr: string;
  author: string;
  upvotes: number;
  imageUrl?: string;
  description?: string;
  aiVerification?: AiVerificationResult;
  humanVerification?: HumanVerificationResult;
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
