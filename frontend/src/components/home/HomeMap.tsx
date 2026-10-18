import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Route } from 'lucide-react';
import { BASEMAP_ATTRIBUTION, BASEMAP_MAX_ZOOM, BASEMAP_URL } from '../../config/mapConfig';
import { useApp } from '../../contexts/AppContext';
import { useVisionHazards } from '../../hooks/vision/useVisionHazards';
import { formatKm, formatMin } from '../../lib/format';
import { nearestOpenShelter } from '../../lib/home';
import { DEMO_ORIGIN } from '../../lib/mappers';
import { detourAroundHazards, hazardsKey } from '../../lib/vision/hazards';
import { VisionHazardLayer } from '../map/VisionHazardLayer';
import { Skeleton } from '../live/shared/Skeleton';
import { card, cardTitle, interactive } from '../../styles/tokens';

const userDot = new L.DivIcon({
  className: 'user-mini-icon',
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#1677FF;border:3px solid #fff;box-shadow:0 0 0 4px rgba(22,119,255,.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
const shelterPin = new L.DivIcon({
  className: 'shelter-mini-icon',
  html: '<div style="background:#047857;color:#fff;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

/** Leaflet measures its container once; this re-measures whenever the container's size changes. */
function ResizeFix() {
  const map = useMap();
  React.useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => { ro.disconnect(); clearTimeout(t); };
  }, [map]);
  return null;
}

/** Overview map: you, the nearest open refuge, an approximate route, and sample-camera flood zones. */
export function HomeMap() {
  const navigate = useNavigate();
  const { shelters, sheltersReady } = useApp();
  const hazards = useVisionHazards();
  const key = hazardsKey(hazards);
  const shelter = nearestOpenShelter(shelters);

  const route = useMemo(() => {
    if (!shelter) return null;
    const base: [number, number][] = [[DEMO_ORIGIN.lat, DEMO_ORIGIN.lon], [shelter.lat, shelter.lon]];
    return detourAroundHazards(base, hazards);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelter?.id, key]);

  if (!sheltersReady) return <Skeleton className="h-80 w-full" />;

  const points: [number, number][] = [[DEMO_ORIGIN.lat, DEMO_ORIGIN.lon], ...(shelter ? ([[shelter.lat, shelter.lon]] as [number, number][]) : []), ...hazards.map((h) => [h.lat, h.lon] as [number, number])];
  const bounds = L.latLngBounds(points).pad(0.3);

  return (
    <section className={`${card} flex h-full min-h-[360px] flex-col overflow-hidden`} aria-labelledby="homemap-title">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 md:px-5">
        <div className="min-w-0">
          <h2 id="homemap-title" className={cardTitle}>Map overview</h2>
          <p className="truncate text-xs/4 text-slate-700">Approximate route and sample-camera flood zones</p>
        </div>
        <button type="button" onClick={() => navigate('/map')} className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-200 ${interactive}`}>
          <span>Full map</span> <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="relative min-h-[280px] flex-1">
        <MapContainer bounds={bounds} zoomControl={false} scrollWheelZoom={false} attributionControl className="z-0 h-full w-full">
          <TileLayer attribution={BASEMAP_ATTRIBUTION} url={BASEMAP_URL} maxZoom={BASEMAP_MAX_ZOOM} />
          <ResizeFix />
          <VisionHazardLayer />
          {route && (
            <>
              <Polyline positions={route.route} pathOptions={{ color: '#FFFFFF', weight: 9, opacity: 0.85 }} />
              <Polyline positions={route.route} pathOptions={{ color: '#0284C7', weight: 5, opacity: 0.95, dashArray: '8 8' }} />
            </>
          )}
          <Marker position={[DEMO_ORIGIN.lat, DEMO_ORIGIN.lon]} icon={userDot} />
          {shelter && <Marker position={[shelter.lat, shelter.lon]} icon={shelterPin} />}
        </MapContainer>
        {shelter && (
          <div className="absolute inset-x-3 bottom-8 z-10 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs/4 text-white backdrop-blur-md">
            <span className="inline-flex items-center gap-1.5 font-semibold"><Route className="h-3.5 w-3.5" aria-hidden="true" /> Approximate route to {shelter.name}</span>
            <span className="tabular-nums text-slate-200">{formatKm(shelter.distanceKm)} · ~{formatMin(shelter.travelTimeMin)} (estimate)</span>
          </div>
        )}
      </div>
    </section>
  );
}
