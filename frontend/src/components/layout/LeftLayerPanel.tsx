import React from 'react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Map, 
  Waves, 
  Building2, 
  Route, 
  Activity, 
  X
} from 'lucide-react';
import { MapLayer } from '../../types';

interface LeftLayerPanelProps {
  layers: MapLayer[];
  onToggleLayer: (id: string) => void;
  onChangeOpacity: (id: string, opacity: number) => void;
  activeBasemap: string;
  onSelectBasemap: (basemap: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const LeftLayerPanel: React.FC<LeftLayerPanelProps> = ({
  layers,
  onToggleLayer,
  onChangeOpacity,
  activeBasemap,
  onSelectBasemap,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const basemaps = [
    { id: 'esri-dark', name: 'Tactical Dark (Esri)', desc: 'Official GIS contrast cartography' },
    { id: 'osm-standard', name: 'Daylight Standard (OSM)', desc: 'Clean daylight street vectors' },
    { id: 'esri-satellite', name: 'Satellite Imagery', desc: 'High-res earth observation' },
    { id: 'air-gapped-eoc', name: 'Air-Gapped Local EOC Server', desc: 'Zero-internet offline cartography (:8000)' },
  ];

  const getLayerIcon = (layerId: string) => {
    switch (layerId) {
      case 'flood_extent':
        return <Waves className="w-3.5 h-3.5 text-geo-accent" />;
      case 'damage_buildings':
        return <Building2 className="w-3.5 h-3.5 text-geo-critical" />;
      case 'road_network':
        return <Route className="w-3.5 h-3.5 text-geo-warning" />;
      case 'candidate_routes':
        return <Activity className="w-3.5 h-3.5 text-geo-success" />;
      case 'critical_facilities':
        return <Map className="w-3.5 h-3.5 text-geo-info" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-geo-text-tertiary" />;
    }
  };

  return (
    <aside className="absolute top-3 left-3 z-30 w-[270px] max-h-[calc(100vh-130px)] bg-geo-panel backdrop-blur-[16px] border border-geo-border-strong rounded-lg shadow-tactical flex flex-col select-none overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
      {/* Panel Header */}
      <div className="h-10 px-3 border-b border-geo-divider flex items-center justify-between bg-geo-surface-1">
        <div className="flex items-center gap-2 text-geo-text-primary font-semibold text-xs tracking-wider uppercase">
          <Layers className="w-3.5 h-3.5 text-geo-accent" />
          <span>Geospatial Layers</span>
        </div>
        <button 
          onClick={onClose}
          className="text-geo-text-tertiary hover:text-geo-text-primary p-1 rounded hover:bg-geo-surface-2 transition-colors"
          title="Close Layers"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs">
        {/* Basemap Selector */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-geo-text-tertiary font-semibold block mb-1.5 px-0.5">
            Cartography Base
          </label>
          <div className="space-y-1">
            {basemaps.map((b) => {
              const isActive = activeBasemap === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => onSelectBasemap(b.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border text-left transition-all ${
                    isActive
                      ? 'bg-geo-accent-muted border-geo-border-accent text-geo-text-primary'
                      : 'bg-geo-surface-1 border-geo-border text-geo-text-secondary hover:border-geo-border-strong hover:bg-geo-surface-2 hover:text-geo-text-primary'
                  }`}
                >
                  <div>
                    <div className="font-medium text-xs">{b.name}</div>
                    <div className="text-[10px] text-geo-text-tertiary">{b.desc}</div>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-geo-accent"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thematic Overlays */}
        <div>
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <span className="text-[10px] uppercase tracking-wider text-geo-text-tertiary font-semibold">
              Operational Overlays
            </span>
            <span className="text-[10px] font-mono text-geo-text-tertiary">
              {layers.filter(l => l.visible).length}/{layers.length} Active
            </span>
          </div>

          <div className="space-y-1.5">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={`p-2 rounded-md border transition-all ${
                  layer.visible
                    ? 'bg-geo-surface-1 border-geo-border'
                    : 'bg-transparent border-transparent opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onToggleLayer(layer.id)}
                      className="text-geo-text-tertiary hover:text-geo-text-primary transition-colors p-0.5"
                      title={layer.visible ? 'Hide Layer' : 'Show Layer'}
                    >
                      {layer.visible ? (
                        <Eye className="w-3.5 h-3.5 text-geo-accent" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-geo-text-quaternary" />
                      )}
                    </button>
                    {getLayerIcon(layer.id)}
                    <span className="text-xs font-medium text-geo-text-primary">
                      {layer.name}
                    </span>
                  </div>

                  {layer.featureCount !== undefined && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-geo-surface-2 text-geo-text-secondary border border-geo-border">
                      {layer.featureCount}
                    </span>
                  )}
                </div>

                {/* Concise Operational Label */}
                <div className="flex items-center justify-between mt-1 pl-6 text-[10px] text-geo-text-tertiary">
                  <span>{layer.badge || 'DATA'}</span>
                  {layer.visible && (
                    <span className="font-mono">{Math.round(layer.opacity * 100)}%</span>
                  )}
                </div>

                {/* Opacity slider */}
                {layer.visible && (
                  <div className="mt-1 pl-6 pr-1">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={layer.opacity}
                      onChange={(e) => onChangeOpacity(layer.id, parseFloat(e.target.value))}
                      className="w-full cursor-pointer"
                      title={`Opacity: ${Math.round(layer.opacity * 100)}%`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
