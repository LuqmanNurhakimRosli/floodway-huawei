import L from 'leaflet';
import { Circle, Marker, Popup } from 'react-leaflet';
import { useVisionStore } from '../../hooks/vision/useVisionStore';
import type { Barrier } from '../../types/vision';

// Marker: a barrier arm on a post. Raised and green when open, lowered with red and white stripes when closed.
const barrierIcon = (closed: boolean) =>
  new L.DivIcon({
    className: 'barrier-icon',
    html: `
      <div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center"><div style="width:40px;height:40px;border-radius:12px;background:${closed ? '#B91C1C' : '#047857'};border:2px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center">
        <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
          <rect x="3" y="6" width="3" height="16" rx="1" fill="#fff"/>
          ${closed
            ? '<rect x="5" y="9" width="19" height="4" rx="1" fill="#fff"/><rect x="9" y="9" width="3" height="4" fill="#B91C1C"/><rect x="16" y="9" width="3" height="4" fill="#B91C1C"/>'
            : '<rect x="5" y="9" width="17" height="4" rx="1" fill="#fff" transform="rotate(-62 5 11)"/>'}
        </svg>
      </div></div>`,
    iconSize: [44, 44], // a 44px tap area around the 40px badge
    iconAnchor: [22, 22],
  });

const OPEN_ICON = barrierIcon(false);
const CLOSED_ICON = barrierIcon(true);

/** Simulated underpass barriers on the evacuation map. A closed barrier also draws its blocked zone. */
export function BarrierLayer({ onSelect }: { onSelect?: (b: Barrier) => void }) {
  const { barriers } = useVisionStore();
  return (
    <>
      {barriers.map((b) => {
        const closed = b.state === 'CLOSED';
        return (
          <span key={b.id}>
            {closed && (
              <Circle center={[b.lat, b.lon]} radius={b.radius_m} pathOptions={{ color: '#B91C1C', fillColor: '#B91C1C', fillOpacity: 0.18, weight: 2, dashArray: '4 6' }} />
            )}
            <Marker position={[b.lat, b.lon]} icon={closed ? CLOSED_ICON : OPEN_ICON} zIndexOffset={closed ? 800 : 400} eventHandlers={{ click: () => onSelect?.(b) }}>
              <Popup>
                <div className="text-xs">
                  <b className="block text-slate-900">{b.name}</b>
                  <span className={`block font-bold ${closed ? 'text-red-700' : 'text-emerald-700'}`}>
                    {closed ? 'CLOSED: routing avoids this underpass' : 'OPEN'} · {b.mode === 'auto' ? 'automatic' : 'manual override'}
                  </span>
                  <span className="block text-slate-700">{b.reason}</span>
                  <span className="mt-1 block font-semibold text-slate-600">Simulated barrier. No real road barrier is connected.</span>
                </div>
              </Popup>
            </Marker>
          </span>
        );
      })}
    </>
  );
}
