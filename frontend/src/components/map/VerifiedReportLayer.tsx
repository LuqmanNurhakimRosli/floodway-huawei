import { Circle, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import type { CitizenReport } from '../../types';
import { areaAge, areaLabel, buildVerifiedAreas, countsNow, isVerified } from '../../lib/verifiedReports';
import { reportStatusInfo } from '../../lib/reportStatus';
import { LABEL_MIN_ZOOM, useZoom } from './BaseMap';

/** Colour by depth, as on the flood layer: amber shallow, red at danger depth. */
const TONE = { amber: '#D97706', red: '#DC2626' } as const;

/**
 * Citizen reports on the map. Verified reports become a circle sized and shaded by the rules in lib/verifiedReports.ts.
 * Every report also gets a small pin: verified ones in their depth colour, unverified ones in grey, so a rumour is
 * visible as a pin but never paints an area.
 */
export function VerifiedReportLayer({ reports, now }: { reports: CitizenReport[]; now: number }) {
  const areas = buildVerifiedAreas(reports, now);
  const zoom = useZoom();

  return (
    <>
      {areas.map((a) => {
        const color = TONE[a.tone];
        return (
          <Circle
            key={a.id}
            center={[a.lat, a.lon]}
            radius={a.radiusM}
            pathOptions={{ color, weight: 2, opacity: 0.85 * a.freshness, fillColor: color, fillOpacity: (0.12 + 0.38 * a.intensity) * a.freshness, dashArray: a.freshness < 1 ? '6 6' : undefined }}
          >
            {/* on the circle when zoomed in; on hover or tap when the whole city is in view */}
            <Tooltip key={zoom >= LABEL_MIN_ZOOM ? 'on' : 'off'} permanent={zoom >= LABEL_MIN_ZOOM} direction="center" className="fw-area-label">
              {areaLabel(a)}
            </Tooltip>
            <Popup>
              <div className="p-1 text-xs">
                <b className="block text-slate-900">Verified flood reports nearby</b>
                <span className="block font-semibold text-slate-700">{areaLabel(a)}</span>
                <span className="block text-slate-600">{areaAge(a, now)}. Routes avoid this area.</span>
                <span className="mt-1 block text-slate-600">Built from verified citizen reports. Not an official flood map.</span>
              </div>
            </Popup>
          </Circle>
        );
      })}

      {reports.filter((r) => r.status !== 'REJECTED').map((r) => {
        // a verified report too old to count is drawn like any other report, without its area
        const verified = isVerified(r) && countsNow(r, now);
        const color = verified ? TONE[r.waterDepthCm >= 30 ? 'red' : 'amber'] : '#64748B';
        return (
          <CircleMarker key={r.id} center={[r.lat, r.lon]} radius={verified ? 6 : 5} pathOptions={{ color: '#FFFFFF', weight: 2, fillColor: color, fillOpacity: 1 }}>
            <Popup>
              <div className="p-1 text-xs">
                <b className="block text-slate-900">{r.title}</b>
                <span className="block font-semibold text-slate-700">
                  {reportStatusInfo(r.status).pill} · {r.waterDepthCm} cm
                </span>
                <span className="block text-slate-600">{r.location}</span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
