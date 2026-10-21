// Scene 4, how one warning moves (1:00 to 1:30), RAKUMAN.
// The architecture poster (docs/architecture/FloodWay_System_Architecture.html) builds in, arrows 1 to 6 light up in
// order with the two cards each arrow joins, then the fusion rules are spelled out.
import { el, svgEl, show, lerp, prog, eio, eout, ease, draw, icon } from '../lib.js';

const T = [3.2, 7.4, 12.8, 17.0, 18.6, 20.2];            // arrow 1..6 start times, matched to the narration
const ARROWS = [[1, 'cctv', 0.5, 'camera', 0.5, 0.5], [2, 'userapp', 0.5, 'vision', 0.5, 0.3], [3, 'weather', 0.5, 'rain', 0.5, 0.55],
  [4, 'model1', 0.5, 'map', 0.5, 0.5], [5, 'fusion', 0.3, 'route', 0.5, 0.5], [6, 'fusion', 0.7, 'alerts', 0.5, 0.5]];
const RULES_IN = 22.3;
const SCALE = 0.8;                                         // the poster sits top-left at 80%: the presenter corner stays clear
const STEPS = ['A camera sees water cross the painted line.', 'A resident’s photo arrives; a vision model gives an opinion.',
  'The forecast says heavy rain is coming.', 'The map updates.', 'The route avoids the flood.', 'The alert goes out.'];
const ic = (n, s = 26) => icon(n, s, '#1677FF');

