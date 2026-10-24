// Scene 3, our solution, NADI (then a music-only tail before Luqman).
// Three live factors and one trained model merge into one four-level warning. The phone shows real app captures
// (assets/app: home, map, route); the right column lists what residents see, ending with the Telegram text the
// backend sends (vision/alerts.py). The bottom-right corner stays clear for the presenter video.
import { el, svgEl, show, eio, eout, draw, icon, chapter, animChapter } from '../lib.js';

export const LADDER = [
  ['Normal', '#16A34A', 'App shows green'],
  ['Advisory', '#EAB308', 'Check the route'],
  ['Warning', '#F97316', 'Push alert, route ready'],
  ['Danger', '#DC2626', 'Evacuate to the nearest open shelter'],
];
const ROWS_T = [5.0, 5.6, 6.3, 7.0];
const CHIP_W = 196, CHIP_GAP = 18;
const chipX = (i) => i * (CHIP_W + CHIP_GAP) + CHIP_W / 2;      // chip centres, relative to x = 96
const MID = (4 * CHIP_W + 3 * CHIP_GAP) / 2;

export default {
  id: 's03', title: 'Our solution', dur: 20,
  async build(root) {
    const ch = chapter(root, '03', 'Our solution');
    const head = el('div', 'h1 s3-head', 'One system. One clear warning.', root);
    const inputs = el('div', 's3-inputs', '', root);
    const IN = [['river', 'River node'], ['camera', 'Street camera'], ['rain', 'Forecast'], ['chip', 'Trained model']];
    const chips = IN.map(([ic, name], i) => el('div', 's3-in' + (i === 3 ? ' base' : ''), `${icon(ic, 28, '#1677FF')}<span>${name}</span>`, inputs));
    const brA = el('div', 's3-brace', '<i></i><span>3 live factors</span>', root);
    const brB = el('div', 's3-brace b', '<i></i><span>1 trained model</span>', root);
    const merge = svgEl('svg', { width: 900, height: 120, viewBox: '0 0 900 120', class: 'abs s3-merge' }, root);
    const mpaths = [0, 1, 2, 3].map((i) => svgEl('path', { d: `M${chipX(i)} 0 C${chipX(i)} 60 ${MID} 40 ${MID} 92`, fill: 'none', stroke: '#1677FF',
      'stroke-width': 3, 'stroke-dasharray': i === 3 ? '7 6' : 'none' }, merge));
    const fusion = el('div', 'pill dark s3-fusion', `${icon('merge', 26, '#fff')}<span>Fusion rules</span>`, root);
    const ladder = el('div', 's3-ladder', '', root);
    const rows = LADDER.map(([name, c, action]) => el('div', 's3-row', `<i style="background:${c}"></i><b>${name}</b><code>${c}</code><span>${action}</span>`, ladder));

    // phone with real app captures
    const ph = el('div', 'phone s3-phone', '<div class="phone-screen"></div><div class="phone-island"></div>', root);
    const scr = ph.querySelector('.phone-screen');
    scr.style.cssText = 'width:390px;height:844px;';
    const shots = ['home', 'map', 'map-route'].map((n) => { const im = el('img', 'phone-img', null, scr); im.src = `assets/app/${n}.png`; return im; });
    const banner = el('div', 's3-banner', `<div class="s1-app"><img src="assets/logo.svg" alt=""></div>
      <div><div class="s1-nh">FloodWay · now</div><div class="s1-nt">WARNING · Kampung Baru Drain</div><div class="s1-nb">Water at 78% of bank height.</div></div>`, scr);
    const seeHead = el('div', 'label s3-seeh', 'What residents see', root);
    const SEE = [['map', 'A map colour', 8.4], ['route', 'A route around flooded roads', 11.2], ['bell', 'A push alert or a Telegram message', 13.8]];
    const see = SEE.map(([ic, txt, t], i) => {
      const n = el('div', 's3-see', `<span class="s3-n">${i + 1}</span>${icon(ic, 26, '#1677FF')}<span>${txt}</span>`, root);
      n.style.top = 180 + i * 74 + 'px';
      return [n, t];
    });
    const tg = el('div', 's3-tg', `<div class="s3-tgh">Telegram · FloodWay bot</div>
      <div class="s3-tgb"><b>FloodWay WARNING</b><br>Kampung Baru Drain<br>Water at 78% of bank height.<br>Open FloodWay to see evacuation routes.<small>18:42</small></div>`, root);
    const pilot = el('div', 'pill s3-pilot', `${icon('pin', 26, '#003EB3')}<span><b>Proposed pilot township:</b> Bandar Bukit Raja, Klang · subject to SDP agreement</span>`, root);

    return {
      cues: [[0.8, 'tick'], [1.2, 'tick'], [1.6, 'tick'], [2.2, 'tick'], [2.7, 'whoosh', { gain: 0.5 }], [3.4, 'whoosh'],
        ...ROWS_T.map((t, i) => [t, 'chime', { notes: [72 + [0, 4, 7, 12][i]] }]), ...SEE.map(([, , t]) => [t, 'tick', { gain: 0.6 }]),
        [13.6, 'ping'], [15.0, 'pop'], [16.4, 'drop']].map(([t, kind, o]) => ({ t, kind, ...(o || {}) })),
      frame(t) {
        animChapter(ch, t, 20);
        const out = { tout: 19.7, dout: 0.3 };
        show(head, t, 0.3, { d: 0.55, ...out });
        chips.forEach((c, i) => show(c, t, [0.8, 1.2, 1.6, 2.2][i], { d: 0.4, y: 18, ...out }));
        show(brA, t, 2.0, { d: 0.4, y: 0, ...out });
        show(brB, t, 2.4, { d: 0.4, y: 0, ...out });
        mpaths.forEach((p, i) => draw(p, eout(t, 2.7 + i * 0.08, 3.4 + i * 0.08)));
        merge.style.opacity = (1 - eio(t, 19.4, 19.7)).toFixed(3);
        show(fusion, t, 3.4, { d: 0.4, y: 0, s: 0.85, ...out });
        rows.forEach((r, i) => show(r, t, ROWS_T[i], { d: 0.35, x: -30, y: 0, ...out }));
        // phone: home (warning card) -> map colour -> route; then the push banner
        show(ph, t, 3.4, { d: 0.7, y: 120, ...out });
        shots[0].style.opacity = 1;
        shots[1].style.opacity = eio(t, 8.2, 8.7).toFixed(3);
        shots[2].style.opacity = eio(t, 11.0, 11.5).toFixed(3);
        show(banner, t, 13.6, { d: 0.45, y: -90 });
        show(seeHead, t, 8.0, { d: 0.4, y: 8, ...out });
        see.forEach(([n, ts]) => show(n, t, ts, { d: 0.4, x: 24, y: 0, ...out }));
        show(tg, t, 15.0, { d: 0.45, y: 20, s: 0.94, ...out });
        show(pilot, t, 16.4, { d: 0.5, y: 18, ...out });
      },
    };
  },
};
