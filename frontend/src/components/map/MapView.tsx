import React, { useEffect, useState } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  GeoJSON, 
  Marker, 
  Popup, 
  Polyline, 
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  DisasterScenario, 
  MapLayer, 
  CriticalFacility, 
  RouteAnalysis
} from '../../types';
import { MapLegend } from './MapLegend';
import { Crosshair } from 'lucide-react';
import { InspectableFeature } from '../layout/FeatureDetailDrawer';

interface MapViewProps {
  scenario: DisasterScenario;
  layers: MapLayer[];
  activeBasemap: string;
  selectedFacility: CriticalFacility | null;
  selectedRoute: RouteAnalysis | null;
  resetViewTrigger: number;
  onSelectFeature?: (feature: InspectableFeature) => void;
  userCoords?: [number, number] | null;
}

// Controller component to smoothly fly map to bounds or coordinates
const MapCameraController: React.FC<{
  center: [number, number];
  zoom: number;
  selectedFacility: CriticalFacility | null;
  selectedRoute: RouteAnalysis | null;
  resetViewTrigger: number;
}> = ({ center, zoom, selectedFacility, selectedRoute, resetViewTrigger }) => {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.0 });
  }, [center, zoom, resetViewTrigger, map]);

  useEffect(() => {
    if (selectedFacility) {
      map.flyTo(selectedFacility.coordinates, 16, { duration: 0.8 });
    }
  }, [selectedFacility, map]);

  useEffect(() => {
    if (selectedRoute && selectedRoute.coordinates.length > 0) {
      const bounds = L.latLngBounds(selectedRoute.coordinates);
      map.fitBounds(bounds, { padding: [60, 60], duration: 0.8 });
    }
  }, [selectedRoute, map]);

  return null;
};

// Coordinate Reader component for tactical cursor readout
const CoordinateReader: React.FC = () => {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState<number>(14);

  const map = useMapEvents({
    mousemove(e) {
      setCoords(e.latlng);
    },
    zoomend() {
      setZoom(map.getZoom());
    }
  });

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-geo-panel backdrop-blur-[16px] border border-geo-border-strong rounded-md px-2.5 py-1 text-[10px] font-mono text-geo-text-secondary shadow-sm pointer-events-none flex items-center gap-2.5 select-none">
      <div className="flex items-center gap-1 text-geo-accent">
        <Crosshair className="w-3 h-3" />
        <span className="font-semibold">WGS84</span>
      </div>
      <div>
        <span className="text-geo-text-primary font-semibold">{coords ? coords.lat.toFixed(5) : '--.-----'}°N</span>
      </div>
      <div className="text-geo-divider">|</div>
      <div>
        <span className="text-geo-text-primary font-semibold">{coords ? coords.lng.toFixed(5) : '---.-----'}°E</span>
      </div>
      <div className="text-geo-divider">|</div>
      <div>
        Z:<span className="text-geo-accent font-semibold">{zoom}</span>
      </div>
    </div>
  );
};

