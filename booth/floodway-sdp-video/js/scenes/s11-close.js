// Scene 11, close, ANIQ's last line, then the credits and the data card.
// FloodWay™ title on navy while Aniq says the tagline; credits (Team LarpGPT, UiTM, FloodWay, Sime Darby Property);
// a wave to the data card (6 s). Agencies are named as text references only: no agency logos (AGENTS.md).
import { el, svgEl, show, lerp, prog, eio, eout, ease, rng, waterPath, logoRow } from '../lib.js';

const LEFT = [['Forecast and warnings', 'MetMalaysia, via the open data API (data.gov.my)'], ['Loss figure', 'DOSM, Special Report on Impact of Floods in Malaysia 2024'],
  ['Official references', 'JPS Public InfoBanjir, NADMA MyDIMS (text references, no endorsement)'], ['News and footage', 'The Star, Astro Awani'],
  ['Map', 'OpenStreetMap'], ['Comparison', 'official help pages and news, checked October 2026']];
const RIGHT = [['Trained models', 'GINKGO report, PLAN-AI 2026; re-test in progress'], ['Street-camera frames', 'AI-generated samples'],
  ['River node', 'design'], ['Relief centres', 'sample data'], ['Training dataset provenance', 'to be confirmed']];
const T = { strip: 1.3, tag: 2.5, up: 6.6, team: 7.0, logos: 7.8, tm: 8.4, wipe: 12.0, card: 12.6 };

export default {
  id: 's11', title: 'Close, credits and data card', dur: 19,
  async build(root) {
    root.style.background = '#071426';
    const R = rng(3);
    const rain = svgEl('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, class: 'abs' }, root);
    const rp = svgEl('path', { stroke: '#5E86C4', 'stroke-width': 1.6, opacity: 0.25, 'stroke-linecap': 'round' }, rain);
    const drops = Array.from({ length: 90 }, () => ({ x: R() * 2100 - 100, y: R() * 1300, sp: 900 + R() * 500, len: 24 + R() * 30 }));
    const title = el('div', 's11-title', `<div class="s1-word"><img src="assets/logo-white.svg" alt=""><span>FloodWay<sup>™</sup></span></div>
      <div class="s11-strip">${['#16A34A', '#EAB308', '#F97316', '#DC2626'].map((c) => `<i style="background:${c}"></i>`).join('')}</div>
      <div class="s11-tag">Four levels. One clear message. Before the water arrives.</div>`, root);
    const strip = [...title.querySelectorAll('.s11-strip i')];
    const tag = title.querySelector('.s11-tag');
    const credits = el('div', 's11-credits', `<div class="label">Made by</div><div class="s11-team">Team LarpGPT</div>
      <div class="s11-names">Nadyie Azil · Luqman Nurhakim · Aniq Ihtisyam<br>Ikmal Danish · Batrisyia Afrina</div>`, root);
    const [cLabel, cTeam, cNames] = credits.children;
    const logos = el('div', 's11-logos', '<div class="small">Sime Darby Property University Hackathon 2026 · Township of Tomorrow</div>', root);
    logoRow(logos, 's11-tl');
    const tm = el('div', 's11-tm', 'FloodWay™ is a trademark of Team LarpGPT · © 2026 Team LarpGPT', root);
    const wipe = svgEl('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, class: 'abs', style: 'z-index:5' }, root);
    const wp = svgEl('path', { fill: '#F4F7FB' }, wipe);
    const card = el('div', 's11-card', `<div class="s11-ch"><img src="assets/logo.svg" alt=""><span class="h2">Data and sources</span></div>
      <div class="s11-cols"><div>${LEFT.map(([k, v]) => `<p><b>${k}:</b> ${v}</p>`).join('')}</div><div>${RIGHT.map(([k, v]) => `<p><b>${k}:</b> ${v}</p>`).join('')}</div></div>
      <div class="s11-foot"><span>Music and sound effects generated in code · FloodWay™ by Team LarpGPT · Sime Darby Property University Hackathon 2026</span></div>`, root);
    logoRow(card.querySelector('.s11-foot'), 's11-fl');
    const items = [...card.querySelectorAll('p')];

    return {
      cues: [[0.0, 'rain', { dur: 12.4, gain: 0.5 }], [0.2, 'shimmer'], ...strip.map((_, i) => [T.strip + i * 0.2, 'tick', { gain: 0.5 }]),
        [T.up, 'whoosh', { gain: 0.5 }], [T.team, 'chime', { notes: [72, 79, 84] }], [T.logos, 'pop'], [T.wipe, 'swoosh'], [T.card, 'chime', { notes: [79, 84] }]]
        .map(([t, kind, o]) => ({ t, kind, ...(o || {}) })),
      frame(t) {
        rp.setAttribute('d', drops.map((d) => {
          const y = ((d.y + d.sp * t) % 1300) - 150;
          return `M${d.x.toFixed(1)} ${y.toFixed(1)}l${(-0.2 * d.len).toFixed(1)} ${d.len.toFixed(1)}`;
        }).join(''));
        rain.style.opacity = (eout(t, 0, 0.6) * (1 - eio(t, T.wipe - 0.2, T.wipe + 0.4))).toFixed(3);
        // title: centre while Aniq speaks, then up to make room for the credits
        const pin = ease.out(prog(t, 0.1, 0.8)), pu = eio(t, T.up, T.up + 0.8);
        title.style.opacity = (pin * (1 - eio(t, T.wipe, T.wipe + 0.4))).toFixed(3);
        title.style.transform = `translateY(${lerp(lerp(20, 0, pin), -150, pu).toFixed(1)}px) scale(${lerp(lerp(0.96, 1, pin), 0.78, pu).toFixed(4)})`;
        strip.forEach((s, i) => { s.style.transform = `scaleX(${ease.outQuint(prog(t, T.strip + i * 0.2, T.strip + 0.5 + i * 0.2)).toFixed(3)})`; });
        tag.style.opacity = (eout(t, T.tag, T.tag + 0.6) * (1 - eio(t, T.up - 0.2, T.up + 0.2))).toFixed(3);
        const co = { tout: T.wipe, dout: 0.4 };
        show(cLabel, t, T.team, { d: 0.4, y: 12, ...co });
        show(cTeam, t, T.team + 0.15, { d: 0.5, y: 24, s: 0.94, ...co });
        show(cNames, t, T.team + 0.4, { d: 0.4, y: 12, ...co });
        show(logos, t, T.logos, { d: 0.5, y: 18, ...co });
        show(tm, t, T.tm, { d: 0.4, y: 0, ...co });
        const pw = eio(t, T.wipe, T.wipe + 0.7);
        wp.setAttribute('d', waterPath(-20, 1940, lerp(1200, -160, pw), 1100, 26, 520, t * 3, 20));
        show(card, t, T.card, { d: 0.6, y: 26 });
        items.forEach((p, i) => show(p, t, T.card + 0.3 + i * 0.07, { d: 0.35, y: 10 }));
      },
    };
  },
};