export default {
  id: 's04', title: 'How one warning moves', dur: 30,
  async build(root) {
    const poster = el('div', 's4p', `
      <h1 class="ph1">FloodWay: AI-Powered Flood Early Warning, System Architecture and Data Flow</h1>
      <div class="pzones">
        <div class="pzone">
          <div class="pzh">DATA SOURCES</div>
          <section class="pcard" id="s4-userapp"><div class="phd"><span class="ptt">${ic('photo')}User app (Android and web)</span></div>
            <div class="pli">${ic('photo', 24)}Photo</div><div class="pli">${ic('text', 24)}Text description</div><div class="pli">${ic('gps', 24)}GPS location</div><div class="pli">${ic('clock', 24)}Timestamp</div></section>
          <section class="pcard" id="s4-weather"><div class="phd"><span class="ptt">${ic('cloud')}Weather forecast API</span></div><p>(open data)</p><p>Rain forecast for the district</p></section>
          <section class="pcard" id="s4-iot"><div class="phd"><span class="ptt">${ic('river')}IoT river node</span><span class="ptag">Design, build next</span></div>
            <div class="pli">${ic('ping', 24)}Ultrasonic sensor</div><div class="pli">${ic('solar', 24)}Solar panel</div><div class="pli">${ic('signal', 24)}LoRa link</div></section>
          <section class="pcard" id="s4-cctv"><div class="phd"><span class="ptt">${ic('camera')}Street cameras (CCTV)</span><span class="ptag">Sample frames only</span></div></section>
        </div>
        <div class="pzone">
          <div class="pzh">AI PROCESSING LAYER</div>
          <div class="pbackend" id="s4-backend"><div class="pbl">FloodWay backend (Python FastAPI)</div>
            <section class="pcard" id="s4-model1"><div class="phd"><span class="ptt">${ic('chip')}Model 1, flood susceptibility</span><span class="ptag">Re-test pending</span></div>
              <p>Gradient boosting and Random Forest</p><p>Input: Earth Engine satellite and terrain layers</p><p>Output: score 0 to 100 as Low, Moderate, High</p></section>
            <section class="pcard" id="s4-rain"><div class="phd"><span class="ptt">${ic('rain')}Rainfall trigger</span><span class="ptag">Prototype</span></div>
              <p>Random Forest on forecast rain and flood history</p><p>Output: district probability that raises Advisory</p></section>
            <section class="pcard" id="s4-vision"><div class="phd"><span class="ptt">${ic('eye')}Vision check</span><span class="ptag">An opinion, reviewed by a person</span></div>
              <p>Gemini API (Google), multimodal model</p><p>Output: looks like flooding, depth estimate, “AI-generated or edited?” question</p></section>
            <section class="pcard" id="s4-camera"><div class="phd"><span class="ptt">${ic('camera')}Camera analysis</span></div><p>Water-line detection, jump filter, level hysteresis</p></section>
            <section class="pcard pfusion" id="s4-fusion"><div class="phd"><span class="ptt">${ic('merge')}Fusion rules</span></div><p>Any single input can raise a level; two inputs at Warning together raise Danger</p></section>
            <div class="pstore"><div class="pchip">Firebase Auth<small>In use</small></div><div class="pchip">Cloud Firestore<small>In use</small></div><div class="pchip">Cloud Run<small>Planned · API</small></div>
              <div class="pchip">Firebase Hosting<small>Planned · web app</small></div><div class="pchip">Cloud Storage<small>Planned · map tiles</small></div><div class="pchip">Earth Engine<small>Planned · Model 1</small></div></div>
          </div>
        </div>
        <div class="pzone">
          <div class="pzh">OUTPUTS</div>
          <section class="pcard" id="s4-map"><div class="phd"><span class="ptt">${ic('map')}Interactive map</span></div><p>OpenStreetMap, Leaflet</p>
            <svg viewBox="0 0 536 118" width="100%" height="118" style="display:block;margin-top:8px;border-radius:10px"><rect width="536" height="118" fill="#EEF4FD"/>
              ${[[4, 4, '#16A34A'], [92, 4, '#16A34A'], [180, 4, '#EAB308'], [268, 4, '#16A34A'], [356, 4, '#F97316'], [444, 4, '#EAB308'], [4, 62, '#EAB308'], [92, 62, '#F97316'],
                [180, 62, '#F97316'], [268, 62, '#DC2626'], [356, 62, '#F97316'], [444, 62, '#DC2626']].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="${x === 444 ? 88 : 84}" height="52" rx="6" fill="${c}" opacity=".9"/>`).join('')}
              <path d="M0 100 C110 84 170 50 290 58 S450 22 536 14" stroke="#9BD3FF" stroke-width="12" fill="none" stroke-linecap="round"/>
              <circle cx="128" cy="34" r="8" fill="#071426" stroke="#fff" stroke-width="3"/><circle cx="300" cy="92" r="8" fill="#071426" stroke="#fff" stroke-width="3"/><circle cx="460" cy="36" r="8" fill="#071426" stroke="#fff" stroke-width="3"/></svg>
            <p style="margin-top:6px">Colour-coded risk tiles, camera pins</p></section>
          <section class="pcard" id="s4-route"><div class="phd"><span class="ptt">${ic('route')}Route that avoids flooded roads</span></div></section>
          <section class="pcard" id="s4-ladder"><div class="ptt" style="margin-bottom:2px">Four-level warning ladder</div>
            <table><thead><tr><th>Level</th><th>Colour</th><th>Resident action</th></tr></thead><tbody>
              ${[['Normal', '#16A34A', 'App shows green'], ['Advisory', '#EAB308', 'Check the route'], ['Warning', '#F97316', 'Push alert, route ready'], ['Danger', '#DC2626', 'Evacuate to the nearest open shelter']]
                .map(([n, c, a]) => `<tr><td class="plv">${n}</td><td><span class="psw" style="background:${c}"></span><span class="phex">${c}</span></td><td>${a}</td></tr>`).join('')}
            </tbody></table></section>
          <section class="pcard" id="s4-alerts" style="margin-top:auto;margin-bottom:0"><div class="phd"><span class="ptt">${ic('bell')}Alerts</span></div><p>Push (Firebase Cloud Messaging, planned) and Telegram</p></section>
        </div>
      </div>
      <div class="plegend">${['camera reading', 'citizen report', 'forecast', 'map', 'route', 'alert'].map((s, i) => `<span class="plg"><span class="pnum">${i + 1}</span>${s}</span>`).join('')}</div>
      <div class="pfoot">Sample cameras and frames are AI-generated sample imagery. Model 1 accuracy is not shown until it is tested on held-out areas. No live government feed is connected.</div>`, root);
    const arr = svgEl('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, class: 'abs s4-arr' }, poster);
    arr.innerHTML = '<defs><marker id="s4ah" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L12,6 L0,12 z" fill="#1677FF"/></marker></defs>';
    const cards = [...poster.querySelectorAll('.pcard')];
    const zh = [...poster.querySelectorAll('.pzh')];
    const backend = poster.querySelector('.pbackend');
    const chipsS = [...poster.querySelectorAll('.pchip')];
    const title = poster.querySelector('.ph1'), legend = poster.querySelector('.plegend'), foot = poster.querySelector('.pfoot');
    const flows = ARROWS.map(([n]) => {
      const p = svgEl('path', { fill: 'none', stroke: '#1677FF', 'stroke-width': 3.5, 'marker-end': 'url(#s4ah)' }, arr);
      const b = el('div', 'pbadge', String(n), poster);
      return { p, b };
    });
    // the rules panel
    const rules = el('div', 's4-rules', `
      <div class="s4-rt">${icon('merge', 40, '#1677FF')}<span>Fusion rules</span></div>
      <div class="s4-rr"><div class="s4-v"><span class="s4c w">${icon('camera', 24, '#fff')}Camera · Warning</span><i>→</i><span class="s4c up">Level rises one step</span></div>
        <div class="s4-txt">Any single input can raise a level.</div></div>
      <div class="s4-rr"><div class="s4-v"><span class="s4c w">${icon('river', 24, '#fff')}River node · Warning</span><b>+</b><span class="s4c w">${icon('camera', 24, '#fff')}Camera · Warning</span><i>→</i><span class="s4c d">DANGER</span></div>
        <div class="s4-txt">Two inputs at Warning together raise Danger.</div></div>
      <div class="s4-rr"><div class="s4-v"><span class="s4c dk">${icon('river', 24, '#fff')}River above its surveyed danger mark</span><i>→</i><span class="s4c d">DANGER</span></div>
        <div class="s4-txt">On its own, the river at the danger mark raises Danger.</div></div>`, root);
    const ruleRows = [...rules.querySelectorAll('.s4-rr')];
    const steps = el('div', 's4-steps', `<div class="label">One warning, step by step</div>${STEPS.map((s, i) => `<div class="s4-step"><span class="pnum">${i + 1}</span><span>${s}</span></div>`).join('')}`, root);
    const stepRows = [...steps.querySelectorAll('.s4-step')];
    const byId = (id) => poster.querySelector('#s4-' + id);
    let geo = null;

    return {
      cues: [...T.map((t) => [t, 'swoosh']), [T[5] + 0.3, 'low'], [RULES_IN, 'whoosh', { gain: 0.6 }], [23.0, 'tick'], [25.2, 'chime', { notes: [76, 84] }], [27.4, 'chime', { notes: [84] }]]
        .map(([t, kind, o]) => ({ t, kind, ...(o || {}) })),
      activate() {
        // measure the final layout, with every entrance transform (and the poster's own scale) cleared
        poster.style.transform = 'none';
        poster.querySelectorAll('.pcard, .pzh, .pchip, .pbackend').forEach((n) => { n.style.transform = 'none'; });
        geo = ARROWS.map(([n, a, fa, b, fb, tb]) => {
          const ra = byId(a).getBoundingClientRect(), rb = byId(b).getBoundingClientRect();
          const x0 = ra.right + 3, y0 = ra.top + ra.height * fa, x1 = rb.left - 3, y1 = rb.top + rb.height * fb, dx = (x1 - x0) * 0.5;
          const u = 1 - tb;
          return { a, b, d: `M${x0} ${y0} C${x0 + dx} ${y0} ${x1 - dx} ${y1} ${x1} ${y1}`,
            bx: u * u * u * x0 + 3 * u * u * tb * (x0 + dx) + 3 * u * tb * tb * (x1 - dx) + tb * tb * tb * x1,
            by: u * u * u * y0 + 3 * u * u * tb * y0 + 3 * u * tb * tb * y1 + tb * tb * tb * y1 };
        });
        geo.forEach((g, i) => { flows[i].p.setAttribute('d', g.d); flows[i].p.__len = undefined; });
      },
      frame(t) {
        const out = { tout: 29.7, dout: 0.3 };
        show(title, t, 0.1, { d: 0.5, y: -10, ...out });
        zh.forEach((n, i) => show(n, t, 0.35 + i * 0.15, { d: 0.4, y: 12, ...out }));
        show(backend, t, 0.8, { d: 0.5, y: 0, ...out });
        // which arrow is active: from its start until the next one starts (the last three share the final beat)
        let k = -1;
        T.forEach((ts, i) => { if (t >= ts) k = i; });
        const flowDone = t >= 21.8;
        const active = k >= 0 && !flowDone ? (k >= 3 ? [3, 4, 5].filter((i) => t >= T[i]) : [k]) : [];
        const hot = new Set(active.flatMap((i) => [geo?.[i]?.a, geo?.[i]?.b]));
        const rulesOn = eio(t, RULES_IN, RULES_IN + 0.5) * (1 - eio(t, 29.4, 29.8));
        cards.forEach((c, i) => {
          const z = c.closest('.pzone') === poster.querySelectorAll('.pzone')[0] ? 0 : c.closest('.pbackend') ? 1 : 2;
          const op = show(c, t, 0.6 + z * 0.3 + (i % 6) * 0.07, { d: 0.4, y: 18, ...out });
          const id = c.id.replace('s4-', '');
          const isHot = hot.has(id) || (rulesOn > 0 && id === 'fusion');
          const dim = active.length && !isHot ? 0.35 : 1;
          c.style.opacity = (op * dim).toFixed(3);
          c.classList.toggle('phot', isHot);
        });
        chipsS.forEach((c, i) => show(c, t, 1.6 + i * 0.06, { d: 0.35, y: 10, ...out }));
        show(legend, t, 2.0, { d: 0.4, y: 10, ...out });
        show(foot, t, 2.2, { d: 0.4, y: 0, ...out });
        if (geo) flows.forEach((f, i) => {
          const p = eout(t, T[i], T[i] + 0.6);
          draw(f.p, p);
          f.p.style.opacity = (p > 0 ? 1 : 0) * (1 - eio(t, 29.4, 29.8));
          const pb = ease.outQuint(prog(t, T[i] + 0.35, T[i] + 0.7));
          f.b.style.left = geo[i].bx + 'px';
          f.b.style.top = geo[i].by + 'px';
          f.b.style.opacity = (pb * (1 - eio(t, 29.4, 29.8))).toFixed(3);
          f.b.style.transform = `scale(${lerp(0.4, 1, pb).toFixed(3)})`;
          f.b.classList.toggle('on', active.includes(i));
        });
        // rules: the poster steps back, the panel spells the rules out
        poster.style.opacity = (1 - 0.8 * rulesOn).toFixed(3);
        poster.style.transform = `translate(24px, 12px) scale(${(SCALE * (1 - 0.03 * rulesOn)).toFixed(4)})`;
        show(steps.firstChild, t, 2.6, { d: 0.4, y: 8, tout: 29.7 });
        steps.style.opacity = (1 - 0.8 * rulesOn).toFixed(3);
        stepRows.forEach((r, i) => {
          show(r, t, T[i], { d: 0.4, x: 20, y: 0, tout: 29.7 });
          r.classList.toggle('on', active.includes(i));
        });
        show(rules, t, RULES_IN, { d: 0.5, y: 30, s: 0.96, tout: 29.8, dout: 0.35 });
        ruleRows.forEach((r, i) => show(r, t, [23.0, 25.2, 27.4][i], { d: 0.45, x: -24, y: 0 }));
      },
    };
  },
};
