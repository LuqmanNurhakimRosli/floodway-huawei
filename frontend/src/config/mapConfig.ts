// Basemaps for the whole app, tried in order. None needs an API key, and none may be added here: every VITE_ variable
// ships in the browser bundle.
//
// components/map/BaseMap.tsx starts with the first provider and moves to the next when its tiles keep failing (a
// blocked host, a venue firewall, a tile policy refusal). When every provider fails it draws the stored road network
// offline, so the map is never a blank grey box.
//
// Terms to check before a public launch: CARTO basemaps (https://carto.com/basemaps, attribution required, usage
// limits apply) and the OpenStreetMap tile policy (https://operations.osmfoundation.org/policies/tiles/).

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
    id: 'carto-voyager',
    name: 'CARTO Voyager',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    subdomains: 'abcd',
    attribution: `${OSM_CREDIT} &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    maxZoom: 20,
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    subdomains: 'a', // unused by this URL, but Leaflet needs a non-empty list
    attribution: OSM_CREDIT,
    maxZoom: 19,
  },
];

/** Tile errors, with no tile loaded yet, before BaseMap gives up on a provider. */
export const BASEMAP_FAIL_AFTER = 6;
/** A provider that has loaded nothing after this long is treated as failed too (a silently dropped request). */
export const BASEMAP_TIMEOUT_MS = 8000;
