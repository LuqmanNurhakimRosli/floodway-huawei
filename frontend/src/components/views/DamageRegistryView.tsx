import React, { useState } from 'react';
import { 
  Search, 
  Eye, 
  Download
} from 'lucide-react';
import { DisasterScenario } from '../../types';
import { InspectableFeature } from '../layout/FeatureDetailDrawer';

interface DamageRegistryViewProps {
  scenario: DisasterScenario;
  onSelectInspectFeature?: (feature: InspectableFeature) => void;
  onReturnToCommandMap?: () => void;
}

export const DamageRegistryView: React.FC<DamageRegistryViewProps> = ({
  scenario,
  onSelectInspectFeature,
  onReturnToCommandMap,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Compile unified registry list from scenario datasets
  const registryItems = [
    // Damaged Buildings
    ...scenario.damagePolygonsGeoJson.features.map(f => {
      const p = (f.properties || {}) as Record<string, any>;
      const geom = f.geometry as any;
      const coords = geom?.coordinates?.[0]?.[0] || [101.7895, 2.9935];
      return {
        id: p.id || 'bldg-unknown',
        name: p.name || 'Compromised Structure',
        type: 'Building',
        status: p.damage_class || 'DAMAGED',
        location: `${coords[1]?.toFixed?.(4) || '2.9935'}, ${coords[0]?.toFixed?.(4) || '101.7895'}`,
        source: p.source || 'Sentinel-1 + Optical Siamese Model',
        change: 'Detected change between pre/post EO passes',
        relatedAccess: 'Adjacent road buffer flooded',
        notes: p.notes || 'Structural compromise detected',
        rawFeature: { type: 'damage' as const, data: p },
        severity: p.damage_class === 'DESTROYED' ? 3 : p.damage_class === 'MAJOR_DAMAGE' ? 2 : 1
      };
    }),
    // Blocked Roads
    ...scenario.roadNetworkGeoJson.features.map(r => {
      const p = (r.properties || {}) as Record<string, any>;
      const geom = r.geometry as any;
      const coords = geom?.coordinates?.[0] || [101.7895, 2.9935];
      return {
        id: p.id || 'road-unknown',
        name: p.name || 'Impacted Road Link',
        type: 'Roadway',
        status: p.status || 'BLOCKED',
        location: `${coords[1]?.toFixed?.(4) || '2.9935'}, ${coords[0]?.toFixed?.(4) || '101.7895'}`,
        source: 'OSM Graph + SAR Water Intersection',
        change: 'Surface impassable due to alluvial flooding',
        relatedAccess: p.osm_id || 'OSM Link',
        notes: p.notes || 'Impassable for vehicular transit',
        rawFeature: { type: 'road' as const, data: p },
        severity: 3
      };
    }),
    // Critical Facilities
    ...scenario.criticalFacilities.map(fac => ({
      id: fac.id,
      name: fac.name,
      type: fac.type.toUpperCase(),
      status: fac.status.toUpperCase(),
      location: `${fac.coordinates[0].toFixed(4)}, ${fac.coordinates[1].toFixed(4)}`,
      source: 'Geospatial Registry + Field Verification',
      change: fac.status === 'operational' ? 'Operational clearance verified' : 'Surrounding area inundated',
      relatedAccess: 'Direct arterial access',
      notes: fac.details,
      rawFeature: { type: 'facility' as const, data: fac },
      severity: fac.status === 'operational' ? 0 : 2
    }))
  ];

  // Filtering
  const filteredItems = registryItems.filter(item => {
    const matchesSearch = 
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'ALL') return true;
    if (filterType === 'BUILDINGS') return item.type === 'Building';
    if (filterType === 'ROADS') return item.type === 'Roadway';
    if (filterType === 'DESTROYED') return item.status === 'DESTROYED';
    if (filterType === 'MAJOR') return item.status === 'MAJOR_DAMAGE';
    if (filterType === 'FACILITIES') return ['HOSPITAL', 'SHELTER', 'STAGING_BASE', 'BRIDGE'].includes(item.type);

    return true;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Name', 'Status', 'Location', 'Source', 'Notes'];
    const rows = filteredItems.map(i => [
      `"${i.id}"`,
      `"${i.type}"`,
      `"${i.name}"`,
      `"${i.status}"`,
      `"${i.location}"`,
      `"${i.source}"`,
      `"${i.notes}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `geo_resq_damage_registry_${scenario.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-geo-canvas text-geo-text-primary p-3 sm:p-6 pb-28 md:pb-6 space-y-4">
      {/* Top Header & Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-geo-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-geo-surface-2 text-geo-text-tertiary border border-geo-border uppercase">
              Module 3 • Infrastructure Assessment
            </span>
            <span className="text-xs font-mono text-geo-text-tertiary">
              {filteredItems.length} records in scope
            </span>
          </div>
          <h1 className="text-xl font-bold text-geo-text-primary mt-1">
            Damage & Infrastructure Registry
          </h1>
          <p className="text-xs text-geo-text-secondary mt-0.5">
            Systematic inventory of compromised structures, blocked arterial roads, and critical hubs detected via Earth Observation change detection.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="h-8 px-3 text-xs font-medium rounded-md bg-geo-surface-1 hover:bg-geo-surface-2 border border-geo-border text-geo-text-primary flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          {onReturnToCommandMap && (
            <button
              onClick={onReturnToCommandMap}
              className="h-8 px-3 text-xs font-semibold rounded-md bg-geo-accent hover:bg-geo-accent-hover text-white flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              View on Command Map
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'DESTROYED', label: 'Destroyed' },
            { id: 'MAJOR', label: 'Major Damage' },
            { id: 'ROADS', label: 'Road Blocks' },
            { id: 'FACILITIES', label: 'Critical Hubs' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-geo-accent text-white border-geo-accent'
                  : 'bg-geo-panel text-geo-text-secondary border-geo-border hover:bg-geo-surface-1'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Omnibar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-geo-text-tertiary absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by ID, name, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs bg-geo-panel border border-geo-border rounded-md text-geo-text-primary placeholder:text-geo-text-tertiary focus:outline-none focus:ring-1 focus:ring-geo-accent"
          />
        </div>
      </div>

      {/* Registry Table */}
      <div className="flex-1 rounded-lg border border-geo-border bg-geo-panel shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-geo-panel-header border-b border-geo-border sticky top-0 z-10 select-none">
              <tr>
                <th className="py-2.5 px-3 font-semibold text-geo-text-secondary">ID</th>
                <th className="py-2.5 px-3 font-semibold text-geo-text-secondary">Type</th>
                <th className="py-2.5 px-3 font-semibold text-geo-text-secondary">Feature Name</th>
                <th className="py-2.5 px-3 font-semibold text-geo-text-secondary">Status Assessment</th>
                <th className="py-2.5 px-3 font-semibold text-geo-text-secondary">Coordinates</th>
                <th className="py-2.5 px-3 font-semibold text-geo-text-secondary">Data Source</th>
                <th className="py-2.5 px-3 font-semibold text-geo-text-secondary text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-geo-border">
              {filteredItems.length > 0 ? (
                filteredItems.map(item => {
                  let statusBadge = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
                  if (item.status === 'DESTROYED' || item.status === 'BLOCKED' || item.status === 'SUBMERGED') {
                    statusBadge = 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
                  } else if (item.status === 'MAJOR_DAMAGE' || item.status === 'CAUTION') {
                    statusBadge = 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
                  }

                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-geo-surface-1 transition-colors group cursor-pointer"
                      onClick={() => onSelectInspectFeature && onSelectInspectFeature(item.rawFeature as any)}
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-geo-accent">
                        {item.id}
                      </td>
                      <td className="py-2.5 px-3 text-geo-text-secondary">
                        <span className="px-1.5 py-0.5 rounded bg-geo-surface-2 text-[10px] font-mono border border-geo-border uppercase">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-geo-text-primary">
                        <div>{item.name}</div>
                        <div className="text-[11px] text-geo-text-tertiary truncate max-w-xs">{item.notes}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${statusBadge}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-geo-text-secondary">
                        {item.location}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-geo-text-tertiary">
                        {item.source}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectInspectFeature) {
                              onSelectInspectFeature(item.rawFeature as any);
                            }
                          }}
                          className="px-2 py-1 rounded bg-geo-surface-2 hover:bg-geo-border text-geo-text-primary text-[11px] font-medium border border-geo-border inline-flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3 text-geo-accent" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-geo-text-tertiary">
                    No infrastructure records match current filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
