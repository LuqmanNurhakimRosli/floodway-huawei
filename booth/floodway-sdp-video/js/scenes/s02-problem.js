// Scene 2, problem statement, NADI. The loss figure (counted up in s01) stays parked at the top left; one map zooms
// from river basin to district to township to a single underpass: official data is strong at basin and district
// level; a township needs to know which road floods next, and when. timing.json starts this scene 3.9 s in.
import { el, svgEl, show, lerp, clamp, prog, eio, eout, ease, draw, icon, chapter, animChapter, fmt } from '../lib.js';

// zoom keyframes: [time, x, y, width, height] of the map view (world units)
const ZOOM = [[0, 0, 0, 1600, 1200], [6.4, 0, 0, 1600, 1200], [7.6, 470, 330, 660, 495], [9.2, 470, 330, 660, 495],
  [10.4, 690, 520, 240, 180], [11.8, 690, 520, 240, 180], [13.0, 768, 585, 56, 42]];
const STAGES = [[6.0, 'River basin', 'Official forecasts: strong', 'ok'], [7.4, 'District', 'Official bulletins: strong', 'ok'],
  [10.2, 'Township', 'Which road floods next?', 'q'], [12.8, 'Street', 'And when?', 'q']];

export default {
  id: 's02', title: 'Problem', dur: 25,
  async build(root) {
    const ch = chapter(root, '02', 'The problem');
    const counter = el('div', 's2-counter', `
      <div class="s2-clabel">Flood losses in Malaysia, 2024</div>
      <div class="s2-num num">RM<span>0.0</span> million</div>
      <div class="s2-src">Source: DOSM, Special Report on Impact of Floods in Malaysia 2024</div>`, root);
    const numEl = counter.querySelector('.s2-num span');
    const head = el('div', 'h1 s2-head', 'The gap is<br>the last hour.', root);
    const LINES = [[6.6, 'check', '#16A34A', 'Official rainfall and river data are strong at basin and district level.'],
      [10.4, 'q', '#B45309', 'A township needs to know which road or underpass floods next, and when.']];
    const list = el('div', 's2-lines', '', root);
    const rows = LINES.map(([, ic, c, txt]) => el('div', 's2-line', `${icon(ic, 34, c, 2.6)}<span>${txt}</span>`, list));

    // the map card
    const card = el('div', 'card s2-map', '', root);
    const svg = svgEl('svg', { width: 924, height: 600, viewBox: '0 0 1600 1200', preserveAspectRatio: 'xMidYMid slice', class: 'abs' }, card);
    const ns = 'vector-effect="non-scaling-stroke"';
    const river = 'M1520 60 C1380 160 1300 120 1190 230 S1010 360 960 470 S840 560 790 600 S650 690 560 760 S330 860 260 960 S120 1080 60 1150';
    const tribs = ['M1210 220 C1240 330 1330 380 1420 470', 'M960 470 C1030 520 1100 520 1180 600 S1300 720 1380 760',
      'M560 760 C520 650 430 600 360 520 S250 420 180 380', 'M790 600 C860 640 900 700 930 790 S1000 900 1080 960', 'M1040 300 C990 220 900 190 820 140'];
    let blocks = '';
    for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) {
      const x = 700 + i * 24, y = 528 + j * 22;
      if ((i * 7 + j) % 11 === 3) continue;
      blocks += `<rect x="${x + 3}" y="${y + 3}" width="18" height="15" rx="2" fill="#D3DEEB"/>`;
    }
    svg.innerHTML = `
      <rect width="1600" height="1200" fill="#EEF3F9"/>
      <path d="M0 0 H170 C140 220 200 420 150 640 S90 980 130 1200 H0 Z" fill="#DCEAFA"/>
      <g fill="none" stroke="#A8B8CC" stroke-width="2" stroke-dasharray="8 7" ${ns}>
        <path d="M470 330 L1130 300 L1180 640 L1080 830 L620 860 L480 700 Z" ${ns}/>
        <path d="M470 330 L300 120 M1130 300 L1350 90 M1180 640 L1560 700 M1080 830 L1200 1180 M620 860 L420 1180 M480 700 L170 760" ${ns}/>
      </g>
      <path id="s2dist" d="M470 330 L1130 300 L1180 640 L1080 830 L620 860 L480 700 Z" fill="#DCEBFF" opacity="0"/>
      ${tribs.map((d) => `<path d="${d}" fill="none" stroke="#9CC6F5" stroke-width="3.5" stroke-linecap="round" ${ns}/>`).join('')}
      <path d="${river}" fill="none" stroke="#7DB4F2" stroke-width="7" stroke-linecap="round" ${ns}/>
      <g id="s2town">${blocks}
        <path d="M690 548 H920 M690 594 H920 M690 640 H920 M748 520 V700 M820 520 V700 M868 520 V700" stroke="#FFFFFF" stroke-width="3" ${ns}/>
      </g>
      <path d="M766 596 C778 602 786 606 800 612 S814 618 826 622" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" fill="none"/>
      <path d="M806 576 L824 630" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M752 625 L835 585" stroke="#C3D1E3" stroke-width="5.5" stroke-linecap="round"/>
      <path d="M752 625 L835 585" stroke="#AFC0D6" stroke-width="1" stroke-dasharray="2 1.5" ${ns}/>
      <text x="830" y="584" font-family="Inter" font-size="2.2" font-weight="700" fill="#7A8BA3" transform="rotate(-25.7 830 584)">HIGHWAY</text>`;
    const flood = svgEl('ellipse', { cx: 791, cy: 607.5, rx: 0, ry: 0, fill: '#2F7BFF', opacity: 0.5 }, svg);
    const q2 = svgEl('g', { opacity: 0 }, svg);
    q2.innerHTML = `<circle cx="815" cy="594.5" r="3.2" fill="#FFF" stroke="#B45309" stroke-width="0.5" stroke-dasharray="1 .7"/><text x="815" y="596.1" text-anchor="middle" font-family="Inter" font-weight="800" font-size="4.4" fill="#B45309">?</text>`;
    const pins = [[784, 603], [797, 610]].map(([x, y]) => {
      const g = svgEl('g', { opacity: 0 }, svg);
      g.innerHTML = `<path d="M${x} ${y} c-1.4 -1.6 -2.2 -2.6 -2.2 -3.6 a2.2 2.2 0 0 1 4.4 0 c0 1 -.8 2 -2.2 3.6z" fill="#64748B"/><circle cx="${x}" cy="${y - 3.6}" r=".8" fill="#fff"/>`;
      return g;
    });
    const car = svgEl('g', {}, svg);
    car.innerHTML = '<rect x="-1.5" y="-.8" width="3" height="1.6" rx=".45" fill="#003EB3"/><rect x=".25" y="-.6" width=".8" height="1.2" rx=".2" fill="#BFD6FF"/>';
    const stage = el('div', 's2-stage', '<b></b><span class="pill"></span>', card);
    const stB = stage.querySelector('b'), stP = stage.querySelector('.pill');
    const capt = el('div', 's2-capt small', 'Illustrative map', card);

    return {
      cues: [[5.4, 'whoosh'], [6.4, 'zoom'], [9.2, 'zoom'], [11.8, 'zoom'], [14.7, 'drop'], [15.1, 'drop'],
        [16.4, 'water', { dur: 3.5, gain: 0.5 }]].map(([t, kind, o]) => ({ t, kind, ...(o || {}) })),
      frame(t) {
        animChapter(ch, t, 25);
        // counter: parked at the top left
        numEl.textContent = fmt(933.4, 1);
        counter.style.opacity = (eout(t, 3.9, 4.3) * (1 - eio(t, 24.7, 25))).toFixed(3);
        counter.style.transform = 'translate(-612px, -296px) scale(0.42)';
        counter.querySelector('.s2-src').style.opacity = 0.65;
        show(head, t, 4.4, { d: 0.55, tout: 24.7 });
        rows.forEach((r, i) => show(r, t, LINES[i][0], { d: 0.45, x: -20, y: 0, tout: 24.7 }));
        // map
        show(card, t, 5.4, { d: 0.6, x: 80, y: 0, tout: 24.7 });
        let k = 0;
        while (k < ZOOM.length - 1 && t >= ZOOM[k + 1][0]) k++;
        const a = ZOOM[k], b = ZOOM[Math.min(k + 1, ZOOM.length - 1)];
        const p = b === a ? 1 : ease.inOut(prog(t, a[0], b[0]));
        const w = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), p)), h = w * 0.75;
        const cx = lerp(a[1] + a[3] / 2, b[1] + b[3] / 2, p), cy = lerp(a[2] + a[4] / 2, b[2] + b[4] / 2, p);
        svg.setAttribute('viewBox', `${(cx - w / 2).toFixed(3)} ${(cy - h / 2).toFixed(3)} ${w.toFixed(3)} ${h.toFixed(3)}`);
        svg.querySelector('#s2dist').setAttribute('opacity', (0.9 * eio(t, 7.0, 7.8) * (1 - eio(t, 10.0, 10.6))).toFixed(3));
        let s = -1;
        STAGES.forEach(([ts], i) => { if (t >= ts) s = i; });
        if (s >= 0) {
          const [ts, name, chip, kind] = STAGES[s];
          stB.textContent = name;
          stP.innerHTML = `${icon(kind === 'ok' ? 'check' : 'q', 22, kind === 'ok' ? '#15803D' : '#B45309', 2.6)}${chip}`;
          stP.className = 'pill ' + (kind === 'ok' ? 's2-ok' : 's2-q');
          show(stage, t, ts, { d: 0.35, y: 8 });
        } else stage.style.opacity = 0;
        // street level: reports, water in the underpass, a car on its way, and the next underpass in question
        pins.forEach((g, i) => {
          const pp = ease.out(prog(t, 14.7 + i * 0.4, 15.1 + i * 0.4));
          g.setAttribute('opacity', pp.toFixed(3));
          g.setAttribute('transform', `translate(0 ${((1 - pp) * -4).toFixed(2)})`);
        });
        const pf = eio(t, 16.4, 19.8);
        flood.setAttribute('rx', (5.2 * pf).toFixed(2));
        flood.setAttribute('ry', (3.0 * pf).toFixed(2));
        const pcar = eio(t, 17.0, 21.0);
        car.setAttribute('transform', `translate(${lerp(767, 783.2, pcar).toFixed(2)} ${lerp(596.6, 603.9, pcar).toFixed(2)}) rotate(24)`);
        car.setAttribute('opacity', eout(t, 16.6, 17.2).toFixed(3));
        q2.setAttribute('opacity', (eout(t, 20.0, 20.5) * (0.75 + 0.25 * Math.sin(t * 5))).toFixed(3));
        capt.style.opacity = eout(t, 6.2, 6.8).toFixed(3);
      },
    };
  },
};
