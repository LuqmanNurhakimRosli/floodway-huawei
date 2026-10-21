// Scene 8, working demo (3:27 to 3:59), RAKUMAN.
// A phone "screen recording" built from real captures of the app (assets/app, made by capture.mjs), with taps,
// zoom-in cards of the real screen, a step rail, the vision check's output format (illustrative: no AI key was set
// for this recording) and the Telegram text the backend sends (backend/app/vision/alerts.py).
import { el, svgEl, show, lerp, prog, eio, eout, ease, icon, chapter, animChapter } from '../lib.js';

const PX = 200, PY = 96;                                    // phone frame position; the screen starts 12 px inside
const SX = PX + 12, SY = PY + 12;
// screens: [capture, from, to]
const SCREENS = [['live', 0, 7.9], ['report-photo', 7.9, 12.9], ['report-evidence', 12.9, 18.6], ['map-route', 18.6, 32]];
// zoom cards: [capture, crop x, y, w, h in phone px, magnification, card position x, y, time in, time out, caption]
// crops measured on the 390 x 844 captures (gridded check, 2026-10-21)
const ZOOMS = [
  ['live', 16, 400, 358, 128, 1.3, 700, 250, 3.4, 7.7, 'Sample camera at WARNING, with level and trend'],
  ['report-photo', 18, 92, 356, 158, 1.3, 700, 250, 9.0, 12.7, 'A photo, a description and a location'],
  ['report-evidence', 18, 506, 356, 78, 1.3, 700, 250, 15.6, 18.4, 'Other inputs are compared; a person still reviews every report'],
  ['map-route', 10, 655, 370, 117, 1.25, 700, 250, 20.0, 24.2, 'To the nearest relief centre; the app picks the route with the fewest flooded crossings (simulation)'],
];
const STEPS = [[0, 'Live cameras', 'level and trend'], [7.9, 'Citizen report', 'photo, description, location'], [12.9, 'Vision check', 'an opinion, then a person'],
  [18.6, 'Safe route', 'to a relief centre'], [24.6, 'Alert', 'Telegram from the backend']];
const TAPS = [[7.6, 193, 810], [18.3, 118, 810]];

