export interface WaypointManeuver {
  id: number;
  instruction: string;
  distance: string;
  roadName?: string;
  hazardWarning?: string;
  isCompleted?: boolean;
}

export interface RoutePlanComparison {
  id: string;
  name: string;
  type: 'fastest_direct' | 'disaster_aware_safest';
  distanceKm: number;
  estTimeMin: number;
  riskScorePercent: number;
  hazardStatus: 'VIABLE' | 'CAUTION' | 'IMPASSABLE';
  description: string;
  elevationClearanceM: number;
  coordinates: [number, number][];
}
