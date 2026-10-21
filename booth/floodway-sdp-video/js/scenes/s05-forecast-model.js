// Scene 5, forecast and base layer, LUQMAN.
// Two factor cards: the forecast says WHEN (open data API), Model 1 says WHERE (a 0 to 100 susceptibility map).
// The chart and the map are illustrative and say so on screen.
import { el, svgEl, show, lerp, prog, eio, eout, rng, icon, chapter, animChapter } from '../lib.js';

const BANDS = [[0, 35, '#86EFAC', 'Low', '0 to 35'], [35, 65, '#FDE047', 'Moderate', '35 to 65'], [65, 101, '#F87171', 'High', '65 to 100']];

export default {
  id: 's05', title: 'Forecast and base layer', dur: 25,
  async build(root) {
    root.classList.add('s5');
    const ch = chapter(root, '06', 'When and where');
    const A = el('div', 'card s5-card', `
      <div class="s5-top"><span class="s5-ic">${icon('rain', 34, '#1677FF')}</span><span class="label">Factor · forecast</span></div>
      <div class="s5-big">WHEN</div>
      <div class="s5-src">MetMalaysia forecasts and warnings, through the national open data API (data.gov.my)</div>
      <div class="s5-chart"></div>
      <div class="s5-warn pill sample">${icon('warn', 22, '#B45309', 2.4)}Heavy rain warning · district level</div>
      <div class="s5-yes">${icon('check', 30, '#16A34A', 3)}<span>Says <b>when</b> heavy rain is coming.</span></div>
      <div class="s5-no">${icon('x', 30, '#DC2626', 3)}<span>Not which street.</span></div>`, root);
    A.style.left = '96px';
    const B = el('div', 'card s5-card', `
      <div class="s5-top"><span class="s5-ic">${icon('chip', 34, '#1677FF')}</span><span class="label">Base layer · trained model</span></div>
      <div class="s5-big">WHERE</div>
      <div class="s5-src">Model 1 scores each part of the township from 0 to 100.</div>
      <div class="s5-heat"></div>
      <div class="s5-legend">${BANDS.map(([, , c, n, r]) => `<span><i style="background:${c}"></i><b>${n}</b> ${r}</span>`).join('')}</div>
      <div class="s5-capt small">Illustrative map, not model output</div>
      <div class="s5-yes">${icon('check', 30, '#16A34A', 3)}<span>Says <b>where</b> water collects.</span></div>`, root);
    B.style.left = '984px';

    // 24 hourly bars with a heavy-rain spike
    const chart = svgEl('svg', { width: 744, height: 200, viewBox: '0 0 744 200', class: 's5-svg' }, A.querySelector('.s5-chart'));
    chart.setAttribute('height', 170);
    const vals = Array.from({ length: 24 }, (_, i) => 6 + 4 * Math.sin(i * 0.9) + 78 * Math.exp(-Math.pow((i - 15) / 2.6, 2)));
    const bars = vals.map((v, i) => svgEl('rect', { x: 8 + i * 30.5, width: 22, rx: 4, fill: v > 40 ? '#1677FF' : '#9CC3F5', y: 170, height: 0 }, chart));
    svgEl('path', { d: 'M0 172 H744', stroke: '#CFDBEC', 'stroke-width': 2 }, chart);
    [['now', 8], ['+12 h', 374], ['+24 h', 700]].forEach(([s, x]) => { const tx = svgEl('text', { x, y: 196, class: 's5-ax' }, chart); tx.textContent = s; });
    const ctext = svgEl('text', { x: 8, y: 16, class: 's5-ax' }, chart);
    ctext.textContent = 'Rain forecast, next 24 h (illustrative)';

    // a township map: scores rise near a meandering river and in low ground
    const heat = svgEl('svg', { width: 744, height: 230, viewBox: '0 0 744 230', class: 's5-svg' }, B.querySelector('.s5-heat'));
    const R = rng(5), NX = 31, NY = 10, cw = 744 / NX, chh = 230 / NY;
    const cells = [];
    for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
      const ry = 4.6 + 2.2 * Math.sin(i / 4.2) + 0.8 * Math.sin(i / 1.7);        // river centre line, in rows
      const d = Math.abs(j - ry);
      const s = Math.max(0, Math.min(100, 92 - d * 21 + (R() - 0.5) * 18 + (j > 7 ? 6 : 0)));
      const band = BANDS.find(([a, b]) => s >= a && s < b);
      cells.push({ i, j, n: svgEl('rect', { x: i * cw + 1, y: j * chh + 1, width: cw - 2, height: chh - 2, rx: 3, fill: band[2], opacity: 0 }, heat) });
    }
    const riverPts = Array.from({ length: NX + 1 }, (_, i) => `${(i * cw).toFixed(1)},${((4.6 + 2.2 * Math.sin(i / 4.2) + 0.8 * Math.sin(i / 1.7)) * chh + chh / 2).toFixed(1)}`);
    svgEl('polyline', { points: riverPts.join(' '), fill: 'none', stroke: '#2F7BFF', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.85, class: 's5-river' }, heat);
    const river = heat.querySelector('.s5-river');

    const [, , , , warnA, yesA, noA] = [...A.children];
    const [, , , , legendB, captB, yesB] = [...B.children];

    return {
      cues: [[0.3, 'whoosh'], [4.6, 'tick'], [7.2, 'tick', { gain: 0.6 }], [8.4, 'tick', { gain: 0.6 }], [10.8, 'whoosh'], [12.2, 'shimmer', { gain: 0.6 }],
        [17.0, 'tick'], [21.0, 'tick', { gain: 0.6 }]].map(([t, kind, o]) => ({ t, kind, ...(o || {}) })),
      frame(t) {
        animChapter(ch, t, 25);
        const out = { tout: 24.7, dout: 0.3 };
        // the forecast card starts centred, then makes room for the model card
        show(A, t, 0.3, { d: 0.6, x: -90, y: 0, ...out });
        A.style.left = lerp(540, 96, eio(t, 10.3, 11.1)).toFixed(1) + 'px';
        show(B, t, 10.8, { d: 0.6, x: 90, y: 0, ...out });
        bars.forEach((b, i) => {
          const h = vals[i] * 1.9 * eout(t, 1.4 + i * 0.05, 1.9 + i * 0.05);
          b.setAttribute('y', (170 - h).toFixed(1));
          b.setAttribute('height', h.toFixed(1));
        });
        show(warnA, t, 4.6, { d: 0.4, y: 12 });
        show(yesA, t, 7.2, { d: 0.4, x: -16, y: 0 });
        show(noA, t, 8.4, { d: 0.4, x: -16, y: 0 });
        for (const c of cells) c.n.setAttribute('opacity', eout(t, 12.2 + (c.i + c.j * 0.6) * 0.1, 12.6 + (c.i + c.j * 0.6) * 0.1).toFixed(3));
        river.setAttribute('opacity', (0.85 * eout(t, 11.6, 12.2)).toFixed(3));
        show(legendB, t, 17.0, { d: 0.4, y: 10 });
        show(captB, t, 17.4, { d: 0.4, y: 0 });
        show(yesB, t, 21.0, { d: 0.4, x: -16, y: 0 });
      },
    };
  },
};
