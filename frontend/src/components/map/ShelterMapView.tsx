import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Shield,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Car,
  Bike,
  Footprints,
  Waves,
  Radio,
  Cpu,
  RotateCcw,
  Check,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { InPageActionDock } from './InPageActionDock';
import { Shelter } from '../../types';

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

const gpsNavIcon = new L.DivIcon({
  className: 'gps-nav-icon',
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; inset: -4px; border-radius: 50%; background: #1677FF; opacity: 0.4; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 28px; height: 28px; border-radius: 50%; background: #1677FF; border: 3px solid white; box-shadow: 0 4px 14px rgba(22,119,255,0.7); display: flex; align-items: center; justify-content: center; color: white;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
        </svg>
      </div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const createShelterIcon = (isSelected: boolean, status: string) => {
  const isFull = status === 'FULL';
  const isClosed = status === 'CLOSED';

  let bgColor = '#10B981'; // Green for open
  let symbol = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  `;

  if (isClosed) {
    bgColor = '#EF4444'; // Red
    symbol = `<span style="font-size: 15px; font-weight: 900; line-height: 1;">✕</span>`;
  } else if (isFull) {
    bgColor = '#F59E0B'; // Amber
    symbol = `<span style="font-size: 16px; font-weight: 900; line-height: 1;">!</span>`;
  } else if (isSelected) {
    bgColor = '#1677FF'; // Blue
  }

  return new L.DivIcon({
    className: 'shelter-icon',
    html: `
      <div class="shelter-marker ${isSelected ? 'selected' : ''}">
        <div style="width: ${isSelected ? '38px' : '32px'}; height: ${isSelected ? '38px' : '32px'}; background: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; border-radius: 12px; border: 2px solid white; box-shadow: 0 4px 14px rgba(0,0,0,0.35);">
          ${symbol}
        </div>
        ${isSelected ? '<div class="shelter-marker-ring"></div>' : ''}
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};

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
    <div style="background: #071426; color: #60A5FA; width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #1677FF; box-shadow: 0 2px 8px rgba(0,0,0,0.4);">
      <span style="font-size: 11px; font-weight: 800;">1.2m</span>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Safe Evacuation Route Coordinates (Kampung Baru -> Federal Highway -> Shah Alam Seksyen 24)
const SAFE_CORRIDOR_ROUTE: [number, number][] = [
  [3.1610, 101.7010], // Kampung Baru
  [3.1550, 101.6970],
  [3.1420, 101.6860],
  [3.1250, 101.6680],
  [3.1020, 101.6350],
  [3.0780, 101.5950],
  [3.0550, 101.5520],
  [3.0450, 101.5280], // SK Seksyen 24 Shah Alam
];

// 3 Flood Simulation Polygon States (Normal, Warning, Danger)
interface FloodZoneConfig {
  label: string;
  badge: string;
  depthM: string;
  color: string;
  fillColor: string;
  fillOpacity: number;
  description: string;
  polygon: [number, number][];
  sriMudaPolygon: [number, number][];
}

const FLOOD_ZONES: Record<'normal' | 'warning' | 'danger', FloodZoneConfig> = {
  normal: {
    label: 'Normal (Safe)',
    badge: 'Baseline Flow',
    depthM: '0.45 m',
    color: '#0284C7',
    fillColor: '#38BDF8',
    fillOpacity: 0.22,
    description: 'Klang River channel within normal bounds. All primary roads fully passable.',
    polygon: [
      [3.1670, 101.7000],
      [3.1640, 101.7040],
      [3.1600, 101.7030],
      [3.1610, 101.6970],
    ],
    sriMudaPolygon: [
      [3.0420, 101.5300],
      [3.0400, 101.5370],
      [3.0340, 101.5350],
      [3.0360, 101.5280],
    ],
  },
  warning: {
    label: 'Warning (Yellow)',
    badge: '+0.8m Spillover',
    depthM: '1.20 m',
    color: '#D97706',
    fillColor: '#F59E0B',
    fillOpacity: 0.40,
    description: 'River discharge surging. Low-lying drainage backup in Jalan Raja Muda Musa & Seksyen 25.',
    polygon: [
      [3.1700, 101.6980],
      [3.1660, 101.7080],
      [3.1570, 101.7060],
      [3.1590, 101.6950],
    ],
    sriMudaPolygon: [
      [3.0450, 101.5270],
      [3.0430, 101.5410],
      [3.0310, 101.5390],
      [3.0330, 101.5250],
    ],
  },
  danger: {
    label: 'Danger (Red)',
    badge: 'Severe Breach',
    depthM: '1.85 m',
    color: '#DC2626',
    fillColor: '#EF4444',
    fillOpacity: 0.58,
    description: 'Active flash inundation breach. Secondary routes submerged. Immediate evacuation required.',
    polygon: [
      [3.1740, 101.6950],
      [3.1690, 101.7120],
      [3.1540, 101.7100],
      [3.1560, 101.6910],
    ],
    sriMudaPolygon: [
      [3.0480, 101.5240],
      [3.0460, 101.5450],
      [3.0280, 101.5420],
      [3.0300, 101.5210],
    ],
  },
};

// Map Camera Controller for GPS Follower
function NavigationMapController({
  isNavigating,
  gpsPos,
}: {
  isNavigating: boolean;
  gpsPos: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (isNavigating && gpsPos) {
      map.panTo(gpsPos, {
        animate: true,
        duration: 0.25,
        easeLinearity: 0.5,
      });
    }
  }, [gpsPos, isNavigating, map]);

  return null;
}

export function ShelterMapView() {
  const navigate = useNavigate();
  const { shelters, activeSos, setFamilySafetyStatus } = useApp();

  const [selectedShelterId, setSelectedShelterId] = useState<string>('shelter-01');
  const [filter, setFilter] = useState<'all' | 'open' | 'recommended'>('all');
  const [transportMode, setTransportMode] = useState<'car' | 'bike' | 'walk'>('car');

  // Interactive Flood Prone Simulator state
  const [floodSeverity, setFloodSeverity] = useState<'normal' | 'warning' | 'danger'>('warning');

  // GPS Navigator 6-Second Simulation State
  const [isNavigating, setIsNavigating] = useState(false);
  const [navProgress, setNavProgress] = useState(0); // 0 to 1
  const [navElapsedSec, setNavElapsedSec] = useState(0);
  const [hasArrived, setHasArrived] = useState(false);

  // Selected shelter object
  const selectedShelter = shelters.find((s) => s.id === selectedShelterId) || shelters[0];

  const filteredShelters = useMemo(() => {
    return shelters.filter((s) => {
      if (filter === 'open') return s.status === 'OPEN';
      if (filter === 'recommended') return s.routeStatus === 'CLEAR' && s.status === 'OPEN';
      return true;
    });
  }, [shelters, filter]);

  const getTransportDetails = () => {
    if (transportMode === 'bike') return { time: '10 min', speed: '45 km/h' };
    if (transportMode === 'walk') return { time: '48 min', speed: '4.5 km/h' };
    return { time: '14 min', speed: '35 km/h' };
  };

  const transport = getTransportDetails();

  // Interpolate GPS coordinates along the SAFE_CORRIDOR_ROUTE
  const currentGpsPosition = useMemo((): [number, number] => {
    if (!isNavigating || navProgress === 0) {
      return SAFE_CORRIDOR_ROUTE[0];
    }
    if (navProgress >= 1) {
      return SAFE_CORRIDOR_ROUTE[SAFE_CORRIDOR_ROUTE.length - 1];
    }

    const totalSegments = SAFE_CORRIDOR_ROUTE.length - 1;
    const globalProgress = navProgress * totalSegments;
    const segmentIndex = Math.min(Math.floor(globalProgress), totalSegments - 1);
    const segmentRatio = globalProgress - segmentIndex;

    const p1 = SAFE_CORRIDOR_ROUTE[segmentIndex];
    const p2 = SAFE_CORRIDOR_ROUTE[segmentIndex + 1];

    const lat = p1[0] + (p2[0] - p1[0]) * segmentRatio;
    const lon = p1[1] + (p2[1] - p1[1]) * segmentRatio;

    return [lat, lon];
  }, [isNavigating, navProgress]);

  // 6-Second Turn-by-Turn GPS Navigation Loop
  useEffect(() => {
    if (!isNavigating) return;

    const DURATION_MS = 6000;
    const startTime = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / DURATION_MS, 1);

      setNavProgress(progress);
      setNavElapsedSec(Number((progress * 6).toFixed(1)));

      if (progress >= 1) {
        clearInterval(interval);
        setHasArrived(true);
        setFamilySafetyStatus('ARRIVED_SAFE');
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isNavigating, setFamilySafetyStatus]);

  const handleStartNavigation = (shelter: Shelter) => {
    if (shelter.status === 'FULL' || shelter.status === 'CLOSED') {
      return; // Safeguard: full shelters cannot be navigated to
    }
    setNavProgress(0);
    setNavElapsedSec(0);
    setHasArrived(false);
    setIsNavigating(true);
  };

  const handleResetNavigation = () => {
    setIsNavigating(false);
    setNavProgress(0);
    setNavElapsedSec(0);
    setHasArrived(false);
  };

  const currentZone = FLOOD_ZONES[floodSeverity];

  return (
    <div className="relative w-full h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden bg-slate-100">
      {/* Floating In-Page Action Switcher Dock */}
      <InPageActionDock />

      {/* Real OpenStreetMap Leaflet Canvas (Clean HD Tiles - Zero Watermarks) */}
      <div className="relative flex-1 h-full min-h-[350px]">
        <MapContainer
          center={[3.1050, 101.6200]}
          zoom={12}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          {/* OpenStreetMap Standard Clean Raster Tiles (No Watermarks, High Quality) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Camera follower during GPS turn-by-turn simulation */}
          <NavigationMapController isNavigating={isNavigating} gpsPos={currentGpsPosition} />

          {/* Dynamic Interactive Flood Prone Simulator Polygons (Klang River & Sri Muda) */}
          <Polygon
            positions={currentZone.polygon}
            pathOptions={{
              color: currentZone.color,
              fillColor: currentZone.fillColor,
              fillOpacity: currentZone.fillOpacity,
              weight: 2.5,
              dashArray: floodSeverity === 'danger' ? '6, 6' : undefined,
            }}
          >
            <Popup>
              <div className="text-xs p-1">
                <b className="block" style={{ color: currentZone.color }}>
                  {currentZone.label} — {currentZone.badge}
                </b>
                <span className="font-semibold text-slate-700 block mt-0.5">
                  Est. Depth: {currentZone.depthM}
                </span>
                <span className="text-slate-600 block text-[11px] mt-1">{currentZone.description}</span>
                <span className="text-[10px] text-blue-600 font-bold block mt-1">
                  ModelArts Ascend 910 GRU Hydrological Model
                </span>
              </div>
            </Popup>
          </Polygon>

          <Polygon
            positions={currentZone.sriMudaPolygon}
            pathOptions={{
              color: currentZone.color,
              fillColor: currentZone.fillColor,
              fillOpacity: currentZone.fillOpacity,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-xs p-1">
                <b className="block" style={{ color: currentZone.color }}>
                  Taman Sri Muda Sector ({currentZone.label})
                </b>
                <span className="text-slate-600 block text-[11px] mt-1">
                  Drainage retention basin status: {currentZone.badge}
                </span>
              </div>
            </Popup>
          </Polygon>

          {/* Safe Corridor Route Polyline */}
          <Polyline
            positions={SAFE_CORRIDOR_ROUTE}
            pathOptions={{
              color: isNavigating ? '#1677FF' : '#10B981',
              weight: isNavigating ? 6 : 5,
              opacity: 0.9,
              dashArray: isNavigating ? undefined : '8, 8',
            }}
          />

          {/* User Starting Live Marker / GPS Navigation Marker */}
          {isNavigating ? (
            <Marker position={currentGpsPosition} icon={gpsNavIcon}>
              <Popup>
                <div className="text-xs p-1 font-semibold">
                  <span className="text-blue-600 font-bold block">🚗 Turn-by-Turn GPS Active</span>
                  <span>Progress: {Math.round(navProgress * 100)}% ({navElapsedSec}s / 6s)</span>
                </div>
              </Popup>
            </Marker>
          ) : (
            <Marker position={SAFE_CORRIDOR_ROUTE[0]} icon={userIcon}>
              <Popup>
                <div className="text-xs p-1 font-semibold">
                  <span>📍 Your Residence (Kampung Baru)</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Roadblock Marker */}
          <Marker position={[3.1635, 101.7040]} icon={roadblockIcon}>
            <Popup>
              <div className="text-xs p-1">
                <b className="text-red-600 block">Jalan Raja Muda Musa Closed</b>
                <span>Severe waterlogging ({currentZone.depthM} depth). Diverted south.</span>
              </div>
            </Popup>
          </Marker>

          {/* River Sensor Marker */}
          <Marker position={[3.1630, 101.7020]} icon={sensorIcon}>
            <Popup>
              <div className="text-xs p-1">
                <b className="block">Station #FW-KL-04</b>
                <span>River Level: {currentZone.depthM} ({floodSeverity.toUpperCase()})</span>
                <span className="text-[10px] text-slate-500 block">Ascend 910 GRU Real-time Ingestion</span>
              </div>
            </Popup>
          </Marker>

          {/* Evacuation Shelter Markers (Max 6 Shelters) */}
          {shelters.map((s) => (
            <Marker
              key={s.id}
              position={[s.lat, s.lon]}
              icon={createShelterIcon(s.id === selectedShelter?.id, s.status)}
              eventHandlers={{
                click: () => setSelectedShelterId(s.id),
              }}
            >
              <Popup>
                <div className="text-xs p-1">
                  <b className="block text-slate-900">{s.name}</b>
                  <div className="flex items-center gap-1.5 mt-0.5 mb-1">
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold ${
                        s.status === 'CLOSED'
                          ? 'bg-red-100 text-red-800'
                          : s.status === 'FULL'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {s.status}
                    </span>
                    <span className="text-slate-600 font-bold">
                      {s.currentCapacity} / {s.maxCapacity} ({Math.round((s.currentCapacity / s.maxCapacity) * 100)}%)
                    </span>
                  </div>
                  <span className="text-slate-500 block text-[11px]">{s.address}</span>
                  {s.status !== 'OPEN' && (
                    <span className="text-red-600 font-bold block mt-1 text-[11px]">
                      ⚠️ Capacity Limit Reached · Seek alternate shelter
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* TOP INTERACTIVE FLOOD PRONE SIMULATOR OVERLAY */}
        <div className="absolute top-4 left-4 z-10 max-w-sm w-full bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-slate-700/80 shadow-2xl text-white">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-extrabold tracking-wide uppercase font-heading">
                Flood Zone Simulator
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold">
              <Cpu className="w-3 h-3" />
              <span>Ascend 910 GRU</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-snug mb-2.5">
            Simulate dynamic flood hazard polygons calculated by the GRU time-series prediction pipeline:
          </p>

          {/* 3 Severity Switcher Buttons */}
          <div className="grid grid-cols-3 gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setFloodSeverity('normal')}
              className={`py-1.5 px-2 rounded-lg transition-all flex flex-col items-center gap-0.5 ${
                floodSeverity === 'normal'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Normal</span>
              <span className="text-[9px] opacity-80">Safe (0.45m)</span>
            </button>
            <button
              onClick={() => setFloodSeverity('warning')}
              className={`py-1.5 px-2 rounded-lg transition-all flex flex-col items-center gap-0.5 ${
                floodSeverity === 'warning'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Warning</span>
              <span className="text-[9px] opacity-80">+0.8m Rise</span>
            </button>
            <button
              onClick={() => setFloodSeverity('danger')}
              className={`py-1.5 px-2 rounded-lg transition-all flex flex-col items-center gap-0.5 ${
                floodSeverity === 'danger'
                  ? 'bg-red-600 text-white shadow-md font-extrabold animate-pulse'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Danger</span>
              <span className="text-[9px] opacity-80">Peak (1.85m)</span>
            </button>
          </div>
        </div>

        {/* GPS NAVIGATION TURN-BY-TURN HUD (Top-Center when active) */}
        {isNavigating && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-md bg-slate-950/95 backdrop-blur-xl border-2 border-[#1677FF] text-white p-3.5 rounded-2xl shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1677FF]"></span>
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-blue-400 font-heading">
                  GPS Turn-by-Turn Navigator
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-slate-300">
                {navElapsedSec}s / 6.0s
              </span>
            </div>

            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-[#1677FF] shrink-0" />
                <span className="font-bold truncate max-w-[200px]">
                  {navProgress < 0.4
                    ? 'Jalan Raja Muda Musa → Federal Highway'
                    : navProgress < 0.8
                    ? 'Persiaran Jubli Perak Westbound'
                    : 'Arrival: SK Seksyen 24 Shah Alam'}
                </span>
              </div>
              <span className="font-extrabold text-emerald-400 text-sm">
                {Math.max(0, 1.2 * (1 - navProgress)).toFixed(1)} km
              </span>
            </div>

            {/* Navigation Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 transition-all duration-75 ease-linear rounded-full"
                style={{ width: `${Math.round(navProgress * 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Speed: 38 km/h</span>
              <span>Corridor: Flood-Free Zone</span>
              <button
                onClick={handleResetNavigation}
                className="text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ARRIVAL CONFIRMATION DIALOG (When 6s navigation finishes) */}
        {hasArrived && (
          <div className="absolute inset-0 z-30 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="max-w-md w-full bg-slate-900 border border-emerald-500/80 rounded-3xl p-6 text-white shadow-2xl text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                  GPS Route Complete (6s Simulation)
                </span>
                <h3 className="font-heading font-extrabold text-xl text-white">
                  Safely Arrived at {selectedShelter?.name || 'Shelter'}
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Geofence check-in successful. Your designated emergency contacts have been notified via Telegram Bot & SMS with your confirmed shelter location.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Arrival Time:</span>
                  <span className="font-bold text-white">Just now</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Family Safety Status:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> ARRIVED SAFE
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shelter Capacity:</span>
                  <span className="font-bold text-white">
                    {selectedShelter?.currentCapacity} / {selectedShelter?.maxCapacity}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleResetNavigation}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                >
                  Return to Map
                </button>
                <button
                  onClick={() => navigate('/reports')}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-extrabold transition-colors flex items-center justify-center gap-1"
                >
                  <span>Submit Arrival Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Map Legend */}
        <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white text-xs font-semibold shadow-xl">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Safe Corridor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentZone.fillColor }}
            />
            <span>{currentZone.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Shelter Full</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Shelter Closed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1677FF]" />
            <span>Live GPS</span>
          </div>
        </div>
      </div>

      {/* Shelter Selection Drawer (Right panel on Desktop, Bottom sheet on Mobile) */}
      <div className="w-full md:w-[390px] lg:w-[430px] bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col z-20 shadow-2xl overflow-hidden shrink-0">
        {/* Header & Transport Mode */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-heading font-extrabold text-base md:text-lg text-slate-900">
                Evacuation Relief Centers
              </h2>
              <span className="text-[11px] text-slate-500">Maximum 6 Safe Havens Registered</span>
            </div>
            <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
              {filteredShelters.length} / 6 Shown
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
                {mode === 'all' ? 'All (6)' : mode === 'open' ? 'Open Only' : 'Recommended'}
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

        {/* Shelters List (6 total, including full/closed examples) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredShelters.map((s) => {
            const isSelected = s.id === selectedShelter?.id;
            const capPct = Math.round((s.currentCapacity / s.maxCapacity) * 100);
            const isFull = s.status === 'FULL';
            const isClosed = s.status === 'CLOSED';
            const isBlocked = s.routeStatus === 'BLOCKED';

            return (
              <div
                key={s.id}
                onClick={() => setSelectedShelterId(s.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? isClosed
                      ? 'border-red-400 bg-red-50/40 ring-1 ring-red-300'
                      : isFull
                      ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-300'
                      : 'border-[#1677FF] bg-blue-50/40 shadow-sm ring-1 ring-[#1677FF]/30'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {s.category}
                    </span>
                    <h3 className="font-heading font-bold text-sm text-slate-900">{s.name}</h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 shrink-0 ${
                      isClosed
                        ? 'bg-red-100 text-red-800'
                        : isFull
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isClosed ? (
                      <>
                        <AlertOctagon className="w-3 h-3" />
                        <span>CLOSED</span>
                      </>
                    ) : isFull ? (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        <span>CAPACITY FULL</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{s.status}</span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 my-2 text-xs text-slate-600">
                  <span className="font-bold text-slate-800">{s.distanceKm} km</span>
                  <span>·</span>
                  <span className="font-semibold text-[#1677FF]">
                    ~{transport.time} ({transportMode})
                  </span>
                  <span>·</span>
                  <span
                    className={`font-semibold ${
                      isBlocked ? 'text-red-600' : s.routeStatus === 'ADVISORY' ? 'text-amber-600' : 'text-emerald-600'
                    }`}
                  >
                    {s.routeStatus}
                  </span>
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1 mt-2">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Capacity ({capPct}%)</span>
                    <span className={`font-bold ${capPct >= 100 ? 'text-red-600' : 'text-slate-700'}`}>
                      {s.currentCapacity} / {s.maxCapacity}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        capPct >= 100
                          ? 'bg-red-600'
                          : capPct > 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, capPct)}%` }}
                    />
                  </div>
                </div>

                {/* Special Closed / Full Capacity Advisory Alert */}
                {isClosed && (
                  <div className="mt-2.5 p-2 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-start gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Access Route Inundated</span>
                      <span>This shelter is closed. Please redirect to SK Seksyen 24 (1.2 km).</span>
                    </div>
                  </div>
                )}

                {isFull && (
                  <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">100% Maximum Capacity Reached</span>
                      <span>No more beds available. Redirecting new evacuees to secondary hall.</span>
                    </div>
                  </div>
                )}

                {/* Selected Action Buttons */}
                {isSelected && (
                  <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center gap-2">
                    {isClosed || isFull ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Auto redirect to safe shelter-01
                          setSelectedShelterId('shelter-01');
                        }}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Reroute to Open Shelter</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartNavigation(s);
                        }}
                        disabled={isNavigating}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#1677FF] hover:bg-[#0958D9] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{isNavigating ? 'Navigating...' : 'Start Turn-by-Turn'}</span>
                      </button>
                    )}
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
