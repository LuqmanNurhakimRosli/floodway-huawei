export type LayerCategory = 'basemap' | 'eo' | 'damage' | 'infrastructure' | 'routing';

export interface MapLayer {
  id: string;
  name: string;
  category: LayerCategory;
  visible: boolean;
  opacity: number;
  color: string;
  featureCount?: number;
  description: string;
  badge?: string;
}

export type DamageSeverity = 'DESTROYED' | 'MAJOR_DAMAGE' | 'MINOR_DAMAGE' | 'NO_CHANGE';

export interface DamageFeatureProperties {
  id: string;
  name: string;
  feature_type: 'building' | 'bridge' | 'facility' | 'road_block' | 'flood_zone';
  damage_class: DamageSeverity;
  confidence: number;
  source: string;
  timestamp: string;
  operational_tag: string;
  notes?: string;
}

export interface CriticalFacility {
  id: string;
  name: string;
  type: 'hospital' | 'bridge' | 'shelter' | 'staging_base';
  coordinates: [number, number]; // [lat, lng]
  status: 'operational' | 'compromised' | 'submerged' | 'alert';
  capacity?: string;
  details: string;
}

export interface RouteAnalysis {
  id: string;
  title: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estTimeMin: number;
  riskLevel: 'LOW' | 'MODERATE' | 'CRITICAL';
  status: 'viable' | 'caution' | 'impassable';
  confidence: number;
  reason: string;
  coordinates: [number, number][]; // Array of [lat, lng]
}

export interface ScenarioStats {
  aoiAreaKm2: number;
  floodAreaKm2: number;
  damagedStructuresCount: number;
  destroyedCount: number;
  majorDamageCount: number;
  minorDamageCount: number;
  impassableRoadsCount: number;
  viableCorridorsCount: number;
  criticalFacilitiesCount: number;
  overallConfidence: number;
  dataLatencyHours: number;
}

export interface DisasterScenario {
  id: string;
  name: string;
  subtitle: string;
  location: string;
  country: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  bbox: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
  eventDate: string;
  lastSatellitePass: string;
  sensor: string;
  processingModel: string;
  stats: ScenarioStats;
  criticalFacilities: CriticalFacility[];
  candidateRoutes: RouteAnalysis[];
  floodExtentGeoJson: GeoJSON.FeatureCollection;
  damagePolygonsGeoJson: GeoJSON.FeatureCollection;
  roadNetworkGeoJson: GeoJSON.FeatureCollection;
  sitrepLogs: Array<{
    time: string;
    level: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
    message: string;
  }>;
}
