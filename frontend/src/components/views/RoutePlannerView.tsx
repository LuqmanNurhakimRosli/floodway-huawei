import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Truck, 
  CheckCircle2, 
  Eye,
  Zap
} from 'lucide-react';
import { DisasterScenario, RouteAnalysis } from '../../types';

interface RoutePlannerViewProps {
  scenario: DisasterScenario;
  onSelectRouteOnMap?: (route: RouteAnalysis) => void;
  onReturnToCommandMap?: () => void;
}

export interface RouteProfileSpec {
  name: string;
  max_water_depth_m: number;
  caution_depth_m: number;
  base_speed_kmh: number;
  wading_capability: string;
}

export const RoutePlannerView: React.FC<RoutePlannerViewProps> = ({
  scenario,
  onSelectRouteOnMap,
  onReturnToCommandMap,
}) => {
  const [corridors, setCorridors] = useState<RouteAnalysis[]>(scenario.candidateRoutes);
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    scenario.candidateRoutes[0]?.id || ''
  );
  const [hazardAvoidance, setHazardAvoidance] = useState<boolean>(true);
  const [convoyClass, setConvoyClass] = useState<string>('amphibious_4x4');
  const [dispatched, setDispatched] = useState<boolean>(false);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [profileSpec, setProfileSpec] = useState<{
    name: string;
    max_water_depth_m: number;
    caution_depth_m: number;
    base_speed_kmh: number;
    wading_capability: string;
  }>({
    name: "Heavy 4x4 / Amphibious Unimog",
    max_water_depth_m: 0.70,
    caution_depth_m: 0.20,
    base_speed_kmh: 40.0,
    wading_capability: "HIGH (Snorkel Exhaust + All-Wheel Drive)"
  });

  // Dynamically recalculate routes whenever profile or scenario changes
  useEffect(() => {
    let isMounted = true;
    setIsCalculating(true);
    fetch('http://127.0.0.1:8000/api/routes/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: scenario.id,
        profile: convoyClass,
        hazard_avoidance: hazardAvoidance
      })
    })
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data.corridors && data.corridors.length > 0) {
          setCorridors(data.corridors);
          if (data.spec) setProfileSpec(data.spec);
        }
      })
      .catch(err => {
        console.warn('Route engine backend offline, using edge candidate corridors:', err);
        const specs: Record<string, RouteProfileSpec> = {
          amphibious_4x4: {
            name: "Heavy 4x4 / Amphibious Unimog",
            max_water_depth_m: 0.70,
            caution_depth_m: 0.20,
            base_speed_kmh: 40.0,
            wading_capability: "HIGH (Snorkel Exhaust + All-Wheel Drive)"
          },
          light_ambulance: {
            name: "Standard Medical Transport / Light Ambulance",
            max_water_depth_m: 0.20,
            caution_depth_m: 0.05,
            base_speed_kmh: 50.0,
            wading_capability: "LOW (Hydrolock Hazard > 0.20m)"
          },
          evacuee_foot: {
            name: "Civilian Evacuee / Pedestrian on Foot",
            max_water_depth_m: 0.10,
            caution_depth_m: 0.02,
            base_speed_kmh: 4.5,
            wading_capability: "VERY LOW (Current Sweep Risk > 0.10m)"
          }
        };
        if (specs[convoyClass]) {
          setProfileSpec(specs[convoyClass]);
        }
      })
      .finally(() => {
        if (isMounted) setIsCalculating(false);
      });

    return () => { isMounted = false; };
  }, [scenario.id, convoyClass, hazardAvoidance]);

  const activeRoute = corridors.find(r => r.id === selectedRouteId) || corridors[0] || scenario.candidateRoutes[0];

  const handleDispatch = () => {
    setDispatched(true);
    setTimeout(() => setDispatched(false), 5000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-geo-canvas text-geo-text-primary p-4 sm:p-6 space-y-6 select-none">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-geo-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-geo-surface-2 text-geo-text-tertiary border border-geo-border uppercase">
              Module 4 • Geospatial Routing Engine
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-600" />
              NetworkX Multi-Criteria Routing
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-geo-text-primary mt-1.5">
            Disaster-Aware Emergency Route Planner
          </h1>
          <p className="text-xs text-geo-text-secondary mt-0.5">
            Calculate viable evacuation corridors calibrated against vehicle water wading thresholds and AI flood polygons.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onReturnToCommandMap && (
            <button
              onClick={onReturnToCommandMap}
              className="h-8 px-3 text-xs font-semibold rounded-md bg-geo-surface-1 hover:bg-geo-surface-2 border border-geo-border text-geo-text-primary transition-colors"
            >
              View on Map
            </button>
          )}
        </div>
      </div>

      {/* 2. Mission Setup & Comparison Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Mission Parameters & Routing Form (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-xl border border-geo-border bg-geo-panel shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-geo-border">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-geo-accent" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-geo-text-primary">
                Mission Parameters Setup
              </h2>
            </div>
            {isCalculating && (
              <span className="text-[10px] font-mono text-geo-accent font-semibold animate-pulse">
                Recalculating Graph...
              </span>
            )}
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Origin */}
            <div>
              <label className="block text-[11px] font-semibold text-geo-text-secondary uppercase tracking-wider mb-1">
                Departure Staging Origin
              </label>
              <div className="p-2.5 rounded bg-geo-surface-1 border border-geo-border flex items-center gap-2 font-medium text-geo-text-primary">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{scenario.id === 'kajang_river_surge' ? 'Stadium Kajang Forward Command Post' : 'Hospital La Fe Staging Hub'}</span>
              </div>
            </div>

            {/* Destination Selection */}
            <div>
              <label className="block text-[11px] font-semibold text-geo-text-secondary uppercase tracking-wider mb-1">
                Select Corridor & Destination
              </label>
              <select
                value={selectedRouteId}
                onChange={(e) => setSelectedRouteId(e.target.value)}
                className="w-full p-2.5 rounded bg-geo-surface-1 border border-geo-border text-geo-text-primary focus:outline-none focus:ring-1 focus:ring-geo-accent font-medium text-xs"
              >
                {corridors.map(rt => (
                  <option key={rt.id} value={rt.id}>
                    {rt.title} ({rt.distanceKm} km • {rt.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* Convoy Class (Multi-Criteria Clearance Profiles) */}
            <div>
              <label className="block text-[11px] font-semibold text-geo-text-secondary uppercase tracking-wider mb-1">
                Response Convoy Vehicle Clearance Profile
              </label>
              <select
                value={convoyClass}
                onChange={(e) => setConvoyClass(e.target.value)}
                className="w-full p-2.5 rounded bg-geo-surface-1 border border-geo-border text-geo-text-primary focus:outline-none focus:ring-1 focus:ring-geo-accent font-medium text-xs"
              >
                <option value="amphibious_4x4">Heavy 4x4 / Amphibious Unimog (Wading &lt; 0.70m)</option>
                <option value="light_ambulance">Standard Medical Transport / Light Ambulance (Wading &lt; 0.20m)</option>
                <option value="evacuee_foot">Civilian Evacuee on Foot / Pedestrian (Wading &lt; 0.10m)</option>
              </select>

              {/* Dynamic Clearance Specs Badge */}
              <div className="mt-2 p-2.5 rounded bg-geo-surface-1 border border-geo-border space-y-1 text-[11px]">
                <div className="flex justify-between font-mono">
                  <span className="text-geo-text-tertiary">Max Safe Depth:</span>
                  <span className="font-bold text-geo-accent">{profileSpec.max_water_depth_m} meters</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-geo-text-tertiary">Base Velocity:</span>
                  <span className="font-semibold text-geo-text-primary">{profileSpec.base_speed_kmh} km/h</span>
                </div>
                <div className="text-[10px] text-geo-text-secondary pt-0.5">
                  Capability: {profileSpec.wading_capability}
                </div>
              </div>
            </div>

            {/* Hazard Avoidance Switch */}
            <div className="p-3 rounded-lg bg-geo-surface-1 border border-geo-border flex items-center justify-between">
              <div>
                <span className="font-semibold text-geo-text-primary block">Dynamic Hazard Avoidance</span>
                <span className="text-[10px] text-geo-text-tertiary">Sever edges exceeding vehicle wading limit in NetworkX cost matrix</span>
              </div>
              <input
                type="checkbox"
                checked={hazardAvoidance}
                onChange={(e) => setHazardAvoidance(e.target.checked)}
                className="rounded text-geo-accent focus:ring-geo-accent w-4 h-4 cursor-pointer"
              />
            </div>

            {/* Mobilization Action Button */}
            {dispatched ? (
              <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Convoy Unit Dispatched to {activeRoute.destination}! Mission logged in EOC audit trail.</span>
              </div>
            ) : (
              <button
                onClick={handleDispatch}
                className="w-full py-2.5 rounded-lg bg-geo-accent hover:bg-geo-accent-hover text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 active:scale-98 transition-transform"
              >
                <Truck className="w-4 h-4" />
                Dispatch Response Convoy
              </button>
            )}
          </div>
        </div>

        {/* Right: Route Comparison: Fastest vs Safest (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Card 1: Selected / Calibrated Corridor */}
          <div className={`p-5 rounded-xl border bg-geo-panel shadow-sm space-y-3.5 relative overflow-hidden ${
            activeRoute.status === 'impassable' 
              ? 'border-rose-500/40' 
              : activeRoute.status === 'caution' 
              ? 'border-amber-500/40' 
              : 'border-emerald-500/40'
          }`}>
            <div className={`absolute top-0 right-0 text-white text-[9px] font-mono font-bold px-3 py-0.5 rounded-bl uppercase ${
              activeRoute.status === 'impassable' 
                ? 'bg-rose-600' 
                : activeRoute.status === 'caution' 
                ? 'bg-amber-600' 
                : 'bg-emerald-600'
            }`}>
              {activeRoute.status === 'impassable' ? 'IMPASSABLE FOR THIS PROFILE' : 'EVALUATED CORRIDOR'}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <h3 className="font-bold text-sm text-geo-text-primary">{activeRoute.title}</h3>
                <div className="text-xs text-geo-text-secondary mt-0.5">
                  Origin: <strong className="text-geo-text-primary">{activeRoute.origin}</strong> → Destination: <strong className="text-geo-text-primary">{activeRoute.destination}</strong>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-2.5 rounded bg-geo-surface-1 border border-geo-border">
                <span className="text-[10px] text-geo-text-tertiary block uppercase font-mono">Distance</span>
                <span className="text-base font-bold font-mono text-geo-text-primary">{activeRoute.distanceKm} km</span>
              </div>
              <div className="p-2.5 rounded bg-geo-surface-1 border border-geo-border">
                <span className="text-[10px] text-geo-text-tertiary block uppercase font-mono">Est Duration</span>
                <span className="text-base font-bold font-mono text-geo-text-primary">
                  {activeRoute.status === 'impassable' ? 'BLOCKED' : `~${activeRoute.estTimeMin} min`}
                </span>
              </div>
              <div className="p-2.5 rounded bg-geo-surface-1 border border-geo-border">
                <span className="text-[10px] text-geo-text-tertiary block uppercase font-mono">Status Assessment</span>
                <span className={`text-sm font-bold uppercase font-mono ${
                  activeRoute.status === 'impassable' ? 'text-rose-600' : activeRoute.status === 'caution' ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {activeRoute.status}
                </span>
              </div>
            </div>

            <div className="text-xs text-geo-text-secondary leading-relaxed pt-1 bg-geo-surface-1 p-3 rounded-lg border border-geo-border">
              <strong className="text-geo-text-primary block mb-0.5">Clearance Rationale:</strong>
              {activeRoute.reason}
            </div>

            {onSelectRouteOnMap && (
              <button
                onClick={() => onSelectRouteOnMap(activeRoute)}
                className="text-xs font-semibold text-geo-accent hover:underline flex items-center gap-1.5 pt-1"
              >
                <Eye className="w-3.5 h-3.5" />
                Highlight Polyline Road Curves on Map →
              </button>
            )}
          </div>

          {/* Card 2: Fastest Direct Route (Blocked by Flood Comparison) */}
          <div className="p-4 rounded-xl border border-rose-500/30 bg-geo-surface-1/60 shadow-sm space-y-2 text-xs opacity-90">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span className="font-bold text-geo-text-primary">Direct Route via Jalan Reko (FASTEST DIRECT)</span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-rose-600 text-white font-bold uppercase">
                Severed / Impassable
              </span>
            </div>
            <p className="text-geo-text-secondary leading-relaxed">
              1.6 km • ~4 min under dry baseline. <strong>Severed by 1.4m river surge at Jambatan Reko bridge.</strong> Ground vehicles would face immediate engine submergence and sweeping hazard.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
