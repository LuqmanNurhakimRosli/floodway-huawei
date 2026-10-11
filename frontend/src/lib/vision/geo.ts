export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface Place {
  id: string;
  label: string;
  lat: number;
  lon: number;
}

export const KLCC: Place = { id: 'klcc', label: 'KLCC, Kuala Lumpur', lat: 3.1579, lon: 101.7116 };

/** Origins the user can switch between. A "Your location" entry is added at runtime when GPS is allowed. */
export const PLACES: Place[] = [
  KLCC,
  { id: 'jamek', label: 'Masjid Jamek, Kuala Lumpur', lat: 3.149, lon: 101.696 },
  { id: 'kampung-baru', label: 'Kampung Baru, Kuala Lumpur', lat: 3.1642, lon: 101.7031 },
  { id: 'sentul', label: 'Sentul, Kuala Lumpur', lat: 3.184, lon: 101.693 },
];

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export const formatCoords = (lat: number, lon: number): string =>
  `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;
