import { Circle, Popup } from 'react-leaflet';
import { DANGER_RADIUS_SCALE, FLOOD_PRONE, type FloodProneArea } from '../../data/klDemo';
import type { Zone } from '../../lib/routing';

export type Scenario = 'normal' | 'warning' | 'danger';

export const SCENARIO_COLOR: Record<Scenario, string> = { normal: '#0284C7', warning: '#D97706', danger: '#DC2626' };
const WATCH_SCALE = 0.55;

/** Whether the area is flooded in this scenario, or only on watch (low-lying but dry). */
export function stateOf(area: FloodProneArea, scenario: Scenario): 'flooded' | 'watch' {
  if (scenario === 'danger') return 'flooded';
  if (scenario === 'warning' && area.onset === 'warning') return 'flooded';
  return 'watch';
}

export function radiusOf(area: FloodProneArea, scenario: Scenario): number {
  if (stateOf(area, scenario) === 'watch') return area.radiusM * WATCH_SCALE;
  return area.radiusM * (scenario === 'danger' ? DANGER_RADIUS_SCALE : 1);
}

/** The circles routes must avoid in this scenario. */
export function floodedZones(scenario: Scenario): Zone[] {
  return FLOOD_PRONE.filter((a) => stateOf(a, scenario) === 'flooded').map((a) => ({
    id: a.id,
    lat: a.lat,
    lon: a.lon,
    radiusM: radiusOf(a, scenario),
  }));
}

/** Illustrative flood-prone areas in Kuala Lumpur: dashed when only on watch, stronger when flooded in the scenario. */
export function FloodProneLayer({ scenario }: { scenario: Scenario }) {
  return (
    <>
      {FLOOD_PRONE.map((a) => {
        const flooded = stateOf(a, scenario) === 'flooded';
        const color = flooded ? SCENARIO_COLOR[scenario] : SCENARIO_COLOR.normal;
        return (
          <Circle
            key={a.id}
            center={[a.lat, a.lon]}
            radius={radiusOf(a, scenario)}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: flooded ? (scenario === 'danger' ? 0.22 : 0.2) : 0.08,
              weight: flooded ? 2 : 1.25,
              dashArray: flooded ? undefined : '5 5',
            }}
          >
            <Popup>
              <div className="p-1 text-xs">
                <b className="block text-slate-900">{a.name}</b>
                <span className="block font-semibold text-slate-700">
                  {flooded ? `Flooded in this scenario (${scenario})` : 'Low-lying, on watch (dry in this scenario)'}
                </span>
                <span className="block text-slate-600">{a.note}</span>
                <span className="mt-1 block font-semibold text-slate-600">Illustrative demo area, not an official flood map.</span>
              </div>
            </Popup>
          </Circle>
        );
      })}
    </>
  );
}
