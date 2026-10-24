// Scene 7, trained model, honest reading (2:40 to 3:27), NADI then TISYA.
// The GINKGO Model 1 benchmark table, recreated from the team's slide with every figure as reported, under a banner
// that says so. Then how the scores were measured (random pixel split) and the re-test (held-out areas).
// The plan asks for no sound effects under this scene.
import { el, svgEl, show, lerp, prog, eio, eout, ease, rng, icon, chapter, animChapter } from '../lib.js';

// as reported on the GINKGO "AI Model 1" slide; do not edit without the training report
const ROWS = [
  ['Gradient Boosting (Hist)', '99.62%', '99.33%', '99.33%', '99.33%', '190.7 KB', '125.34 ms', '2.8569 s'],
  ['Random Forest', '99.40%', '98.89%', '99.01%', '98.95%', '2361.4 KB', '129.35 ms', '0.2389 s'],
  ['Decision Tree', '99.38%', '98.69%', '99.15%', '98.92%', '34.0 KB', '8.59 ms', '0.0908 s'],
  ['Logistic Regression', '78.33%', '66.18%', '49.21%', '56.45%', '0.9 KB', '5.06 ms', '0.2046 s'],
];
const HEAD = ['Classifier', 'Accuracy', 'Precision', 'Recall', 'F1', 'Model size', 'Latency (100k px)', 'Training time'];

function grid(parent, R, blocks) {
  // terrain-like cells; a dot per cell says train (blue) or test (orange)
  const NX = 26, NY = 6, S = 30;
  const svg = svgEl('svg', { width: NX * S, height: NY * S, viewBox: `0 0 ${NX * S} ${NY * S}`, class: 's7-grid' }, parent);
  const dots = [];
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
    const v = 0.5 + 0.35 * Math.sin(i / 3.1 + j / 2.3) + 0.15 * Math.sin(i / 1.3 - j);
    const g = Math.round(lerp(170, 120, v)), r = Math.round(lerp(150, 120, v)), b = Math.round(lerp(120, 90, v));
    svgEl('rect', { x: i * S, y: j * S, width: S, height: S, fill: `rgb(${r},${g},${b})` }, svg);
    const test = blocks ? blocks.some(([x0, y0, x1, y1]) => i >= x0 && i < x1 && j >= y0 && j < y1) : R() < 0.22;
    dots.push({ i, j, n: svgEl('circle', { cx: i * S + S / 2, cy: j * S + S / 2, r: 0, fill: test ? '#F97316' : '#1677FF', stroke: '#fff', 'stroke-width': 1.5 }, svg) });
  }
  if (blocks) blocks.forEach(([x0, y0, x1, y1]) => svgEl('rect', { x: x0 * S, y: y0 * S, width: (x1 - x0) * S, height: (y1 - y0) * S, fill: 'none', stroke: '#F97316', 'stroke-width': 4, class: 's7-block' }, svg));
  return { svg, dots };
}

