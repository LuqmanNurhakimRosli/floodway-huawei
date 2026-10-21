// Scene 10, feasibility, scalability and the proposed pilot, ANIQ.
// Feasible: off-the-shelf parts (blueprint S4 parts list) and a cost bar marked as an estimate before testing
// (parts list RM558 to RM945, prices not yet verified). Scalable: a new township adds nodes, not a new system.
import { el, svgEl, show, lerp, prog, eio, eout, ease, icon, chapter, animChapter } from '../lib.js';

const PARTS = [['board', 'ESP32 LoRa board'], ['sensor', 'Ultrasonic sensor'], ['solar', '6 V solar panel'], ['battery', 'LiFePO4 battery'], ['box', 'IP65 enclosure']];
const MAXRM = 1000, BARW = 790;
const x = (rm) => (rm / MAXRM) * BARW;
// six townships around a shared hub; the first is the pilot
const TOWNS = [[140, 110], [412, 80], [684, 110], [140, 330], [412, 360], [684, 330]];

export default {
  id: 's10', title: 'Feasibility and scalability', dur: 19,
  async build(root) {
    const ch = chapter(root, '10', 'Feasibility and scalability');
    const L = el('div', 's10-col', `<div class="label">Feasible</div><div class="h2">Off-the-shelf parts.<br>Solar powered.</div>
      <div class="s10-parts">${PARTS.map(([ic, n]) => `<div class="s10-part">${icon(ic, 48, '#1677FF', 1.8)}<span>${n}</span></div>`).join('')}</div>
      <div class="s10-cost"><div class="s10-ct">Cost per node</div>
        <div class="s10-track"><div class="s10-range" style="left:${x(558)}px;width:${x(945) - x(558)}px"></div><div class="s10-fill"></div>
          <div class="s10-mark" style="left:${x(1000)}px"><span>under RM1,000</span></div>
          <span class="s10-tk" style="left:${x(558)}px">RM558</span><span class="s10-tk" style="left:${x(945)}px">RM945</span><span class="s10-tk" style="left:0">RM0</span></div>
        <div class="pill sample s10-est">Estimate, before testing · parts list prices still to verify</div></div>`, root);
    L.style.left = '96px';
    const parts = [...L.querySelectorAll('.s10-part')];
    const fill = L.querySelector('.s10-fill'), cost = L.querySelector('.s10-cost'), est = L.querySelector('.s10-est');
    const Rt = el('div', 's10-col', `<div class="label">Scalable</div><div class="h2">A new township adds nodes,<br>not a new system.</div><div class="s10-map"></div>
      <div class="small s10-cap">Open forecast and map data · one shared FloodWay system</div>`, root);
    Rt.style.left = '1000px';
    const svg = svgEl('svg', { width: 824, height: 440, viewBox: '0 0 824 440', class: 's10-svg' }, Rt.querySelector('.s10-map'));
    const hub = svgEl('g', {}, svg);
    hub.innerHTML = '<circle cx="412" cy="220" r="46" fill="#003EB3"/><text x="412" y="227" text-anchor="middle" font-family="Inter" font-size="18" font-weight="800" fill="#fff">FloodWay</text>';
    const links = TOWNS.map(([tx, ty]) => svgEl('path', { d: `M412 220 L${tx} ${ty}`, stroke: '#9CC3F5', 'stroke-width': 3, 'stroke-dasharray': '6 6', opacity: 0 }, svg));
    svg.appendChild(hub);
    const towns = TOWNS.map(([tx, ty], i) => {
      const g = svgEl('g', { opacity: 0 }, svg);
      g.innerHTML = `<rect x="${tx - 92}" y="${ty - 58}" width="184" height="116" rx="18" fill="${i ? '#FFFFFF' : '#E8F1FF'}" stroke="${i ? '#CFDBEC' : '#1677FF'}" stroke-width="${i ? 2 : 3}"/>
        <path d="M${tx - 70} ${ty - 10} H${tx + 70} M${tx - 70} ${ty + 22} H${tx + 70} M${tx - 30} ${ty - 44} V${ty + 44} M${tx + 30} ${ty - 44} V${ty + 44}" stroke="#DCE5F0" stroke-width="5"/>
        <text x="${tx}" y="${ty - 66}" text-anchor="middle" font-family="Inter" font-size="16" font-weight="700" fill="${i ? '#7A8BA3' : '#003EB3'}">${i ? 'Township ' + (i + 1) : 'Pilot township'}</text>`;
      const nodes = [[-48, 6], [8, -26], [52, 30]].map(([dx, dy]) => svgEl('circle', { cx: tx + dx, cy: ty + dy, r: 0, fill: '#16A34A', stroke: '#fff', 'stroke-width': 3 }, g));
      return { g, nodes };
    });
    const pilot = el('div', 'pill s10-pilot', `${icon('pin', 26, '#003EB3')}<span><b>Proposed pilot:</b> Bandar Bukit Raja, Klang · subject to SDP agreement</span>`, root);
    const next = el('div', 's10-next', `<b>Next step</b>${['One pilot township', 'Measured accuracy', 'Measured lead time'].map((s) => `<span>${icon('check', 26, '#fff', 3)}${s}</span>`).join('')}`, root);

    return {
      cues: [[0.3, 'whoosh', { gain: 0.5 }], ...PARTS.map((_, i) => [1.0 + i * 0.45, 'tick']), [3.4, 'rise', { dur: 1.6 }], [5.2, 'tick'],
        [7.0, 'whoosh', { gain: 0.5 }], ...TOWNS.map((_, i) => [10.6 + i * 0.45, 'tick', { gain: 0.6 }]), [13.5, 'pop'], [15.0, 'chime', { notes: [76, 79, 84] }]]
        .map(([t, kind, o]) => ({ t, kind, ...(o || {}) })),
      frame(t) {
        animChapter(ch, t, 19);
        const out = { tout: 18.7, dout: 0.3 };
        show(L.children[0], t, 0.3, { ...out }); show(L.children[1], t, 0.5, { ...out });
        parts.forEach((p, i) => show(p, t, 1.0 + i * 0.45, { d: 0.35, y: 16, s: 0.92, ...out }));
        show(cost, t, 3.0, { d: 0.45, y: 16, ...out });
        // solid to the lowest estimate, then the hatched range up to the highest
        fill.style.width = (x(558) * ease.out(prog(t, 3.4, 4.4))).toFixed(1) + 'px';
        L.querySelector('.s10-range').style.opacity = eout(t, 4.3, 5.0).toFixed(3);
        show(est, t, 5.2, { d: 0.4, y: 10, ...out });
        show(Rt.children[0], t, 7.0, { ...out }); show(Rt.children[1], t, 7.2, { ...out });
        show(Rt.children[2], t, 7.4, { d: 0.5, y: 0, ...out });
        // one township first, larger; then all six around the hub
        const zoom = eio(t, 9.0, 10.2);
        svg.setAttribute('viewBox', `${lerp(40, 0, zoom).toFixed(1)} ${lerp(40, 0, zoom).toFixed(1)} ${lerp(260, 824, zoom).toFixed(1)} ${lerp(139, 440, zoom).toFixed(1)}`);
        towns.forEach((tw, i) => {
          tw.g.setAttribute('opacity', (i === 0 ? eout(t, 7.6, 8.1) : eout(t, 10.4 + i * 0.45, 10.8 + i * 0.45)).toFixed(3));
          tw.nodes.forEach((n, k) => n.setAttribute('r', (9 * eout(t, (i === 0 ? 8.2 : 10.6 + i * 0.45) + k * 0.15, (i === 0 ? 8.5 : 10.9 + i * 0.45) + k * 0.15)).toFixed(2)));
        });
        links.forEach((l, i) => l.setAttribute('opacity', eout(t, 10.2 + i * 0.45, 10.6 + i * 0.45).toFixed(3)));
        hub.setAttribute('opacity', eout(t, 10.0, 10.4).toFixed(3));
        show(Rt.children[3], t, 12.0, { d: 0.4, y: 0, ...out });
        show(pilot, t, 13.5, { d: 0.5, y: 18, ...out });
        show(next, t, 15.0, { d: 0.5, y: 24, ...out });
      },
    };
  },
};
