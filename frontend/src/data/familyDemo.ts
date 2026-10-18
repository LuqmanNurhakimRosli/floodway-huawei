import type { Circle, FamilyMember, Place } from '../lib/family';
import type { LatLon } from '../lib/routing';

/**
 * Demo family circle for the map. SIMULATED: these people, their positions and batteries are made up for the demo, and
 * the app says so wherever they appear. Only "You" can be a real position, from your own phone, with your permission.
 * Positions are picked to show each case: Tok Wan sits inside a flood-prone area, Aisyah's school is near one, Farhan is
 * driving, Mum is at home.
 */

export const YOU_ID = 'you';

type Seed = Omit<FamilyMember, 'updatedAt' | 'since'> & { sinceMinAgo: number | null };

export const DEMO_MEMBERS: Seed[] = [
  { id: 'mum', name: 'Nurul Huda', relation: 'Mum', colors: ['#F472B6', '#DB2777'], lat: 3.1651, lon: 101.7019, source: 'demo', battery: 76, status: 'ok', sinceMinAgo: 16 * 60 + 15 },
  { id: 'farhan', name: 'Farhan Rosli', relation: 'Brother', colors: ['#34D399', '#059669'], lat: 3.129, lon: 101.679, source: 'demo', battery: 58, charging: true, status: 'ok', sinceMinAgo: null, speedKmh: 34 },
  { id: 'aisyah', name: 'Aisyah Rosli', relation: 'Sister', colors: ['#A78BFA', '#7C3AED'], lat: 3.1848, lon: 101.6935, source: 'demo', battery: 91, status: 'ok', sinceMinAgo: 3 * 60 + 40 },
  { id: 'tokwan', name: 'Tok Wan', relation: 'Grandma', colors: ['#FBBF24', '#D97706'], lat: 3.1114, lon: 101.6648, source: 'demo', battery: 18, status: 'ok', sinceMinAgo: 26 * 60 },
  { id: 'pakali', name: 'Pak Ali', relation: 'Neighbour', colors: ['#60A5FA', '#2563EB'], lat: 3.1636, lon: 101.7041, source: 'demo', battery: 64, status: 'ok', sinceMinAgo: 95 },
  { id: 'kaksiti', name: 'Kak Siti', relation: 'Neighbour', colors: ['#F87171', '#DC2626'], lat: 3.1659, lon: 101.6981, source: 'demo', battery: 43, status: 'ok', sinceMinAgo: 48 },
];

export const DEMO_CIRCLES: Circle[] = [
  { id: 'family', name: 'Family', memberIds: [YOU_ID, 'mum', 'farhan', 'aisyah', 'tokwan'] },
  { id: 'neighbours', name: 'Neighbours', memberIds: [YOU_ID, 'pakali', 'kaksiti'] },
];

export const DEMO_PLACES: Place[] = [
  { id: 'home', name: 'Home', kind: 'home', lat: 3.1647, lon: 101.7025, radiusM: 200, alerts: true },
  { id: 'school', name: "Aisyah's school", kind: 'school', lat: 3.1848, lon: 101.6935, radiusM: 150, alerts: true },
  { id: 'office', name: "Farhan's office", kind: 'work', lat: 3.1291, lon: 101.6789, radiusM: 150, alerts: false },
  { id: 'tokwan-house', name: "Tok Wan's house", kind: 'family', lat: 3.1114, lon: 101.6648, radiusM: 150, alerts: true },
];

/** Farhan drives this stored road route back and forth (Bangsar to a relief centre), one round trip every 8 minutes. */
export const DRIVER_ID = 'farhan';
export const DRIVER_ROUTE_KEY = 'bangsar|shelter-01';
export const DRIVER_PERIOD_S = 480;
export const DRIVER_FALLBACK: LatLon = [3.129, 101.679];