export default {
  id: 's07', title: 'Trained model, honest reading', dur: 47,
  async build(root) {
    const ch = chapter(root, '07', 'Trained model, honest reading');
    const title = el('div', 's7-title', `<div class="h2">AI Model 1 · flood susceptibility benchmark</div>
      <div class="small">As reported in the GINKGO training report (PLAN-AI 2026)</div>`, root);
    const tbl = el('div', 's7-table', `<div class="s7-tr s7-th">${HEAD.map((h) => `<div>${h}</div>`).join('')}</div>
      ${ROWS.map((r) => `<div class="s7-tr">${r.map((c, i) => `<div class="${i ? 'num' : ''}">${c}</div>`).join('')}</div>`).join('')}`, root);
    const trs = [...tbl.querySelectorAll('.s7-tr')];
    const ringRow = el('div', 's7-ring', '', tbl), ringAcc = el('div', 's7-ring', '', tbl), ringF1 = el('div', 's7-ring', '', tbl);
    const tagAcc = el('div', 'pill s7-tag', 'Accuracy, as reported', tbl), tagF1 = el('div', 'pill s7-tag', 'F1, as reported', tbl);
    const banner = el('div', 's7-banner', `<i></i><span>Reported figures from GINKGO training report. Re-test in progress.</span>`, root);

    const R = rng(7);
    const pa = el('div', 'card s7-panel', `<div class="s7-pt">${icon('layers', 30, '#B45309')}<span>How the scores were measured</span></div><div class="s7-gw"></div>
      <div class="s7-pc"><b>Random split by pixel.</b> Neighbouring pixels look almost the same, so test pixels sit beside their training twins. The scores are probably too high.</div>`, root);
    const pb = el('div', 'card s7-panel', `<div class="s7-pt">${icon('shield', 30, '#15803D')}<span>The re-test: whole areas held out</span></div><div class="s7-gw"></div>
      <div class="s7-pc"><b>Test on areas the model never saw.</b> These figures will be replaced with the held-out results.</div>`, root);
    pa.style.left = '96px'; pb.style.left = '972px';
    const gA = grid(pa.querySelector('.s7-gw'), R, null);
    const gB = grid(pb.querySelector('.s7-gw'), R, [[3, 0, 9, 4], [16, 2, 22, 6]]);
    const keyA = el('div', 's7-key', `<span><i style="background:#1677FF"></i>training pixel</span><span><i style="background:#F97316"></i>test pixel</span>`, pa);
    const mag = el('div', 's7-mag', '<div></div><span>neighbours look the same</span>', pa);
    const stmt = el('div', 's7-stmt', `${icon('warn', 40, '#B45309', 2.4)}<span>Random pixel split. Re-test on held-out areas.</span>`, root);
    const rf = el('div', 's7-rf', `<div><div class="label">Rainfall trigger · Random Forest</div><div class="small">on a first split</div></div>
      <div class="s7-rfn num">74.55%</div>`, root);
    let geo = null;

    return {
      cues: [],
      activate() {
        tbl.style.transform = 'none';
        trs.forEach((r) => { r.style.transform = 'none'; });
        const tr0 = trs[1].getBoundingClientRect(), tb = tbl.getBoundingClientRect();
        const cell = (row, col) => trs[row].children[col].getBoundingClientRect();
        const rel = (r) => ({ x: r.left - tb.left, y: r.top - tb.top, w: r.width, h: r.height });
        geo = { row: rel(tr0), acc: rel(cell(1, 1)), f1: rel(cell(1, 4)) };
        const place = (n, g, pad) => { n.style.left = g.x - pad + 'px'; n.style.top = g.y - pad + 'px'; n.style.width = g.w + 2 * pad + 'px'; n.style.height = g.h + 2 * pad + 'px'; };
        place(ringRow, geo.row, 4); place(ringAcc, geo.acc, 2); place(ringF1, geo.f1, 2);
        tagAcc.style.left = geo.acc.x - 10 + 'px'; tagAcc.style.top = geo.acc.y - 50 + 'px';
        tagF1.style.left = geo.f1.x - 10 + 'px'; tagF1.style.top = geo.f1.y - 50 + 'px';
      },
      frame(t) {
        animChapter(ch, t, 47);
        const out = { tout: 46.7, dout: 0.3 };
        show(title, t, 0.6, { d: 0.5, tout: 15.6, dout: 0.4 });
        trs.forEach((r, i) => show(r, t, 1.8 + i * 0.3, { d: 0.4, y: 14, ...out }));
        // three-second highlights: the top row, then accuracy, then F1
        ringRow.style.opacity = (eout(t, 7.5, 7.8) * (1 - eio(t, 10.2, 10.5))).toFixed(3);
        ringAcc.style.opacity = (eout(t, 9.0, 9.3) * (1 - eio(t, 11.7, 12.0))).toFixed(3);
        ringF1.style.opacity = (eout(t, 11.6, 11.9) * (1 - eio(t, 14.3, 14.6))).toFixed(3);
        tagAcc.style.opacity = ringAcc.style.opacity;
        tagF1.style.opacity = ringF1.style.opacity;
        // the table steps up and shrinks to make room for the method
        const pm = eio(t, 15.2, 16.0);
        tbl.style.transform = `translateY(${lerp(0, -146, pm).toFixed(1)}px) scale(${lerp(1, 0.62, pm).toFixed(4)})`;
        show(banner, t, 1.2, { d: 0.5, y: 20, ...out });
        show(pa, t, 16.2, { d: 0.5, y: 24, ...out });
        gA.dots.forEach((d) => d.n.setAttribute('r', (7 * eout(t, 17.0 + (d.i * 6 + d.j) * 0.009, 17.4 + (d.i * 6 + d.j) * 0.009)).toFixed(2)));
        show(keyA, t, 17.6, { d: 0.4, y: 0, ...out });
        show(mag, t, 20.4, { d: 0.45, y: 0, s: 0.6, tout: 26.8 });
        show(pb, t, 27.4, { d: 0.5, y: 24, ...out });
        gB.dots.forEach((d) => d.n.setAttribute('r', (7 * eout(t, 28.0 + (d.i * 6 + d.j) * 0.009, 28.4 + (d.i * 6 + d.j) * 0.009)).toFixed(2)));
        gB.svg.querySelectorAll('.s7-block').forEach((b) => b.setAttribute('opacity', eout(t, 29.6, 30.2).toFixed(3)));
        show(stmt, t, 32.0, { d: 0.5, y: 16, tout: 35.9, dout: 0.35 });
        show(rf, t, 36.2, { d: 0.5, y: 16, ...out });
      },
    };
  },
};
