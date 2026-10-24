// Scene 8, working demo (about 82 s), narrated by Luqman (materials-demo/pitch-worflow.mp4, script-demo.md).
// One continuous run of the real app, recorded by capture-demo.mjs in a single browser session (assets/app/demo):
// the alert arrives first, the four factors behind it point at the camera, the resident picks a centre that is not
// full, drives (compressed to five seconds), reports a photo, the AI gives an opinion, an operator verifies and
// adjusts, and the map takes only the human-verified report into account. The AI result on screen is a real call to
// Gemini 2.5 Flash made while recording. Times are scene seconds, matched to the spoken words (scene 0 = narration 1.7 s).
import { el, svgEl, show, lerp, clamp, prog, eio, eout, ease, icon, draw, chapter, animChapter } from '../lib.js';

const D = 'assets/app/demo/';
const DUR = 82;
const PX = 720, PY = 96;                                    // phone frame position; the screen starts 12 px inside
const SX = PX + 12, SY = PY + 12;
const NAV = [51.6, 57.0];
// phone screens, in the order they appear: [capture, from]. The last one with from <= t is on top.
const SCREENS = [['live', 0], ['shelters', 35.2], ['shelter-chosen', 46.0], ['nav', NAV[0]], ['arrived', NAV[1]], ['report-photo', 57.8], ['report-ai-before', 61.0],
  ['report-ai-result', 62.0], ['feed-ai-checked', 68.0], ['operator-desk', 69.4], ['operator-adjust', 71.0], ['feed-human-verified', 73.7], ['map-verified', 76.0]];
// zoom cards: [crop name (meta.json), capture, time in, time out, caption]
const ZOOMS = [
  ['live', 'live', 26.9, 34.6, (m) => `${m.camera}: ${m.level.toLowerCase()}, ${m.pct} of bank. Level and trend from the camera.`],
  ['full', 'shelters', 38.9, 45.6, () => 'The nearest centre is full. The app says so and moves on.'],
  ['chosen', 'shelter-chosen', 46.4, 50.8, () => 'The nearest centre with space. One tap starts turn-by-turn.'],
  ['ai', 'report-ai-result', 62.4, 67.8, () => 'Gemini 2.5 Flash reads the photo and suggests a result, with its own certainty.'],
  ['aipill', 'feed-ai-checked', 68.2, 69.3, () => 'AI CHECKED: it cannot verify or publish alone.'],
  ['adjust', 'operator-adjust', 71.2, 73.4, () => 'The operator checks the evidence, corrects the depth if needed, then presses Verify.'],
  ['humanpill', 'feed-human-verified', 74.0, 76.0, () => 'HUMAN VERIFIED: a person confirmed it.'],
  ['maplabel', 'map-verified', 76.4, 81.0, () => 'Only human-verified reports update the flood map, and routes are recalculated.'],
];
const STEPS = [[0, 'Alert', 'arrives before anything is opened'], [11.4, 'Factors', 'sensors, forecast, mapping, camera'], [26.4, 'Live camera', 'level and trend'],
  [35.2, 'Centre with space', 'open or full status'], [NAV[0], 'Navigate', 'route to the centre'], [57.8, 'Report', 'photo, description, location'],
  [62.0, 'AI check', 'a suggestion, never a verdict'], [69.4, 'Operator verifies', 'adjusts, then Verify or Reject'], [76.0, 'Map updates', 'human-verified reports only']];
// [icon, name, line, status chip, time in]
const FACTORS = [['sensor', 'IoT water depth', 'ultrasonic node at the drain', 'Bench node', 13.9], ['cloud', 'MetMalaysia rainfall', 'heavy-rain forecast by API', 'Planned', 16.2],
  ['merge', 'Exposed-area mapping', 'flood-prone areas of the township', 'Being re-tested', 18.1], ['eye', 'Street camera readings', 'water level from the picture', 'Working', 19.7]];
const TAPS = [[10.5, 195, 100], [34.9, 193, 810], [45.7, 195, 640], [51.3, 195, 737], [57.4, 275, 571], [67.7, 305, 810], [73.2, 162, 705]];
const FAC_OUT = 26.4;

