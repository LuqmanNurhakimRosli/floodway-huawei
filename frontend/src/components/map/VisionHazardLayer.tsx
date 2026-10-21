import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { Circle, Marker, Popup, useMap } from 'react-leaflet';
import { Link, useSearchParams } from 'react-router-dom';
import { Video } from 'lucide-react';
import { useVisionHazards } from '../../hooks/vision/useVisionHazards';
import { useVisionStore } from '../../hooks/vision/useVisionStore';
import { isSampleCamera } from '../../lib/home';
import { LEVEL_META } from '../../lib/vision/levels';
import { cameraPhotoUrl } from '../../lib/vision/samplePhoto';
import type { Camera } from '../../types/vision';
import { StatusChip } from '../live/shared/StatusChip';
import { useZoom } from './BaseMap';

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** A CCTV-style pin: the camera's latest picture framed in its level colour, with the water reading on it. Smaller below street zoom. */
function cameraIcon(c: Camera, src: string | null, compact: boolean): L.DivIcon {
  const r = c.reading!;
  const hex = LEVEL_META[r.level].hex;
  const pic = src ? `<img src="${escapeAttr(src)}" alt="" draggable="false" />` : '<span class="cam-pin-empty"></span>';
  return new L.DivIcon({
    className: 'cam-pin-wrap',
    html: `<div class="cam-pin${r.level === 'DANGER' ? ' is-danger' : ''}${compact ? ' is-compact' : ''}" style="--lvl:${hex}">${pic}<span class="cam-pin-badge">${Math.round(r.water_ratio * 100)}%</span></div>`,
    iconSize: compact ? [44, 40] : [64, 58],
    iconAnchor: compact ? [22, 40] : [32, 58],
    popupAnchor: [0, compact ? -36 : -54],
  });
}

/**
 * Drop-in child for a <MapContainer>. Puts every online camera on the map as a picture pin (tap for a larger photo and
 * a link to its feed), draws a flood zone around every camera at WARNING or DANGER, and, when the page was opened with
 * ?focus=<cameraId> (from the Live Vision "Show evacuation routes" button), flies the map to that camera.
 */
export function VisionHazardLayer() {
  const map = useMap();
  const compact = useZoom() < 14;
  const hazards = useVisionHazards();
  const { cameras, status, usingMock } = useVisionStore();
  const live = status === 'ready' && !usingMock;
  const [params] = useSearchParams();
  const focusId = params.get('focus');

  useEffect(() => {
    if (!focusId) return;
    const cam = cameras.find((c) => c.id === focusId);
    if (cam) map.flyTo([cam.lat, cam.lon], 15, { duration: 1.2 });
    // only re-run when the requested camera changes, not on every reading
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, cameras.length > 0]);

  const pins = useMemo(
    () => cameras.filter((c) => c.online && c.reading).map((c) => {
          const src = cameraPhotoUrl(c, live);
          return { c, src, icon: cameraIcon(c, src, compact) };
        }),
    [cameras, live, compact],
  );

  return (
    <>
      {hazards.map((h) => (
        <Circle
          key={h.cameraId}
          center={[h.lat, h.lon]}
          radius={h.radiusM}
          interactive={false}
          // Solid outline and a stronger fill: camera zones read as "live from a camera", unlike the dashed demo basins.
          pathOptions={{ color: LEVEL_META[h.level].hex, fillColor: LEVEL_META[h.level].hex, fillOpacity: h.level === 'DANGER' ? 0.3 : 0.22, weight: 2 }}
        />
      ))}
      {pins.map(({ c, src, icon }) => {
        const r = c.reading!;
        return (
          <Marker key={c.id} position={[c.lat, c.lon]} icon={icon} zIndexOffset={r.level === 'DANGER' ? 400 : 200} keyboard title={`${c.name}: ${LEVEL_META[r.level].label}`}>
            <Popup className="cam-popup" minWidth={240} maxWidth={260}>
              <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-800">
                {src && <img src={src} alt={`Camera view of ${c.name}`} className="h-full w-full object-cover" />}
                <span className="absolute right-2 top-2"><StatusChip level={r.level} /></span>
                {isSampleCamera(c) && <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/75 px-2 py-0.5 text-xs font-semibold text-white">Sample</span>}
              </div>
              <p className="mt-2.5 font-heading text-base/5 font-bold text-slate-900">{c.name}</p>
              <p className="mt-1 text-sm/5 text-slate-600">
                Water at <b className="tabular-nums text-slate-900">{Math.round(r.water_ratio * 100)}%</b> of bank height.
                {r.level === 'WARNING' || r.level === 'DANGER' ? ' Routes go around this area.' : ''}
              </p>
              <Link to={`/live?camera=${encodeURIComponent(c.id)}`} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0958D9] text-sm font-bold !text-white hover:bg-[#003EB3]">
                <Video className="h-4 w-4" aria-hidden="true" /> Watch camera
              </Link>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
