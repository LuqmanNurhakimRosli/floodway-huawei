import React from 'react';
import { 
  X, 
  MapPin, 
  Building2, 
  Route, 
  AlertTriangle, 
  Copy, 
  Check, 
  Crosshair,
  Database,
  ShieldCheck
} from 'lucide-react';
import { CriticalFacility, RouteAnalysis, DamageFeatureProperties } from '../../types';

export type InspectableFeature = 
  | { type: 'facility'; data: CriticalFacility }
  | { type: 'route'; data: RouteAnalysis }
  | { type: 'damage'; data: DamageFeatureProperties }
  | { type: 'location'; name: string; coordinates: [number, number]; details?: string };

interface FeatureDetailDrawerProps {
  feature: InspectableFeature | null;
  onClose: () => void;
  onCenterMap?: (coords: [number, number]) => void;
}

export const FeatureDetailDrawer: React.FC<FeatureDetailDrawerProps> = ({
  feature,
  onClose,
  onCenterMap,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!feature) return null;

  const getCoordinates = (): [number, number] | null => {
    if (feature.type === 'facility') return feature.data.coordinates;
    if (feature.type === 'location') return feature.coordinates;
    if (feature.type === 'route' && feature.data.coordinates.length > 0) {
      return feature.data.coordinates[0];
    }
    return null;
  };

  const coords = getCoordinates();

  const handleCopyCoords = () => {
    if (coords) {
      navigator.clipboard.writeText(`${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleCenter = () => {
    if (coords && onCenterMap) {
      onCenterMap(coords);
    }
  };

  return (
    <aside className="fixed bottom-14 right-4 z-40 w-[340px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-140px)] flex flex-col bg-geo-panel backdrop-blur-[16px] border border-geo-border-strong rounded-lg shadow-tactical text-geo-text-primary select-none overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
      {/* Header */}
      <div className="h-10 px-3.5 border-b border-geo-divider flex items-center justify-between bg-geo-surface-1">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-geo-text-secondary">
          {feature.type === 'facility' && <Building2 className="w-3.5 h-3.5 text-geo-info" />}
          {feature.type === 'route' && <Route className="w-3.5 h-3.5 text-geo-success" />}
          {feature.type === 'damage' && <AlertTriangle className="w-3.5 h-3.5 text-geo-critical" />}
          {feature.type === 'location' && <MapPin className="w-3.5 h-3.5 text-geo-accent" />}
          <span>
            {feature.type === 'facility' && 'Critical Facility'}
            {feature.type === 'route' && 'Rescue Corridor'}
            {feature.type === 'damage' && 'Damage Assessment'}
            {feature.type === 'location' && 'Selected Location'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-geo-text-tertiary hover:text-geo-text-primary hover:bg-geo-surface-2 transition-colors"
          title="Close Drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-3.5 overflow-y-auto space-y-3 text-xs">
        {/* Title & Status */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm text-geo-text-primary leading-tight">
              {feature.type === 'facility' && feature.data.name}
              {feature.type === 'route' && feature.data.title}
              {feature.type === 'damage' && (feature.data.name || 'Structural Impact Zone')}
              {feature.type === 'location' && feature.name}
            </h3>

            {/* Status Chip */}
            {feature.type === 'facility' && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase shrink-0 ${
                feature.data.status === 'operational' ? 'bg-geo-success-bg text-geo-success border border-geo-success/30' :
                feature.data.status === 'compromised' ? 'bg-geo-warning-bg text-geo-warning border border-geo-warning/30' :
                'bg-geo-critical-bg text-geo-critical border border-geo-critical/30'
              }`}>
                {feature.data.status}
              </span>
            )}

            {feature.type === 'route' && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase shrink-0 ${
                feature.data.status === 'viable' ? 'bg-geo-success-bg text-geo-success border border-geo-success/30' :
                feature.data.status === 'caution' ? 'bg-geo-warning-bg text-geo-warning border border-geo-warning/30' :
                'bg-geo-critical-bg text-geo-critical border border-geo-critical/30'
              }`}>
                {feature.data.status}
              </span>
            )}
          </div>

          {/* Subtitle / Details */}
          <p className="text-geo-text-secondary leading-relaxed text-xs">
            {feature.type === 'facility' && feature.data.details}
            {feature.type === 'route' && feature.data.reason}
            {feature.type === 'damage' && (feature.data.notes || 'Identified via bi-temporal structural change segmentation.')}
            {feature.type === 'location' && (feature.details || 'Geographic reference waypoint.')}
          </p>
        </div>

        {/* Route Metrics (if route) */}
        {feature.type === 'route' && (
          <div className="grid grid-cols-3 gap-2 p-2 rounded bg-geo-surface-1 border border-geo-border text-center font-mono">
            <div>
              <div className="text-[10px] text-geo-text-tertiary uppercase">Distance</div>
              <div className="text-sm font-semibold text-geo-text-primary">{feature.data.distanceKm} km</div>
            </div>
            <div>
              <div className="text-[10px] text-geo-text-tertiary uppercase">ETA (Demo)</div>
              <div className="text-sm font-semibold text-geo-accent">
                {feature.data.estTimeMin > 0 ? `~${feature.data.estTimeMin}m` : 'Blocked'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-geo-text-tertiary uppercase">Risk Tier</div>
              <div className={`text-xs font-semibold uppercase ${
                feature.data.riskLevel === 'LOW' ? 'text-geo-success' :
                feature.data.riskLevel === 'MODERATE' ? 'text-geo-warning' : 'text-geo-critical'
              }`}>
                {feature.data.riskLevel}
              </div>
            </div>
          </div>
        )}

        {/* Facility Capacity (if facility) */}
        {feature.type === 'facility' && feature.data.capacity && (
          <div className="flex items-center justify-between p-2 rounded bg-geo-surface-1 border border-geo-border text-xs">
            <span className="text-geo-text-secondary">Reported Capacity</span>
            <span className="font-mono font-semibold text-geo-text-primary">{feature.data.capacity}</span>
          </div>
        )}

        {/* Coordinates Section */}
        {coords && (
          <div className="flex items-center justify-between p-2 rounded bg-geo-surface-1 border border-geo-border font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-geo-text-secondary">
              <Crosshair className="w-3.5 h-3.5 text-geo-accent" />
              <span>{coords[0].toFixed(5)}°N, {coords[1].toFixed(5)}°E</span>
            </div>
            <button
              onClick={handleCopyCoords}
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-geo-surface-2 hover:bg-geo-surface-3 text-geo-text-secondary hover:text-geo-text-primary transition-colors"
              title="Copy WGS84 Coordinates"
            >
              {copied ? <Check className="w-3 h-3 text-geo-success" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}

        {/* Data Provenance & Source (Progressive Disclosure) */}
        <div className="pt-2 border-t border-geo-divider text-[11px] space-y-1.5 text-geo-text-tertiary">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              <span>Sensor / Source</span>
            </span>
            <span className="font-mono text-geo-text-secondary">
              {feature.type === 'facility' ? 'OpenStreetMap Verified' :
               feature.type === 'route' ? 'OSM Graph + CEMS Mask' :
               feature.type === 'damage' ? 'Sentinel-1 SAR / U-Net' : 'Geospatial Vector'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Analysis Tier</span>
            </span>
            <span className="font-mono text-geo-text-secondary">
              {feature.type === 'route' ? 'Dijkstra Least-Cost' : 'Bi-Temporal Change'}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {coords && onCenterMap && (
          <button
            onClick={handleCenter}
            className="w-full h-8 mt-1 rounded bg-geo-accent-muted hover:bg-geo-accent/20 border border-geo-border-accent text-geo-accent font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Center Map View</span>
          </button>
        )}
      </div>
    </aside>
  );
};