// Tactical Markers with refined aesthetic and semantic colors (max weight 600)
const createTacticalIcon = (type: string, status: string) => {
  let bgColor = '#2563eb';
  let borderColor = 'rgba(37, 99, 235, 0.6)';
  let symbol = 'BASE';

  if (type === 'hospital') {
    bgColor = status === 'operational' ? '#059669' : '#dc2626';
    borderColor = status === 'operational' ? 'rgba(5, 150, 105, 0.6)' : 'rgba(220, 38, 38, 0.6)';
    symbol = '+';
  } else if (type === 'bridge') {
    bgColor = '#dc2626';
    borderColor = 'rgba(220, 38, 38, 0.6)';
    symbol = 'BRG';
  } else if (type === 'shelter') {
    bgColor = '#0284c7';
    borderColor = 'rgba(2, 132, 199, 0.6)';
    symbol = 'EVAC';
  }

  return L.divIcon({
    className: 'custom-tactical-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 5px;
          background: ${bgColor};
          border: 1.5px solid ${borderColor};
          color: #ffffff;
          font-family: 'JetBrains Mono', monospace;
          font-weight: 600;
          font-size: 10px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        ">
          ${symbol}
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

export const MapView: React.FC<MapViewProps> = ({
  scenario,
  layers,
  activeBasemap,
  selectedFacility,
  selectedRoute,
  resetViewTrigger,
  onSelectFeature,
  userCoords,
}) => {
  // Layer visibility helper
  const isVisible = (layerId: string) => layers.find(l => l.id === layerId)?.visible ?? true;
  const getOpacity = (layerId: string) => layers.find(l => l.id === layerId)?.opacity ?? 0.8;

  // Basemap tile selection with 100% free, reliable, no-watermark GIS tiles
  let tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
  let attribution = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ';

  if (activeBasemap === 'esri-dark') {
    tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    attribution = 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ';
  } else if (activeBasemap === 'osm-standard') {
    tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  } else if (activeBasemap === 'esri-satellite') {
    tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS';
  } else if (activeBasemap === 'air-gapped-eoc') {
    tileUrl = 'http://127.0.0.1:8000/api/tiles/{z}/{x}/{y}.png';
    attribution = 'GEO-RESQ Local Air-Gapped Tile Server &mdash; Zero Internet Standalone EOC';
  }

  // Styling for Inundation polygons
  const floodStyle = () => ({
    fillColor: '#0284c7',
    fillOpacity: getOpacity('flood_extent') * 0.35,
    color: '#00d4ff',
    weight: 1.5,
    dashArray: '3, 3',
  });

  // Styling for Building Damage polygons
  const damageStyle = (feature: any) => {
    const damageClass = feature?.properties?.damage_class;
    let color = '#ff3b3b'; // DESTROYED
    if (damageClass === 'MAJOR_DAMAGE') color = '#ffaa00';
    if (damageClass === 'MINOR_DAMAGE') color = '#ffd447';
    if (damageClass === 'NO_CHANGE') color = '#00e68a';

    return {
      fillColor: color,
      fillOpacity: getOpacity('damage_buildings') * 0.65,
      color: color,
      weight: 1.5,
    };
  };

  // Styling for Road Network lines
  const roadStyle = (feature: any) => {
    const status = feature?.properties?.status;
    let color = '#00e68a';
    let dashArray: string | undefined = undefined;

    if (status === 'BLOCKED') {
      color = '#ff3b3b';
      dashArray = '5, 5';
    } else if (status === 'CAUTION') {
      color = '#ffaa00';
    }

    return {
      color: color,
      weight: 2.5,
      opacity: getOpacity('road_network'),
      dashArray: dashArray,
    };
  };

  // Popup content generator and click handler for GeoJSON features
  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (!feature.properties) return;
    const p = feature.properties;

    layer.on({
      click: () => {
        if (onSelectFeature) {
          onSelectFeature({ type: 'damage', data: p });
        }
      }
    });

    const popupHtml = `
      <div class="p-3 text-xs max-w-xs select-text">
        <div class="flex items-center justify-between border-b border-geo-border pb-1.5 mb-2">
          <span class="font-semibold text-geo-text-primary text-[11px] uppercase">${p.name || p.id}</span>
          <span class="text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase ${
            p.damage_class === 'DESTROYED' || p.status === 'BLOCKED'
              ? 'bg-geo-critical-bg text-geo-critical border border-geo-critical/25'
              : p.damage_class === 'MAJOR_DAMAGE' || p.status === 'CAUTION'
              ? 'bg-geo-warning-bg text-geo-warning border border-geo-warning/25'
              : 'bg-geo-success-bg text-geo-success border border-geo-success/25'
          }">
            ${p.damage_class || p.status || 'ACTIVE'}
          </span>
        </div>

        <div class="space-y-1 text-[10px] text-geo-text-secondary">
          ${p.operational_tag ? `<div>Tag: <span class="text-geo-text-primary font-medium">${p.operational_tag}</span></div>` : ''}
          ${p.confidence ? `<div>AI Confidence: <span class="font-mono text-geo-text-primary">${Math.round(p.confidence * 100)}%</span></div>` : ''}
          ${p.source ? `<div>Source: <span class="text-geo-text-tertiary">${p.source}</span></div>` : ''}
        </div>
      </div>
    `;

    layer.bindPopup(popupHtml);
  };

  return (
    <div className="relative w-full h-full bg-geo-canvas">
      <MapContainer
        center={scenario.center}
        zoom={scenario.zoom}
        className="w-full h-full z-10"
        zoomControl={false}
      >
        <MapCameraController 
          center={scenario.center} 
          zoom={scenario.zoom}
          selectedFacility={selectedFacility}
          selectedRoute={selectedRoute}
          resetViewTrigger={resetViewTrigger}
        />

        <CoordinateReader />

        <TileLayer
          key={activeBasemap}
          url={tileUrl}
          attribution={attribution}
          maxZoom={19}
        />

        {/* Inundation Layer */}
        {isVisible('flood_extent') && (
          <GeoJSON
            key={`flood-${scenario.id}-${getOpacity('flood_extent')}`}
            data={scenario.floodExtentGeoJson}
            style={floodStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Damaged Structures Layer */}
        {isVisible('damage_buildings') && (
          <GeoJSON
            key={`damage-${scenario.id}-${getOpacity('damage_buildings')}`}
            data={scenario.damagePolygonsGeoJson}
            style={damageStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Road Network Layer */}
        {isVisible('road_network') && (
          <GeoJSON
            key={`roads-${scenario.id}-${getOpacity('road_network')}`}
            data={scenario.roadNetworkGeoJson}
            style={roadStyle}
            onEachFeature={onEachFeature}
          />
        )}

        {/* Candidate Rescue Routes (Dynamic Polylines) */}
        {isVisible('candidate_routes') && scenario.candidateRoutes.map((route) => {
          const isSelected = selectedRoute?.id === route.id;
          const isViable = route.status === 'viable';
          const color = isViable ? '#059669' : route.status === 'caution' ? '#d97706' : '#dc2626';

          return (
            <Polyline
              key={route.id}
              positions={route.coordinates}
              pathOptions={{
                color: color,
                weight: isSelected ? 5 : 3.5,
                opacity: getOpacity('candidate_routes'),
                dashArray: isViable ? undefined : '5, 5',
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectFeature) {
                    onSelectFeature({ type: 'route', data: route });
                  }
                }
              }}
            >
              <Popup>
                <div className="p-2 text-xs max-w-xs">
                  <div className="font-semibold text-geo-text-primary mb-1 text-[11px]">{route.title}</div>
                  <div className="text-[10px] text-geo-text-secondary space-y-0.5">
                    <div>Status: <span className="font-mono font-semibold text-geo-success uppercase">{route.status}</span></div>
                    <div>Distance: <span className="font-mono">{route.distanceKm} km</span></div>
                    <div>ETA: <span className="font-mono">{route.estTimeMin > 0 ? `~${route.estTimeMin} min (demo)` : 'Blocked'}</span></div>
                    <div className="text-geo-text-tertiary mt-1">{route.reason}</div>
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}

        {/* Critical Facilities Markers */}
        {isVisible('critical_facilities') && scenario.criticalFacilities.map((fac) => (
          <Marker
            key={fac.id}
            position={fac.coordinates}
            icon={createTacticalIcon(fac.type, fac.status)}
            eventHandlers={{
              click: () => {
                if (onSelectFeature) {
                  onSelectFeature({ type: 'facility', data: fac });
                }
              }
            }}
          >
            <Popup>
              <div className="p-2.5 text-xs max-w-xs">
                <div className="flex items-center justify-between border-b border-geo-border pb-1 mb-1.5">
                  <span className="font-semibold text-geo-text-primary text-[11px]">{fac.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase bg-geo-surface-2 text-geo-text-secondary">
                    {fac.type}
                  </span>
                </div>
                <div className="text-[10px] text-geo-text-secondary space-y-1">
                  <div>Status: <span className="font-mono font-semibold uppercase text-geo-success">{fac.status}</span></div>
                  <div className="text-geo-text-tertiary">{fac.details}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User GPS Position Marker (Mobile & Citizen Navigation) */}
        {userCoords && (
          <Marker
            position={userCoords}
            icon={L.divIcon({
              className: 'user-gps-marker',
              html: `
                <div style="position: relative; width: 22px; height: 22px;">
                  <div style="position: absolute; inset: 0; border-radius: 9999px; background-color: #0284c7; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                  <div style="position: absolute; inset: 3px; border-radius: 9999px; background-color: #0284c7; border: 2.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.35);"></div>
                </div>
              `,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            })}
          >
            <Popup>
              <div className="p-2 text-xs">
                <strong className="text-geo-accent block font-bold">Your GPS Location</strong>
                <div className="text-[10px] font-mono text-geo-text-secondary mt-0.5">
                  {userCoords[0].toFixed(5)}, {userCoords[1].toFixed(5)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating Tactical Legend */}
      <MapLegend />
    </div>
  );
};
