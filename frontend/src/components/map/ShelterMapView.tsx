import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, Navigation, Users, CheckCircle2, AlertTriangle, Phone, Car, Bike, Footprints } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { InPageActionDock } from './InPageActionDock';

// Custom Animated Leaflet DivIcons
const userIcon = new L.DivIcon({
  className: 'user-icon',
  html: `
    <div class="user-marker-container">
      <div class="user-marker-pulse"></div>
      <div class="user-marker-dot"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const createShelterIcon = (isSelected: boolean, status: string) => new L.DivIcon({
  className: 'shelter-icon',
  html: `
    <div class="shelter-marker ${isSelected ? 'selected' : ''}">
      <div style="width: ${isSelected ? '36px' : '30px'}; height: ${isSelected ? '36px' : '30px'}; background: ${
        isSelected ? '#1677FF' : status === 'OPEN' ? '#10B981' : '#64748B'
      }; color: white; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 2px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.3);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      ${isSelected ? '<div class="shelter-marker-ring"></div>' : ''}
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const roadblockIcon = new L.DivIcon({
  className: 'roadblock-icon',
  html: `
    <div style="background: #DC2626; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(220,38,38,0.5);">
      <span style="font-size: 14px; font-weight: bold; line-height: 1;">✕</span>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const sensorIcon = new L.DivIcon({
  className: 'sensor-icon',
  html: `
    <div style="background: #071426; color: #60A5FA; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #1677FF; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
      <span style="font-size: 11px; font-weight: bold;">1.2m</span>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Safe Evacuation Route Coordinates (Kampung Baru -> Federal Highway -> Shah Alam Seksyen 24)
const SAFE_CORRIDOR_ROUTE: [number, number][] = [
  [3.1610, 101.7010],
  [3.1550, 101.6970],
  [3.1420, 101.6860],
  [3.1250, 101.6680],
  [3.1020, 101.6350],
  [3.0780, 101.5950],
  [3.0550, 101.5520],
  [3.0450, 101.5280],
];

// Flood Inundation Hazard Polygon
const HAZARD_POLYGON: [number, number][] = [
  [3.1660, 101.7000],
  [3.1645, 101.7070],
  [3.1590, 101.7050],
  [3.1605, 101.6980],
];

export function ShelterMapView() {
  const navigate = useNavigate();
  const { shelters } = useApp();
  const [selectedShelterId, setSelectedShelterId] = useState<string>(shelters[0]?.id || 'shelter-01');
  const [filter, setFilter] = useState<'all' | 'open' | 'recommended'>('all');
  const [transportMode, setTransportMode] = useState<'car' | 'bike' | 'walk'>('car');

  const selectedShelter = shelters.find((s) => s.id === selectedShelterId) || shelters[0];

  const filteredShelters = shelters.filter((s) => {
    if (filter === 'open') return s.status === 'OPEN';
    if (filter === 'recommended') return s.routeStatus === 'CLEAR';
    return true;
  });

  const getTransportDetails = () => {
    if (transportMode === 'bike') return { time: '10 min', speed: '45 km/h' };
    if (transportMode === 'walk') return { time: '48 min', speed: '4.5 km/h' };
    return { time: '14 min', speed: '35 km/h' };
  };

  const transport = getTransportDetails();

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden bg-slate-100">
      {/* Floating In-Page Action Switcher Dock */}
      <InPageActionDock />

      {/* Real OpenStreetMap / CartoDB Leaflet Canvas */}
      <div className="relative flex-1 h-full min-h-[350px]">
        <MapContainer
          center={[3.1250, 101.6400]}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          {/* CartoDB Voyager Raster Tile Layer (Clean & High-Contrast) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains={['a', 'b', 'c', 'd']}
            maxZoom={19}
          />

          {/* Hazard Flood Polygon */}
          <Polygon
            positions={HAZARD_POLYGON}
            pathOptions={{
              color: '#DC2626',
              fillColor: '#EF4444',
              fillOpacity: 0.35,
              weight: 2,
              dashArray: '4, 4'
            }}
          >
            <Popup>
              <div className="text-xs p-1">
                <b className="text-red-600 block">Hazard Inundation Zone</b>
                <span>Water depth exceeding 40cm. Avoid Jalan Raja Muda.</span>
              </div>
            </Popup>
          </Polygon>

          {/* Safe Route Polyline */}
          <Polyline
            positions={SAFE_CORRIDOR_ROUTE}
            pathOptions={{
              color: '#10B981',
              weight: 5,
              opacity: 0.9,
              dashArray: '8, 8'
            }}
          />

          {/* User Live Marker */}
          <Marker position={[3.1610, 101.7010]} icon={userIcon}>
            <Popup>
              <div className="text-xs p-1 font-semibold">
                <span>📍 Your Residence (Kampung Baru)</span>
              </div>
            </Popup>
          </Marker>

          {/* Roadblock Marker */}
          <Marker position={[3.1635, 101.7040]} icon={roadblockIcon}>
            <Popup>
              <div className="text-xs p-1">
                <b className="text-red-600 block">Jalan Raja Muda Musa Closed</b>
                <span>Severe waterlogging (50cm depth). Divert south.</span>
              </div>
            </Popup>
          </Marker>

          {/* River Sensor Marker */}
          <Marker position={[3.1630, 101.7020]} icon={sensorIcon}>
            <Popup>
              <div className="text-xs p-1">
                <b className="block">Station #FW-KL-04</b>
                <span>River Level: 1.20m (Warning Stage)</span>
              </div>
            </Popup>
          </Marker>

          {/* Shelter Markers */}
          {shelters.map((s) => (
            <Marker
              key={s.id}
              position={[s.lat, s.lon]}
              icon={createShelterIcon(s.id === selectedShelter?.id, s.status)}
              eventHandlers={{
                click: () => setSelectedShelterId(s.id)
              }}
            >
              <Popup>
                <div className="text-xs p-1">
                  <b className="block text-slate-900">{s.name}</b>
                  <span className="text-emerald-700 font-bold block">{s.status} ({s.currentCapacity}/{s.maxCapacity})</span>
                  <span className="text-slate-500">{s.address}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Map Legend */}
        <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white text-xs font-semibold shadow-xl">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Safe Corridor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Hazard Inundation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1677FF]" />
            <span>Live GPS</span>
          </div>
        </div>
      </div>

      {/* Shelter Selection Drawer (Right panel on Desktop, Bottom sheet on Mobile) */}
      <div className="w-full md:w-[380px] lg:w-[420px] bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col z-20 shadow-2xl overflow-hidden shrink-0">
        {/* Header & Transport Mode */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-extrabold text-base md:text-lg text-slate-900">
              Evacuation Relief Centers
            </h2>
            <span className="text-xs font-bold text-slate-500">
              {filteredShelters.length} Available
            </span>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl mb-3">
            {(['all', 'open', 'recommended'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`flex-1 py-1 text-xs font-bold rounded-lg capitalize transition-colors ${
                  filter === mode
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Transport Mode Switcher */}
          <div className="flex items-center justify-between bg-white p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setTransportMode('car')}
              className={`flex-1 py-1 px-2 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-colors ${
                transportMode === 'car' ? 'bg-[#1677FF] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Drive</span>
            </button>
            <button
              onClick={() => setTransportMode('bike')}
              className={`flex-1 py-1 px-2 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-colors ${
                transportMode === 'bike' ? 'bg-[#1677FF] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Motorcycle</span>
            </button>
            <button
              onClick={() => setTransportMode('walk')}
              className={`flex-1 py-1 px-2 rounded-lg flex items-center justify-center gap-1.5 font-bold transition-colors ${
                transportMode === 'walk' ? 'bg-[#1677FF] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Walk</span>
            </button>
          </div>
        </div>

        {/* Shelters List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredShelters.map((s) => {
            const isSelected = s.id === selectedShelter?.id;
            const capPct = Math.round((s.currentCapacity / s.maxCapacity) * 100);

            return (
              <div
                key={s.id}
                onClick={() => setSelectedShelterId(s.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#1677FF] bg-blue-50/40 shadow-sm ring-1 ring-[#1677FF]/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.category}</span>
                    <h3 className="font-heading font-bold text-sm text-slate-900">{s.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    {s.status}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 my-2 text-xs text-slate-600">
                  <span className="font-bold text-slate-800">{s.distanceKm} km</span>
                  <span>·</span>
                  <span className="font-semibold text-[#1677FF]">~{transport.time} ({transportMode})</span>
                  <span>·</span>
                  <span className="text-emerald-600 font-semibold">{s.routeStatus}</span>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Capacity ({capPct}%)</span>
                    <span className="font-bold text-slate-700">{s.currentCapacity} / {s.maxCapacity}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        capPct > 85 ? 'bg-red-500' : capPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${capPct}%` }}
                    />
                  </div>
                </div>

                {/* Selected Action Button */}
                {isSelected && (
                  <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/navigation/${s.id}`);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#1677FF] hover:bg-[#0958D9] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Start Turn-by-Turn</span>
                    </button>
                    <a
                      href={`tel:${s.contact}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                      title="Call Shelter Warden"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
