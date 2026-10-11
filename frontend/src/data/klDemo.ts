/**
 * Kuala Lumpur demo geography for the map. ILLUSTRATIVE: place names are real, but the flood-prone circles are
 * hand-placed around well-known low-lying spots and rivers. They are not DBKL/JPS flood maps and not surveyed.
 */
export interface DemoOrigin {
  id: string;
  label: string;
  /** Matches AppContext.selectedLocation so the header picker and the map agree. */
  location: string;
  lat: number;
  lon: number;
}

export const ORIGINS: DemoOrigin[] = [
  { id: 'kampung-baru', label: 'Kampung Baru', location: 'Kampung Baru, Kuala Lumpur', lat: 3.1642, lon: 101.7031 },
  { id: 'masjid-jamek', label: 'Masjid Jamek', location: 'Masjid Jamek, Kuala Lumpur', lat: 3.149, lon: 101.696 },
  { id: 'chow-kit', label: 'Chow Kit', location: 'Chow Kit, Kuala Lumpur', lat: 3.1675, lon: 101.6985 },
  { id: 'sentul', label: 'Sentul', location: 'Sentul, Kuala Lumpur', lat: 3.184, lon: 101.693 },
  { id: 'bangsar', label: 'Bangsar', location: 'Bangsar, Kuala Lumpur', lat: 3.129, lon: 101.679 },
  { id: 'segambut', label: 'Segambut', location: 'Segambut, Kuala Lumpur', lat: 3.193, lon: 101.671 },
  { id: 'pantai-dalam', label: 'Pantai Dalam', location: 'Pantai Dalam, Kuala Lumpur', lat: 3.11, lon: 101.665 },
];

export const DEFAULT_ORIGIN_ID = 'kampung-baru';

export function originForLocation(location: string): DemoOrigin {
  return ORIGINS.find((o) => o.location === location) ?? ORIGINS.find((o) => o.id === DEFAULT_ORIGIN_ID)!;
}

export interface FloodProneArea {
  id: string;
  name: string;
  lat: number;
  lon: number;
  /** Radius when the scenario is WARNING; DANGER scales it up. */
  radiusM: number;
  /** Lowest scenario level at which the area floods. */
  onset: 'warning' | 'danger';
  note: string;
}

export const FLOOD_PRONE: FloodProneArea[] = [
  { id: 'jln-tar', name: 'Jalan Tuanku Abdul Rahman', lat: 3.1655, lon: 101.6985, radiusM: 230, onset: 'warning', note: 'Near the Klang river bank' },
  { id: 'masjid-india', name: 'Masjid India', lat: 3.1595, lon: 101.6958, radiusM: 220, onset: 'warning', note: 'Between Klang and Gombak rivers' },
  { id: 'confluence', name: 'Klang / Gombak confluence', lat: 3.1488, lon: 101.6958, radiusM: 260, onset: 'warning', note: 'Where the two rivers meet' },
  { id: 'jln-ampang', name: 'Jalan Ampang (Ampang river)', lat: 3.1578, lon: 101.7125, radiusM: 240, onset: 'warning', note: 'Low junction by the Ampang river' },
  { id: 'kg-baru-edge', name: 'Kampung Baru (Sungai Bunus)', lat: 3.1675, lon: 101.7062, radiusM: 210, onset: 'danger', note: 'Sungai Bunus corridor' },
  { id: 'jln-pahang', name: 'Jalan Pahang', lat: 3.1722, lon: 101.7058, radiusM: 200, onset: 'danger', note: 'Low stretch east of Titiwangsa' },
  { id: 'titiwangsa', name: 'Titiwangsa lake edge', lat: 3.1755, lon: 101.7035, radiusM: 230, onset: 'danger', note: 'Lakeside lowland' },
  { id: 'sentul-rail', name: 'Sentul (Sungai Batu)', lat: 3.1866, lon: 101.6905, radiusM: 240, onset: 'warning', note: 'Sungai Batu bank' },
  { id: 'jln-ipoh', name: 'Jalan Ipoh (Sungai Batu)', lat: 3.1762, lon: 101.6838, radiusM: 220, onset: 'warning', note: 'Where the road crosses the river' },
  { id: 'segambut', name: 'Segambut (Sungai Kerayong)', lat: 3.1925, lon: 101.6685, radiusM: 240, onset: 'danger', note: 'Floodplain by Jalan Kuching' },
  { id: 'jln-kuching', name: 'Jalan Kuching underpass', lat: 3.1832, lon: 101.6798, radiusM: 180, onset: 'danger', note: 'Low underpass' },
  { id: 'brickfields', name: 'Brickfields', lat: 3.1285, lon: 101.6865, radiusM: 210, onset: 'danger', note: 'Low junction near the KL Sentral rail corridor' },
  { id: 'bangsar-river', name: 'Bangsar (Sungai Klang)', lat: 3.1262, lon: 101.6745, radiusM: 230, onset: 'warning', note: 'Klang river bank' },
  { id: 'pantai-dalam', name: 'Pantai Dalam', lat: 3.1112, lon: 101.6645, radiusM: 250, onset: 'warning', note: 'Sungai Klang lowland' },
  { id: 'kerinchi', name: 'Kerinchi', lat: 3.1135, lon: 101.6685, radiusM: 200, onset: 'danger', note: 'Lowland beside the river' },
  { id: 'cheras-batu3', name: 'Cheras (Sungai Besi)', lat: 3.1085, lon: 101.7215, radiusM: 220, onset: 'danger', note: 'Sungai Besi bank' },
];

export const DANGER_RADIUS_SCALE = 1.35;
