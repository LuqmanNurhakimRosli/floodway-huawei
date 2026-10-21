import L from 'leaflet';
import { initials, type FamilyMember, type Risk } from '../../lib/family';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Map pin for a family member: an initials bubble with a tail, a status ring and a battery chip. Styles in index.css. */
export function memberIcon(m: FamilyMember, risk: Risk, selected: boolean): L.DivIcon {
  const state = m.status === 'sos' ? 'sos' : risk === 'flooded' ? 'flooded' : risk === 'near' ? 'near' : 'ok';
  const low = m.battery < 20;
  const label = m.isYou ? 'You' : initials(m.name);
  const moving = (m.speedKmh ?? 0) > 3;
  const bubbleContent = m.avatar
    ? `<img src="${m.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;display:block;" alt="" />`
    : esc(label);
  return new L.DivIcon({
    className: 'fw-member-icon',
    html: `
      <div class="fw-member fw-member--${state}${selected ? ' fw-member--selected' : ''}">
        ${state === 'sos' ? '<span class="fw-member-pulse"></span>' : ''}
        <div class="fw-member-bubble" style="background:linear-gradient(135deg,${m.colors[0]},${m.colors[1]})">${bubbleContent}</div>
        <div class="fw-member-tail"></div>
        ${m.isYou ? '' : `<span class="fw-member-batt${low ? ' fw-member-batt--low' : ''}">${Math.round(m.battery)}%</span>`}
        ${moving ? '<span class="fw-member-moving">▶</span>' : ''}
      </div>`,
    iconSize: [56, 64],
    iconAnchor: [28, 62],
    tooltipAnchor: [0, -60],
  });
}
