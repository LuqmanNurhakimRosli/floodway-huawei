// One basemap for the whole app. No API key, and none may be added here: every VITE_ variable ships in the
// browser bundle.
//
// OpenStreetMap standard tiles are fine for a low-traffic demo. Their tile usage policy restricts heavy or
// bulk use, so check https://operations.osmfoundation.org/policies/tiles/ before any public launch.
// If OSM is blocked on the venue network, OpenFreeMap (also keyless) is the fallback; verify its terms first.
export const BASEMAP_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const BASEMAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const BASEMAP_MAX_ZOOM = 19;
/** Short name for UI copy, so a subtitle can never name a different provider than the tiles. */
export const BASEMAP_NAME = 'OpenStreetMap';
