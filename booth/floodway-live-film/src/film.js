// FloodWay: Live Vision film. renderFrame(t) is a pure function of t (seconds): no clock, no randomness at draw time.
(() => {
  'use strict';
  const DUR = 45, FPS = 30;
  const $ = (id) => document.getElementById(id);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const E = {
    outExpo: (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    outCubic: (x) => 1 - Math.pow(1 - x, 3),
    inCubic: (x) => x * x * x,
    inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    inOutSine: (x) => -(Math.cos(Math.PI * x) - 1) / 2,
    outBack: (x) => { const c1 = 1.15, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  };
  // Seeded PRNG (mulberry32): rain is laid out once, then moved as a function of t.
  const rng = ((s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let r = Math.imul(s ^ (s >>> 15), 1 | s); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; })(20261012);

  // Scene windows (seconds). Neighbours overlap by about 0.2 s so hand-offs read as one camera move.
  const SC = { s1: [0, 4.7], s2: [4.5, 10.4], s3: [10.2, 21.2], s4: [21.0, 28.8], s5: [28.6, 34.8], s6: [34.6, 40.2], s7: [40.0, DUR + 1] };
  const LEVELS = [[0.97, 'DANGER', '#E5484D'], [0.63, 'WARNING', '#F2A20F'], [0.26, 'ADVISORY', '#7CC8E4'], [-1, 'NORMAL', '#18B57A']];
  const levelOf = (r) => LEVELS.find(([th]) => r >= th);

  /** One plate per scene: arrives from 1/1.08 scale, pushes in slowly, leaves with an accelerating push-through. */
  function plate(el, t, [a, b], { exit = true } = {}) {
    const vis = t >= a - 0.01 && t <= b;
    el.style.visibility = vis ? 'visible' : 'hidden';
    if (!vis) return false;
    const inK = E.outExpo(prog(t, a, a + 0.8));
    const outK = exit ? E.inCubic(prog(t, b - 0.55, b)) : 0;
    const scale = lerp(1 / 1.08, 1, inK) * Math.exp(0.006 * (t - a)) * (1 + 0.14 * outK);
    el.style.opacity = String(E.outCubic(prog(t, a, a + 0.6)) * (1 - outK));
    el.style.transform = `scale(${scale.toFixed(5)})`;
    return true;
  }
  /** Masked line reveal: each `.line > span` slides up out of its mask, staggered. */
  function reveal(spans, t, start, stagger = 0.12, dur = 0.8) {
    spans.forEach((s, i) => {
      const k = E.outExpo(prog(t, start + i * stagger, start + i * stagger + dur));
      s.style.transform = `translateY(${((1 - k) * 110).toFixed(2)}%)`;
      s.style.opacity = String(clamp(k * 1.4));
    });
  }
  const enter = (el, t, start, { dx = 0, dy = 40, dur = 0.7, s0 = 1, ease = E.outExpo } = {}) => {
    const k = ease(prog(t, start, start + dur));
    el.style.opacity = String(clamp(prog(t, start, start + dur * 0.6)));
    el.style.transform = `translate(${(dx * (1 - k)).toFixed(2)}px, ${(dy * (1 - k)).toFixed(2)}px) scale(${lerp(s0, 1, k).toFixed(4)})`;
    return k;
  };

  // ---------- one-time setup ----------
  const el = {};
  const S = {};
  let rain = [], ladder = [], lens = {}, scan;
  function setup() {
    Object.keys(SC).forEach((k) => (S[k] = $(k)));
    ['rain', 'bloomA', 'bloomB', 'fade', 'dbg', 'f1', 'f2', 'f3', 'turn', 'camgrid', 'monitor', 'monGlow', 'toast', 'pct', 'pill', 'pillTxt',
      'barFill', 'hudTime', 'lnD', 'lnW', 'lnN', 'lblD', 'lblW', 'lblN', 'wl', 'wlKnob', 'map', 'river', 'flood', 'routeBad', 'routeGood', 'xMark',
      'camPin', 'camRing', 'you', 'shelter', 'eta', 'phone', 'notif', 'c1', 'c2', 'c3', 'tl', 'tlFill', 'n1', 'n2', 'n3', 'stat', 'statNum',
      'chips6', 'cta', 'team', 'word', 'tag'].forEach((id) => (el[id] = $(id)));
    for (let i = 0; i < 12; i++) ladder.push($('r' + i));
    for (let i = 0; i < 380; i++) rain.push({ x: rng() * 2100 - 90, y: rng() * 1300, v: 900 + rng() * 900, l: 18 + rng() * 34, a: 0.12 + rng() * 0.28 });
    ['river', 'routeBad', 'routeGood'].forEach((id) => { lens[id] = el[id].getTotalLength(); el[id].style.strokeDasharray = `${lens[id]} ${lens[id]}`; });
    // Analysis sweep across the camera frame: a soft band that passes every second while the AI reads the water.
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');
    defs.innerHTML = '<linearGradient id="scanG" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#7CC8E4" stop-opacity="0"/><stop offset=".5" stop-color="#7CC8E4" stop-opacity=".22"/><stop offset="1" stop-color="#7CC8E4" stop-opacity="0"/></linearGradient>';
    $('overlay').prepend(defs);
    scan = document.createElementNS(ns, 'rect');
    scan.setAttribute('x', '0'); scan.setAttribute('width', '1120'); scan.setAttribute('height', '90'); scan.setAttribute('fill', 'url(#scanG)');
    $('overlay').insertBefore(scan, $('lnD'));
    ['camPin', 'you', 'shelter', 'xMark', 'flood'].forEach((id) => { el[id].style.transformBox = 'fill-box'; el[id].style.transformOrigin = 'center'; });
  }