export default {
  id: 's08', title: 'Working demo', dur: 32,
  async build(root) {
    const ch = chapter(root, '08', 'Working demo');
    el('div', 'pill sample s8-tag', 'Sample cameras · AI-generated frames · Sample relief centres', root);
    const ph = el('div', 'phone s8-phone', '<div class="phone-screen"></div><div class="phone-island"></div>', root);
    ph.style.left = PX + 'px'; ph.style.top = PY + 'px';
    const scr = ph.querySelector('.phone-screen');
    scr.style.cssText = 'width:390px;height:844px;';
    const shots = SCREENS.map(([n]) => { const im = el('img', 'phone-img', null, scr); im.src = `assets/app/${n}.png`; return im; });
    const banner = el('div', 's3-banner', `<div class="s1-app"><img src="assets/logo.svg" alt=""></div>
      <div><div class="s1-nh">Telegram · now</div><div class="s1-nt">FloodWay WARNING</div><div class="s1-nb">Kampung Baru Drain. Water at 78% of bank height.</div></div>`, scr);
    const lines = svgEl('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, class: 'abs s8-lines' }, root);
    const zooms = ZOOMS.map(([n, x, y, w, h, m, cx, cy, , , cap]) => {
      const card = el('div', 's8-zoom', `<div class="s8-zw" style="width:${w * m}px;height:${h * m}px"><img src="assets/app/${n}.png" style="width:${390 * m}px;left:${-x * m}px;top:${-y * m}px"></div><div class="s8-zc">${cap}</div>`, root);
      card.style.left = cx + 'px'; card.style.top = cy + 'px';
      const frame = el('div', 's8-crop', '', root);
      frame.style.cssText = `left:${SX + x}px;top:${SY + y}px;width:${w}px;height:${h}px`;
      const ln = svgEl('path', { d: `M${SX + x + w} ${SY + y + h / 2} C${SX + x + w + 60} ${SY + y + h / 2} ${cx - 60} ${cy + (h * m) / 2} ${cx} ${cy + (h * m) / 2}`,
        fill: 'none', stroke: '#1677FF', 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }, lines);
      return { card, frame, ln };
    });
    const ai = el('div', 's8-ai', `<div class="s8-aih">${icon('eye', 28, '#1677FF')}<b>Vision check · Gemini API</b></div>
      <div class="s8-air"><span>Looks like flooding</span><b>yes</b></div>
      <div class="s8-air"><span>Estimated depth</span><b>about 35 cm</b></div>
      <div class="s8-air"><span>Appears authentic</span><b>unsure</b></div>
      <div class="s8-air"><span>Confidence</span><b>0.6</b></div>
      <div class="s8-aif">AI assessment, not an official verification</div>
      <div class="pill sample">Illustrative output format · AI check not run in this recording</div>`, root);
    const tg = el('div', 's3-tg s8-tg', `<div class="s3-tgh">Telegram · FloodWay bot</div>
      <div class="s3-tgb"><b>FloodWay WARNING</b><br>Kampung Baru Drain<br>Water at 78% of bank height.<br>Open FloodWay to see evacuation routes.<small>18:42</small></div>`, root);
    const tgCap = el('div', 'small s8-tgcap', 'Message text from the backend code · sample camera', root);
    const rail = el('div', 's8-rail', `<div class="label">The demo</div>${STEPS.map(([, a, b], i) => `<div class="s8-step"><span class="s8-n">${i + 1}</span><div><b>${a}</b><small>${b}</small></div></div>`).join('')}`, root);
    const steps = [...rail.querySelectorAll('.s8-step')];
    const cursor = el('div', 's8-cursor', '<i></i>', root);

    return {
      cues: [[0.3, 'whoosh'], ...TAPS.map(([t]) => [t + 0.25, 'click']), [13.0, 'ping'], [24.9, 'ping'], [25.6, 'pop']]
        .map(([t, kind, o]) => ({ t, kind, ...(o || {}) })),
      frame(t) {
        animChapter(ch, t, 32);
        const out = { tout: 31.7, dout: 0.3 };
        show(ph, t, 0.2, { d: 0.6, y: 60, ...out });
        show(root.querySelector('.s8-tag'), t, 0.5, { d: 0.4, y: 10, ...out });
        // screens cross-fade; each one drifts up a little, like a slow scroll
        SCREENS.forEach(([, a, b], i) => {
          shots[i].style.opacity = (i === 0 ? 1 : eio(t, a - 0.15, a + 0.25)).toFixed(3);
          shots[i].style.transform = `translateY(${(-10 * prog(t, a, b)).toFixed(1)}px)`;
        });
        show(banner, t, 24.9, { d: 0.45, y: -90 });
        zooms.forEach((z, i) => {
          const [, , , , , , , , ti, to] = ZOOMS[i];
          const op = show(z.card, t, ti, { d: 0.45, x: -30, y: 0, tout: to, dout: 0.3 });
          z.frame.style.opacity = op.toFixed(3);
          z.ln.setAttribute('opacity', op.toFixed(3));
        });
        show(ai, t, 13.4, { d: 0.5, x: 30, y: 0, tout: 18.4, dout: 0.3 });
        show(tg, t, 25.6, { d: 0.5, y: 24, s: 0.95, ...out });
        show(tgCap, t, 26.0, { d: 0.4, y: 0, ...out });
        // step rail: the current step is highlighted, earlier ones are ticked
        show(rail, t, 0.4, { d: 0.5, x: 40, y: 0, ...out });
        let k = 0;
        STEPS.forEach(([ts], i) => { if (t >= ts) k = i; });
        steps.forEach((s, i) => { s.classList.toggle('on', i === k); s.classList.toggle('done', i < k); });
        // cursor: glides to each tap, ripples, then fades
        let cx = SX + 250, cy = SY + 560, op = 0, rip = 0;
        for (const [tt, x, y] of TAPS) {
          if (t > tt - 1.2 && t < tt + 0.9) {
            const p = ease.inOut(prog(t, tt - 1.2, tt));
            cx = lerp(SX + 260, SX + x, p); cy = lerp(SY + 520, SY + y, p);
            op = Math.min(eout(t, tt - 1.2, tt - 0.9), 1 - eio(t, tt + 0.5, tt + 0.9));
            rip = prog(t, tt, tt + 0.5);
          }
        }
        cursor.style.opacity = op.toFixed(3);
        cursor.style.transform = `translate(${cx - 22}px, ${cy - 22}px)`;
        cursor.firstChild.style.transform = `scale(${(1 + 1.6 * rip).toFixed(3)})`;
        cursor.firstChild.style.opacity = (rip > 0 ? 1 - rip : 0).toFixed(3);
      },
    };
  },
};
