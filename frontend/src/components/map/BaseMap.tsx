import { useEffect, useMemo, useRef, useState } from 'react';
import { Polyline, TileLayer, Tooltip, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { BASEMAPS, BASEMAP_FAIL_AFTER, BASEMAP_TIMEOUT_MS } from '../../config/mapConfig';
import { ORIGINS } from '../../data/klDemo';
import { toRoadRoute, type LatLon } from '../../lib/routing';

const STORE_KEY = 'floodway_basemap';
const OFFLINE = BASEMAPS.length;
const PROBE_MS = 60000;
const OFFLINE_BG = '#EEF1F5';

function remembered(): number {
  try {
    const v = Number(sessionStorage.getItem(STORE_KEY));
    return Number.isInteger(v) && v >= 0 && v <= OFFLINE ? v : 0;
  } catch {
    return 0;
  }
}
function remember(i: number) {
  try {
    sessionStorage.setItem(STORE_KEY, String(i));
  } catch {
    // storage blocked: the choice just is not kept for the next map
  }
}

/** A sample tile URL for a provider, used to probe whether its host answers again. */
function probeUrl(i: number): string {
  const p = BASEMAPS[i];
  return p.url.replace('{s}', p.subdomains[0]).replace('{z}', '12').replace('{x}', '3243').replace('{y}', '2020').replace('{r}', '');
}

type RoutesDb = Record<string, Parameters<typeof toRoadRoute>[0][]>;

/** Labels are drawn only from this zoom in, so a city-wide view stays readable. */
export const LABEL_MIN_ZOOM = 13;

/** The map's current zoom, kept in state. */
export function useZoom(): number {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  return zoom;
}

/** The stored road routes, deduplicated: the offline map's street network. */
function useOfflineRoads(enabled: boolean): LatLon[][] {
  const [lines, setLines] = useState<LatLon[][]>([]);
  useEffect(() => {
    if (!enabled || lines.length) return;
    let live = true;
    import('../../data/klRoutes.json').then((m) => {
      if (!live) return;
      const db = (m.default as unknown as { routes: RoutesDb }).routes;
      const seen = new Set<string>();
      const out: LatLon[][] = [];
      for (const raws of Object.values(db)) {
        for (const raw of raws) {
          const line = toRoadRoute(raw).line;
          const key = line.filter((_, i) => i % 8 === 0).map(([a, b]) => `${a.toFixed(4)},${b.toFixed(4)}`).join('|');
          if (seen.has(key)) continue;
          seen.add(key);
          out.push(line);
        }
      }
      setLines(out);
    });
    return () => {
      live = false;
    };
  }, [enabled, lines.length]);
  return lines;
}

/**
 * The background map. Tries each provider in config/mapConfig.ts in turn and falls back to an offline street map drawn
 * from the stored road routes when no tile host answers. While offline it checks the first provider again every
 * minute and switches back when it answers. The attribution line always says which map is showing.
 */
export function BaseMap() {
  const map = useMap();
  const [idx, setIdx] = useState(remembered);
  const loaded = useRef(false);
  const errors = useRef(0);
  const provider = BASEMAPS[idx];
  const offline = idx === OFFLINE;
  const roads = useOfflineRoads(offline);
  const zoom = useZoom();

  const next = () =>
    setIdx((i) => {
      const n = Math.min(OFFLINE, i + 1);
      remember(n);
      return n;
    });

  // per provider: a timeout for hosts that drop requests without an error
  useEffect(() => {
    loaded.current = false;
    errors.current = 0;
    if (offline) return;
    const t = setTimeout(() => !loaded.current && next(), BASEMAP_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [idx, offline]);

  // offline: paint a street-map ground, and probe the first provider every minute
  useEffect(() => {
    const el = map.getContainer();
    el.style.background = offline ? OFFLINE_BG : '';
    map.attributionControl?.setPrefix(offline ? 'Offline map: saved roads only' : '<a href="https://leafletjs.com">Leaflet</a>');
    if (!offline) return;
    const probe = setInterval(() => {
      const img = new Image();
      img.onload = () => {
        remember(0);
        setIdx(0);
      };
      img.src = `${probeUrl(0)}?probe=${Date.now()}`;
    }, PROBE_MS);
    return () => clearInterval(probe);
  }, [offline, map]);

  const handlers = useMemo(
    () => ({
      tileload: () => {
        loaded.current = true;
      },
      tileerror: () => {
        errors.current += 1;
        if (!loaded.current && errors.current >= BASEMAP_FAIL_AFTER) next();
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idx],
  );

  if (!offline) {
    return (
      <TileLayer
        key={provider.id}
        url={provider.url}
        subdomains={provider.subdomains}
        attribution={provider.attribution}
        maxZoom={provider.maxZoom}
        eventHandlers={handlers}
      />
    );
  }

  return (
    <>
      {roads.map((line, i) => (
        <Polyline key={`c${i}`} positions={line} interactive={false} pathOptions={{ color: '#CDD5E0', weight: 8, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
      ))}
      {roads.map((line, i) => (
        <Polyline key={`r${i}`} positions={line} interactive={false} pathOptions={{ color: '#FFFFFF', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
      ))}
      {zoom >= LABEL_MIN_ZOOM && ORIGINS.map((o) => (
        <CircleMarker key={o.id} center={[o.lat, o.lon]} radius={0} interactive={false} pathOptions={{ opacity: 0, fillOpacity: 0 }}>
          <Tooltip permanent direction="top" offset={[0, -6]} className="fw-place-label">
            {o.label}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
