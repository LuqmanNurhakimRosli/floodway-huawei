// Basemaps for the whole app, tried in order. None needs an API key, and none may be added here: every VITE_ variable
// ships in the browser bundle.
//
// components/map/BaseMap.tsx starts with the first provider and moves to the next when its tiles keep failing (a
// blocked host, a venue firewall, a tile policy refusal). When every provider fails it draws the stored road network
// offline, so the map is never a blank grey box.
//
// CARTO is not used: since 2026 its basemaps answer a keyless request with an "API KEY REQUIRED" image (HTTP 200), which
// the failover cannot tell from a real tile. Terms to check before a public launch: the OpenStreetMap tile policy
// (https://operations.osmfoundation.org/policies/tiles/) and OSM France (https://www.openstreetmap.fr/fonds-de-carte/).

export interface BasemapProvider {
  id: string;
  /** Short name for UI copy. */
  name: string;
  url: string;
  /** Letters for {s} in the URL. Never empty: Leaflet reads it for every tile. */
  subdomains: string;
  attribution: string;
  maxZoom: number;
}

const OSM_CREDIT = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const BASEMAPS: BasemapProvider[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'a', // unused by this URL, but Leaflet needs a non-empty list
    attribution: OSM_CREDIT,
    maxZoom: 19,
  },
  {
    id: 'osm-hot',
    name: 'OpenStreetMap HOT',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: 'abc',
    attribution: `${OSM_CREDIT}, tiles by <a href="https://www.hotosm.org/">HOT</a> hosted by <a href="https://openstreetmap.fr/">OSM France</a>`,
    maxZoom: 19,
  },
];

/** Tile errors, with no tile loaded yet, before BaseMap gives up on a provider. */
export const BASEMAP_FAIL_AFTER = 6;
/** A provider that has loaded nothing after this long is treated as failed too (a silently dropped request). */
export const BASEMAP_TIMEOUT_MS = 8000;
