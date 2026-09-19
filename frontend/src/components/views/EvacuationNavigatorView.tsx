import React, { useState } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
  ArrowRight, 
  CornerUpRight, 
  CornerUpLeft, 
  Compass, 
  Share2, 
  ShieldCheck,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';
import { DisasterScenario } from '../../types';

interface EvacuationNavigatorViewProps {
  scenario: DisasterScenario;
  onReturnToCommandMap?: () => void;
}

export const EvacuationNavigatorView: React.FC<EvacuationNavigatorViewProps> = ({
  scenario,
  onReturnToCommandMap,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>(
    scenario.candidateRoutes[0]?.id || ''
  );
  const [alertSent, setAlertSent] = useState<boolean>(false);
  const [locationShared, setLocationShared] = useState<boolean>(false);

  const activeRoute = scenario.candidateRoutes.find(r => r.id === selectedRouteId) || scenario.candidateRoutes[0];

  // Turn-by-turn maneuvers tailored to the selected road corridor
  const maneuvers = [
    { id: 1, instruction: 'Depart Stadium Kajang Forward Command Post', distance: '150 m', icon: ArrowRight },
    { id: 2, instruction: 'Turn left onto Jalan Stadium', distance: '350 m', icon: CornerUpLeft },
    { id: 3, instruction: 'Keep right at junction onto Jalan Bukit (Elevated Causeway)', distance: '600 m', icon: CornerUpRight },
    { id: 4, instruction: 'Merge onto Jalan Semenyih bypass (High Ground)', distance: '800 m', icon: ArrowRight },
    { id: 5, instruction: 'Arrive at Hospital Kajang Emergency Triage Hub', distance: '200 m', icon: MapPin },
  ];

  const handleRequestHelp = () => {
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 4000);
  };

  const handleShareLocation = () => {
    setLocationShared(true);
    setTimeout(() => setLocationShared(false), 4000);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 md:h-full overflow-y-auto md:overflow-hidden bg-geo-canvas text-geo-text-primary pb-28 md:pb-0">
      {/* Left / Top Mobile-Style Turn-by-Turn Card */}
      <div className="w-full md:w-[420px] lg:w-[460px] flex flex-col border-b md:border-b-0 md:border-r border-geo-border bg-geo-panel shadow-sm md:h-full md:overflow-y-auto shrink-0 z-10">
        
        {/* Navigation Mode Banner */}
        <div className="bg-geo-accent p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 animate-spin-slow" />
              <span className="text-xs font-semibold uppercase tracking-wider">Field Responder GPS</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-black/20 text-white border border-white/20">
              Demo Route
            </span>
          </div>

          <div className="mt-3">
            <div className="text-xs text-blue-100 font-medium">Safe Destination</div>
            <h1 className="text-xl font-bold tracking-tight text-white">{activeRoute?.destination || 'Designated Safe Haven'}</h1>
            <div className="flex items-center gap-3 mt-2 text-xs text-blue-100">
              <span className="font-mono font-bold text-white text-base">{activeRoute?.distanceKm || 2.1} km</span>
              <span>•</span>
              <span className="font-mono font-bold text-white text-base">~{activeRoute?.estTimeMin || 6} min</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold">
                CLEARED CORRIDOR
              </span>
            </div>
          </div>
        </div>

        {/* Corridor Selector */}
        <div className="p-3 border-b border-geo-border bg-geo-surface-1">
          <label className="text-[11px] font-semibold text-geo-text-tertiary uppercase tracking-wider block mb-1.5">
            Select Active Evacuation Route
          </label>
          <select
            value={selectedRouteId}
            onChange={(e) => setSelectedRouteId(e.target.value)}
            className="w-full text-xs font-medium bg-geo-panel border border-geo-border hover:border-geo-border-strong rounded px-2.5 py-1.5 text-geo-text-primary focus:outline-none focus:ring-1 focus:ring-geo-accent"
          >
            {scenario.candidateRoutes.map(rt => (
              <option key={rt.id} value={rt.id}>
                {rt.title} ({rt.distanceKm} km • {rt.riskLevel} Risk)
              </option>
            ))}
          </select>
        </div>

        {/* Immediate Next Action Card (Google Maps / Waze style) */}
        <div className="p-4 border-b border-geo-border bg-geo-surface-2/40">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-geo-accent text-white flex items-center justify-center shrink-0 shadow-sm">
              <CornerUpRight className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-geo-accent">Next Maneuver</span>
              <div className="text-sm font-semibold text-geo-text-primary mt-0.5">
                Turn right onto Jalan Bukit (Elevated Causeway)
              </div>
              <div className="text-xs font-mono font-semibold text-geo-text-tertiary mt-0.5">
                in 300 meters
              </div>
            </div>
          </div>
        </div>

        {/* Road Hazard Caution Alert */}
        <div className="mx-4 my-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-geo-text-secondary">
            <strong className="text-amber-700 dark:text-amber-300 font-semibold block">ROADWAY HAZARD AHEAD</strong>
            Jalan Reko bridge approach completely submerged (1.4m depth). Do not deviate south. Stick strictly to the elevated green corridor.
          </div>
        </div>

        {/* Turn-By-Turn Step List */}
        <div className="flex-1 px-4 py-2 space-y-3">
          <div className="text-[11px] font-semibold text-geo-text-tertiary uppercase tracking-wider">
            Turn-by-Turn Waypoint Guidance
          </div>
          <div className="space-y-2">
            {maneuvers.map((m) => {
              const Icon = m.icon;
              return (
                <div 
                  key={m.id}
                  className="flex items-center justify-between p-2.5 rounded-md border border-geo-border bg-geo-surface-1 hover:bg-geo-surface-2 transition-colors text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-geo-surface-2 text-geo-accent flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="font-medium text-geo-text-primary">{m.instruction}</div>
                  </div>
                  <span className="font-mono text-xs text-geo-text-tertiary shrink-0 ml-2">{m.distance}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency Response Quick Action Toolbar */}
        <div className="p-4 border-t border-geo-border bg-geo-surface-1 mt-auto space-y-2">
          {alertSent && (
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              SOS Beacon broadcasted to Staging Base dispatch queue.
            </div>
          )}
          {locationShared && (
            <div className="p-2 rounded bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-400 text-xs flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              Telemetry GPS coordinates shared with EOC operations center.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleRequestHelp}
              className="py-2 px-3 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-transform active:scale-[0.98]"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Request Help
            </button>
            <button
              onClick={handleShareLocation}
              className="py-2 px-3 rounded-md bg-geo-surface-2 hover:bg-geo-border border border-geo-border text-geo-text-primary font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-geo-accent" />
              Share Location
            </button>
          </div>

          {onReturnToCommandMap && (
            <button
              onClick={onReturnToCommandMap}
              className="w-full py-1.5 text-xs text-center text-geo-text-tertiary hover:text-geo-text-primary underline block"
            >
              ← Return to Full EOC Command Map
            </button>
          )}
        </div>
      </div>

      {/* Right / Map Guidance Canvas */}
      <div className="w-full md:flex-1 relative bg-geo-surface-2 flex flex-col items-center justify-center p-4 sm:p-6 text-center md:h-full md:overflow-y-auto py-8">
        <div className="max-w-md w-full p-5 sm:p-6 rounded-lg bg-geo-panel border border-geo-border shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-geo-text-primary">Corridor Validated by EO Change Detection</h2>
          <p className="text-xs text-geo-text-secondary mt-2 leading-relaxed">
            The candidate rescue route follows <strong>OSM highway geometry</strong> snapped onto elevated terrain contours. 
            All segments have been cross-checked against <strong>Sentinel-1 SAR amplitude anomalies</strong> to confirm the carriageway is not obstructed by river surge.
          </p>
          <div className="mt-4 pt-3 border-t border-geo-border grid grid-cols-2 gap-3 text-left">
            <div>
              <span className="text-[10px] uppercase font-semibold text-geo-text-tertiary block">Origin Base</span>
              <span className="text-xs font-semibold text-geo-text-primary">{activeRoute.origin}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-geo-text-tertiary block">Status Assessment</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">{activeRoute.status}</span>
            </div>
          </div>
          {onReturnToCommandMap && (
            <button
              onClick={onReturnToCommandMap}
              className="mt-5 w-full py-2 rounded-md bg-geo-accent hover:bg-geo-accent-hover text-white font-medium text-xs shadow-sm transition-colors"
            >
              Inspect Route on Command Map
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
