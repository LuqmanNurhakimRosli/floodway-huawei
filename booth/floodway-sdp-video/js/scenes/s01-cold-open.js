// Scene 1, cold open, NADI. Night rain on a township street; the news coverage and the DOSM loss figure while Nadi
// says it; the drain overflows, the FloodWay title lands on "We are FloodWay", a phone alert, then a wave wipes to
// the light palette. Times are matched to Nadi's recording (out/narration/transcripts.json). Water is simple shapes.
import { el, svgEl, show, lerp, clamp, rng, eio, eout, prog, ease, waterPath, wavePath, lowerThird, animLowerThird, draw, logoRow, fmt } from '../lib.js';

const T = { news: 4.4, loss: 5.4, lossOut: 11.0, drainFull: 11.6, overflow: 11.7, titleIn: 12.1, titleMove: 14.2, phoneIn: 14.1, notif: 14.7, wipe: 16.0 };

export default {
  id: 's01', title: 'Cold open', dur: 16.8, cls: 'dark',
  async build(root, ctx) {
    root.style.background = '#050D1C';
    const R = rng(11);
    const svg = svgEl('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, class: 'abs' }, root);
    svg.innerHTML = `
      <defs>
        <linearGradient id="s1sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#030914"/><stop offset=".55" stop-color="#0A1D3A"/><stop offset="1" stop-color="#11305A"/></linearGradient>
        <radialGradient id="s1glow"><stop offset="0" stop-color="#FFD58A" stop-opacity=".55"/><stop offset=".35" stop-color="#FFC56A" stop-opacity=".16"/><stop offset="1" stop-color="#FFC56A" stop-opacity="0"/></radialGradient>
        <linearGradient id="s1water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B8BFF" stop-opacity=".95"/><stop offset="1" stop-color="#0A3A8C"/></linearGradient>
        <linearGradient id="s1road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1C2E4A"/><stop offset="1" stop-color="#121F35"/></linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#s1sky)"/>`;
    // far skyline
    let sky = '';
    for (let x = -20; x < 1940;) {
      const w = 60 + R() * 90, h = 120 + R() * 220;
      sky += `<rect x="${x.toFixed(0)}" y="${(640 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="#0A1C37"/>`;
      for (let k = 0; k < 6; k++) if (R() < 0.35) sky += `<rect x="${(x + 8 + R() * (w - 20)).toFixed(0)}" y="${(640 - h + 14 + R() * (h - 40)).toFixed(0)}" width="5" height="7" fill="#5E86C4" opacity=".35"/>`;
      x += w + 6 + R() * 20;
    }
    svgEl('g', {}, svg).innerHTML = sky;
    const flash = svgEl('rect', { width: 1920, height: 700, fill: '#A9C8FF', opacity: 0 }, svg);
    // terrace houses
    let houses = '';
    for (let i = 0, x = -40; x < 1960; i++, x += 182) {
      const h = 150 + R() * 46, top = 700 - h, c = i % 2 ? '#0F2A4E' : '#13335F';
      houses += `<polygon points="${x - 8},${top} ${x + 86},${top - 62} ${x + 180},${top}" fill="${i % 2 ? '#0C2243' : '#0F2A50'}"/>`;
      houses += `<rect x="${x}" y="${top}" width="172" height="${h}" fill="${c}"/>`;
      for (const wx of [x + 28, x + 110]) {
        const lit = R() < 0.6;
        houses += `<rect x="${wx}" y="${top + 38}" width="36" height="44" rx="3" fill="${lit ? '#F6C66E' : '#1D3C69'}" opacity="${lit ? 0.88 : 1}"/>`;
      }
      houses += `<rect x="${x + 68}" y="${700 - 64}" width="36" height="64" fill="#091930"/>`;
    }
    svgEl('g', {}, svg).innerHTML = houses;
    // street lamp and its light
    svgEl('g', {}, svg).innerHTML = `
      <polygon points="1572,356 1628,356 1770,700 1430,700" fill="#FFD58A" opacity=".06"/>
      <rect x="1515" y="330" width="11" height="370" fill="#22385A"/>
      <path d="M1520 336 Q1560 318 1600 342" stroke="#22385A" stroke-width="9" fill="none"/>
      <ellipse cx="1600" cy="348" rx="34" ry="10" fill="#2E4874"/>
      <circle cx="1600" cy="356" r="250" fill="url(#s1glow)"/>`;
    // road, slab, drain
    svgEl('g', {}, svg).innerHTML = `
      <rect x="0" y="700" width="1920" height="80" fill="url(#s1road)"/>
      <rect x="0" y="697" width="1920" height="6" fill="#2E4466"/>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 170 + 30}" y="738" width="90" height="5" rx="2" fill="#3E567C" opacity=".7"/>`).join('')}
      <ellipse cx="1600" cy="742" rx="230" ry="22" fill="#FFD58A" opacity=".13"/>
      <rect x="0" y="780" width="1920" height="300" fill="#16223A"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M0 ${1000 + i * 9} H1920" stroke="#1C2A45" stroke-width="2"/>`).join('')}
      <rect x="260" y="806" width="1400" height="176" fill="#040A15"/>`;
    const drainWater = svgEl('path', { fill: 'url(#s1water)' }, svg);
    const drainLine = svgEl('path', { fill: 'none', stroke: '#9CCBFF', 'stroke-width': 3, opacity: 0.55 }, svg);
    svgEl('g', {}, svg).innerHTML = `
      <rect x="0" y="780" width="1920" height="26" fill="#24344F"/>
      <rect x="240" y="806" width="20" height="196" fill="#24344F"/><rect x="1660" y="806" width="20" height="196" fill="#24344F"/>
      <rect x="240" y="982" width="1440" height="20" fill="#24344F"/>
      <text x="1640" y="1040" text-anchor="end" font-family="Inter" font-size="18" font-weight="700" letter-spacing="3" fill="#5D7BAA">MONSOON DRAIN · CROSS-SECTION</text>
      ${[560, 1290].map((gx) => `<rect x="${gx}" y="779" width="64" height="28" fill="#0B1525"/>${[0, 1, 2, 3, 4].map((k) => `<rect x="${gx + 6 + k * 12}" y="782" width="4" height="22" fill="#33486C"/>`).join('')}`).join('')}`;
    const roadWater = svgEl('path', { fill: '#2F7BFF', opacity: 0 }, svg);
    const roadLine = svgEl('path', { fill: 'none', stroke: '#B5D6FF', 'stroke-width': 2.5, opacity: 0 }, svg);
    const splash = svgEl('g', {}, svg);
    const drops = [];
    for (const gx of [592, 1322]) for (let i = 0; i < 16; i++) {
      const a = (-90 + (R() - 0.5) * 80) * Math.PI / 180, v = 320 + R() * 380;
      drops.push({ x: gx, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 2.5 + R() * 3.5, t0: T.overflow + R() * 0.12, c: svgEl('circle', { fill: '#A8D0FF', r: 0 }, splash) });
    }
    // rain: two depths
    const rainFar = svgEl('path', { stroke: '#8FB4EA', 'stroke-width': 1.6, opacity: 0.28, 'stroke-linecap': 'round' }, svg);
    const rainNear = svgEl('path', { stroke: '#B9D3FA', 'stroke-width': 2.6, opacity: 0.42, 'stroke-linecap': 'round' }, svg);
    const mk = (n, sp0, sp1, l0, l1) => Array.from({ length: n }, () => ({ x: R() * 2200 - 140, y: R() * 1300, sp: sp0 + R() * (sp1 - sp0), len: l0 + R() * (l1 - l0) }));
    const far = mk(130, 1300, 1700, 26, 46), near = mk(55, 1900, 2400, 54, 90);
    const rainD = (list, t) => list.map((d) => {
      const y = ((d.y + d.sp * t) % 1300) - 150, x = d.x - 0.22 * (d.sp * t % 1300) * 0.25;
      return `M${x.toFixed(1)} ${y.toFixed(1)}l${(-0.22 * d.len).toFixed(1)} ${d.len.toFixed(1)}`;
    }).join('');

    // lower third, title, phone
    const lt = lowerThird(root, ctx.team.nadi);
    // the loss figure, with the two news reports that carried it (headline crops from prep_media.py)
    const dim = el('div', 's1-dim', '', root);
    const news = el('div', 's1-news', `<img class="n1" src="out/news/star.jpg" alt=""><img class="n2" src="out/news/awani.jpg" alt="">
      <small>The Star and Astro Awani, 19 March 2025</small>`, root);
    const [n1, n2, nCap] = news.children;
    const loss = el('div', 's1-loss', `<div class="label">Flood losses in Malaysia, 2024</div>
      <div class="s1-lnum">RM<span>0.0</span><small>million</small></div>
      <div class="s1-lsrc">Source: Department of Statistics Malaysia (DOSM), Special Report on Impact of Floods in Malaysia 2024</div>`, root);
    const lossNum = loss.querySelector('.s1-lnum span');
    const scrim = el('div', 's1-scrim', '', root);
    const title = el('div', 's1-title', `
      <div class="s1-word"><img src="assets/logo-white.svg" alt=""><span>FloodWay</span></div>
      <svg class="s1-wave" viewBox="0 0 760 40" width="760" height="40"><path d="${wavePath(10, 750, 20, 9, 140, 0, 6)}" fill="none" stroke="#1677FF" stroke-width="7" stroke-linecap="round"/></svg>
      <div class="s1-sub">Street-level flood early warning for townships</div>`, root);
    const titleWave = title.querySelector('.s1-wave path');
    const titleSub = title.querySelector('.s1-sub');
    const logos = el('div', 's1-logos', '', root);
    logoRow(logos);
    const ph = el('div', 'phone s1-phone', `
      <div class="phone-screen s1-lock">
        <div class="s1-time">6:42</div><div class="s1-day">Heavy rain · 26°</div>
        <div class="s1-notif">
          <div class="s1-app"><img src="assets/logo.svg" alt=""></div>
          <div><div class="s1-nh">FloodWay · now</div><div class="s1-nt">Warning: water rising on your route</div>
          <div class="s1-nb">The underpass ahead is flooding. A safe route is ready.</div></div>
        </div>
      </div><div class="phone-island"></div>`, root);
    const notif = ph.querySelector('.s1-notif');
    const wipeSvg = svgEl('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080, class: 'abs', style: 'z-index:60' }, root);
    const wipePath = svgEl('path', { fill: '#F4F7FB' }, wipeSvg);

    return {
      cues: [[0, 'rain', { dur: 17.0 }], [3.4, 'rumble'], [T.news, 'whoosh', { gain: 0.5 }], [T.news + 0.5, 'tick'], [T.loss, 'count', { dur: 2.4 }],
        [T.loss + 2.4, 'tick'], [T.overflow, 'splash'], [T.titleIn + 0.2, 'shimmer'], [T.notif, 'ping'], [T.wipe, 'swoosh']]
        .map(([t, kind, o]) => ({ t, kind, ...(o || {}) })),
      frame(t) {
        // lightning, far away
        flash.setAttribute('opacity', (0.2 * Math.exp(-Math.pow((t - 3.45) / 0.07, 2)) + 0.1 * Math.exp(-Math.pow((t - 3.62) / 0.05, 2))).toFixed(3));
        // drain fills, then overflows onto the road through the grates
        const yW = lerp(972, 805, Math.pow(prog(t, 0.3, T.drainFull), 1.6));  // slow at first, faster near the top
        drainWater.setAttribute('d', waterPath(260, 1660, yW, 982, 5, 300, t * 2.4));
        drainLine.setAttribute('d', wavePath(260, 1660, yW, 5, 300, t * 2.4));
        const po = eout(t, T.overflow, T.overflow + 0.7);
        const yR = lerp(781, 756, eout(t, T.overflow, T.overflow + 4.7));
        roadWater.setAttribute('d', waterPath(0, 1920, yR, 781, 2.5, 220, t * 1.7, 16));
        roadWater.setAttribute('opacity', (0.78 * po).toFixed(3));
        roadLine.setAttribute('d', wavePath(0, 1920, yR, 2.5, 220, t * 1.7, 16));
        roadLine.setAttribute('opacity', (0.7 * po).toFixed(3));
        for (const d of drops) {
          const dt = t - d.t0;
          if (dt < 0 || dt > 0.95) { d.c.setAttribute('r', 0); continue; }
          d.c.setAttribute('cx', (d.x + d.vx * dt).toFixed(1));
          d.c.setAttribute('cy', (779 + d.vy * dt + 0.5 * 1500 * dt * dt).toFixed(1));
          d.c.setAttribute('r', d.r.toFixed(1));
          d.c.setAttribute('opacity', (1 - dt / 0.95).toFixed(3));
        }
        rainFar.setAttribute('d', rainD(far, t));
        rainNear.setAttribute('d', rainD(near, t));

        animLowerThird(lt, t, 1.0, 3.2);

        const lo = { tout: T.lossOut, dout: 0.4 };
        dim.style.opacity = (eout(t, T.news - 0.2, T.news + 0.4) * (1 - eio(t, T.lossOut, T.lossOut + 0.5))).toFixed(3);
        show(n1, t, T.news, { d: 0.5, y: 40, ...lo });
        n1.style.rotate = '-2deg';
        show(n2, t, T.news + 0.45, { d: 0.5, y: 40, ...lo });
        n2.style.rotate = '1.5deg';
        show(nCap, t, T.news + 0.9, { d: 0.4, y: 0, ...lo });
        show(loss, t, T.loss - 0.2, { d: 0.5, x: 30, y: 0, ...lo });
        lossNum.textContent = fmt(933.4 * ease.out(prog(t, T.loss, T.loss + 2.4)), 1);

        // title: in at the centre, then up to the top left as the phone arrives
        const pin = ease.out(prog(t, T.titleIn, T.titleIn + 0.7));
        const pm = eio(t, T.titleMove, T.titleMove + 0.8);
        const cx = lerp(960, 330, pm), cy = lerp(470, 128, pm), sc = lerp(lerp(0.96, 1, pin), 0.42, pm);
        title.style.opacity = (pin * (1 - eio(t, T.wipe - 0.2, T.wipe + 0.3))).toFixed(3);
        scrim.style.opacity = (pin * (1 - pm) * 0.92).toFixed(3);
        title.style.transform = `translate(${cx - 500}px, ${cy - 170}px) scale(${sc.toFixed(4)})`;
        draw(titleWave, eout(t, T.titleIn + 0.25, T.titleIn + 1.1));
        titleSub.style.opacity = (eout(t, T.titleIn + 0.7, T.titleIn + 1.2) * (1 - eio(t, T.titleMove, T.titleMove + 0.3))).toFixed(3);
        show(logos, t, T.titleIn + 0.9, { d: 0.45, y: 16, tout: T.titleMove + 0.35, dout: 0.35 });

        const pp = ease.outQuint(prog(t, T.phoneIn, T.phoneIn + 0.8));
        ph.style.opacity = pp.toFixed(3);
        ph.style.transform = `translateY(${((1 - pp) * 320).toFixed(1)}px) scale(.9)`;
        show(notif, t, T.notif, { d: 0.45, y: -40 });

        const pw = eio(t, T.wipe, T.wipe + 0.8);
        wipePath.setAttribute('d', waterPath(-20, 1940, lerp(1200, -160, pw), 1100, 26, 520, t * 3, 20));
      },
    };
  },
};