export default {
  id: 's08', title: 'Working demo', dur: DUR,
  async build(root) {
    const meta = await fetch(D + 'meta.json').then((r) => r.json());
    const ch = chapter(root, '08', 'Working demo');
    const ph = el('div', 'phone s8-phone', '<div class="phone-screen"></div><div class="phone-island"></div>', root);
    ph.style.left = PX + 'px'; ph.style.top = PY + 'px';
    const scr = ph.querySelector('.phone-screen');
    scr.style.cssText = 'width:390px;height:844px;';
    const layers = SCREENS.map(([n]) => {
      const w = el('div', 's8-layer', n === 'nav' ? '' : `<img class="phone-img" src="${D}${n}.png" alt="">`, scr);
      if (n === 'nav') w.append(...Array.from({ length: meta.navFrames }, (_, i) => Object.assign(el('img', 'phone-img'), { src: `${D}nav/f${String(i).padStart(2, '0')}.jpg`, alt: '' })));
      return w;
    });
    const navImgs = [...layers[SCREENS.findIndex(([n]) => n === 'nav')].children];
    // lock screen with the alert: the first thing the resident sees
    const lock = el('div', 's8-lock', `<img src="${D}live.png" alt=""><div class="s8-date">Wednesday 21 October</div><div class="s8-clock">20:48</div>
      <div class="s3-banner"><div class="s1-app"><img src="assets/logo.svg" alt=""></div>
      <div><div class="s1-nh">Telegram · now</div><div class="s1-nt">FloodWay ${meta.alert.level}</div><div class="s1-nb">${meta.alert.camera}. Water at ${meta.alert.pct} of bank height. Open FloodWay to see evacuation routes.</div></div></div>`, scr);
    const banner = lock.querySelector('.s3-banner');
    const lines = svgEl('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, class: 'abs s8-lines' }, root);
    // the four factors behind the warning, wired into the camera card
    const head = el('div', 's8-fh', 'What the warning is built from', root);
    const cy = SY + meta.crops.live.y + meta.crops.live.h / 2, tx = SX + meta.crops.live.x;
    const facs = FACTORS.map(([ic, name, sub, tag], i) => {
      const top = 220 + i * 118;
      const card = el('div', 's8-fac', `${icon(ic, 34, '#1677FF')}<div><b>${name}</b><small>${sub}</small></div><span class="pill">${tag}</span>`, root);
      card.style.left = '90px'; card.style.top = top + 'px';
      const y0 = top + 48;
      const path = svgEl('path', { d: `M590 ${y0} C660 ${y0} ${tx - 70} ${cy} ${tx} ${cy}`, fill: 'none', stroke: '#1677FF', 'stroke-width': 3, 'stroke-linecap': 'round' }, lines);
      return { card, path };
    });
    const zooms = ZOOMS.map(([crop, n, , , cap]) => {
      const c = meta.crops[crop], m = Math.min(c.w < 150 ? 3 : 1.4, 440 / c.w);
      const cw = Math.round(c.w * m), chh = Math.round(c.h * m);
      const top = Math.round(clamp(SY + c.y + c.h / 2 - (chh + 76) / 2, 150, 760));
      const card = el('div', 's8-zoom', `<div class="s8-zw" style="width:${cw}px;height:${chh}px"><img src="${D}${n}.png" style="width:${390 * m}px;left:${-c.x * m}px;top:${-c.y * m}px"></div><div class="s8-zc" style="max-width:${Math.max(cw, 360)}px">${cap(meta)}</div>`, root);
      card.style.left = '90px'; card.style.top = top + 'px';
      const frame = el('div', 's8-crop', '', root);
      frame.style.cssText = `left:${SX + c.x}px;top:${SY + c.y}px;width:${c.w}px;height:${c.h}px`;
      const ex = 90 + cw + 22, ey = top + 10 + chh / 2;
      const ln = svgEl('path', { d: `M${ex} ${ey} C${ex + 70} ${ey} ${SX + c.x - 70} ${SY + c.y + c.h / 2} ${SX + c.x} ${SY + c.y + c.h / 2}`, fill: 'none', stroke: '#1677FF', 'stroke-width': 2.5, 'stroke-dasharray': '7 6' }, lines);
      return { card, frame, ln };
    });
    const driveNote = el('div', 's8-zoom', '<div class="s8-zc" style="max-width:420px">Route to the centre. The drive is compressed to five seconds for the film.</div>', root);
    driveNote.style.left = '90px'; driveNote.style.top = '420px';
    const ptag = el('div', 's8-ptag', '<b>AI suggests.</b> A person decides.', root);
    const rail = el('div', 's8-rail', `<div class="label">The workflow</div>${STEPS.map(([, a, b], i) => `<div class="s8-step"><span class="s8-n">${i + 1}</span><div><b>${a}</b><small>${b}</small></div></div>`).join('')}`, root);
    const steps = [...rail.querySelectorAll('.s8-step')];
    const cursor = el('div', 's8-cursor', '<i></i>', root);

    return {
      cues: [[0.2, 'whoosh'], [1.2, 'ping'], ...TAPS.map(([t]) => [t + 0.25, 'click']), ...FACTORS.map(([, , , , t]) => [t, 'pop']),
        [NAV[0] + 0.1, 'whoosh'], [62.0, 'ping'], [68.2, 'pop'], [74.0, 'ping'], [76.2, 'pop']]
        .map(([t, kind, o]) => ({ t, kind, ...(o || {}) })),
      frame(t) {
        animChapter(ch, t, DUR);
        const out = { tout: DUR - 0.3, dout: 0.3 };
        show(ph, t, 0.2, { d: 0.6, y: 60, ...out });
        // screens cross-fade, each drifting up a little like a slow scroll; the nav layer plays its frame sequence
        SCREENS.forEach(([n, a], i) => {
          const b = SCREENS[i + 1]?.[1] ?? DUR;
          layers[i].style.opacity = (i === 0 ? 1 : eio(t, a - 0.15, a + 0.25)).toFixed(3);
          if (n === 'nav') {
            const k = Math.min(meta.navFrames - 1, Math.floor(prog(t, NAV[0], NAV[1]) * meta.navFrames));
            navImgs.forEach((im, j) => { im.style.visibility = j === k ? 'visible' : 'hidden'; });
          } else layers[i].style.transform = `translateY(${(-8 * prog(t, a, b)).toFixed(1)}px)`;
        });
        lock.style.opacity = (1 - eio(t, 10.9, 11.35)).toFixed(3);
        lock.style.visibility = t > 11.4 ? 'hidden' : 'visible';
        show(banner, t, 1.2, { d: 0.5, y: -90 });
        // factors
        show(head, t, 11.9, { d: 0.45, y: 10, tout: FAC_OUT, dout: 0.35 });
        facs.forEach((f, i) => {
          const ti = FACTORS[i][4];
          const op = show(f.card, t, ti, { d: 0.45, x: -30, y: 0, tout: FAC_OUT, dout: 0.35 });
          draw(f.path, eio(t, ti + 0.2, ti + 1.0));
          f.path.setAttribute('opacity', (op > 0.01 ? Math.min(1, op * 1.4) : 0).toFixed(3));
        });
        zooms.forEach((z, i) => {
          const [, , ti, to] = ZOOMS[i];
          const op = show(z.card, t, ti, { d: 0.45, x: -30, y: 0, tout: to, dout: 0.3 });
          z.frame.style.opacity = op.toFixed(3);
          z.ln.setAttribute('opacity', op.toFixed(3));
        });
        show(driveNote, t, NAV[0] + 0.3, { d: 0.45, x: -30, y: 0, tout: NAV[1], dout: 0.3 });
        show(ptag, t, 64.0, { d: 0.5, y: 14, tout: 76.0, dout: 0.4 });
        // step rail: the current step is highlighted, earlier ones are ticked
        show(rail, t, 0.4, { d: 0.5, x: 40, y: 0, ...out });
        let k = 0;
        STEPS.forEach(([ts], i) => { if (t >= ts) k = i; });
        steps.forEach((s, i) => { s.classList.toggle('on', i === k); s.classList.toggle('done', i < k); });
        // cursor: glides to each tap, ripples, then fades
        let cx = SX + 250, cy2 = SY + 560, op = 0, rip = 0;
        for (const [tt, x, y] of TAPS) {
          if (t > tt - 1.2 && t < tt + 0.9) {
            const p = ease.inOut(prog(t, tt - 1.2, tt));
            cx = lerp(SX + 260, SX + x, p); cy2 = lerp(SY + 520, SY + y, p);
            op = Math.min(eout(t, tt - 1.2, tt - 0.9), 1 - eio(t, tt + 0.5, tt + 0.9));
            rip = prog(t, tt, tt + 0.5);
          }
        }
        cursor.style.opacity = op.toFixed(3);
        cursor.style.transform = `translate(${cx - 22}px, ${cy2 - 22}px)`;
        cursor.firstChild.style.transform = `scale(${(1 + 1.6 * rip).toFixed(3)})`;
        cursor.firstChild.style.opacity = (rip > 0 ? 1 - rip : 0).toFixed(3);
      },
    };
  },
};
