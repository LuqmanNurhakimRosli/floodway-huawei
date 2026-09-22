import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Maximize2, Shield } from 'lucide-react';

const userDotIcon = new L.DivIcon({
  className: 'user-mini-icon',
  html: `
    <div style="position: relative; width: 20px; height: 20px;">
      <div style="position: absolute; inset: -4px; background: rgba(22, 119, 255, 0.4); border-radius: 50%; animation: pulse-ring 2s infinite;"></div>
      <div style="position: absolute; inset: 2px; background: #1677FF; border: 2px solid white; border-radius: 50%;"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const shelterPinIcon = new L.DivIcon({
  className: 'shelter-mini-icon',
  html: `
    <div style="background: #10B981; color: white; width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const MINI_ROUTE: [number, number][] = [
  [3.1610, 101.7010],
  [3.1420, 101.6860],
  [3.1020, 101.6350],
  [3.0450, 101.5280],
];

const MINI_HAZARD: [number, number][] = [
  [3.1660, 101.7000],
  [3.1645, 101.7070],
  [3.1590, 101.7050],
  [3.1605, 101.6980],
];

export function FloodRiskMiniMap() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-full min-h-[380px]">
      {/* Mini-map Header */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-[#1677FF]">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-none">Geospatial Flood Risk Radar</h3>
            <span className="text-[11px] text-slate-400 font-medium">OpenStreetMap live evacuation corridor</span>
          </div>
        </div>

        <button
          onClick={() => navigate('/map')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
        >
          <span>Full Map</span>
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Embedded Real Leaflet Tile View */}
      <div className="relative flex-1 w-full min-h-[300px]">
        <MapContainer
          center={[3.1050, 101.6150]}
          zoom={11}
          zoomControl={false}
          attributionControl={false}
          dragging={true}
          className="w-full h-full z-0"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains={['a', 'b', 'c', 'd']}
          />

          <Polygon
            positions={MINI_HAZARD}
            pathOptions={{ color: '#DC2626', fillColor: '#EF4444', fillOpacity: 0.35, weight: 1.5 }}
          />

          <Polyline
            positions={MINI_ROUTE}
            pathOptions={{ color: '#10B981', weight: 4, opacity: 0.9, dashArray: '6, 6' }}
          />

          <Marker position={[3.1610, 101.7010]} icon={userDotIcon} />
          <Marker position={[3.0450, 101.5280]} icon={shelterPinIcon} />
        </MapContainer>

        {/* Floating status pill */}
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md rounded-xl p-2.5 text-white flex items-center justify-between text-xs border border-slate-700/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-slate-200">Corridor Clear to SK Seksyen 24</span>
          </div>
          <span className="text-[11px] font-bold text-blue-400">12.4 km · ~14 min</span>
        </div>
      </div>
    </div>
  );
}
