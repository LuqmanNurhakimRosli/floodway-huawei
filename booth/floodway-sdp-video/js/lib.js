// Shared helpers. Every scene is a pure function of time t (seconds), so any frame renders the same every time.
export const W = 1920, H = 1080;
// assemble.py puts the speaker's video in a circle at x 1612 to 1860, y 792 to 1040 while they talk. Scenes keep
// the corner from x 1420, y 770 clear.

// UiTM, FloodWay and Sime Darby Property logos on a white plate (the logo files have white backgrounds)
export function logoRow(parent, cls = '') {
  return el('div', `logos ${cls}`, `<img class="lg-uitm" src="assets/logos/uitm.png" alt="UiTM"><i></i>
    <span class="lg-fw"><img src="assets/logo.svg" alt=""><b>FloodWay</b></span><i></i>
    <img class="lg-sdp" src="assets/logos/sdp.png" alt="Sime Darby Property">`, parent);
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, p) => a + (b - a) * p;
export const prog = (t, a, b) => clamp((t - a) / (b - a));
export const ease = {
  out: (p) => 1 - Math.pow(1 - p, 3),
  in: (p) => p * p * p,
  inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
  outQuint: (p) => 1 - Math.pow(1 - p, 5),
};
export const eio = (t, a, b) => ease.inOut(prog(t, a, b));
export const eout = (t, a, b) => ease.out(prog(t, a, b));

// seeded random numbers, so rain drops and heat maps are the same on every render
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// html is only ever a literal written in these scene files (no user or network input), so innerHTML is safe here
export function el(tag, cls, html, parent) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  if (parent) parent.appendChild(n);
  return n;
}
export const svgEl = (tag, attrs = {}, parent) => {
  const n = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
};

// Entrance at tin (d seconds, ease-out), optional exit ending at tout (dout seconds, ease-in).
// y/x: entrance offset in px; s: entrance scale; yout: exit offset.
export function show(node, t, tin, o = {}) {
  const { d = 0.45, y = 24, x = 0, s = 1, tout = Infinity, dout = 0.35, yout = 0, xout = 0 } = o;
  const pe = ease.out(prog(t, tin, tin + d));
  const px = tout === Infinity ? 0 : ease.in(prog(t, tout - dout, tout));
  const op = pe * (1 - px);
  node.style.opacity = op.toFixed(4);
  node.style.visibility = op < 0.001 ? 'hidden' : 'visible';
  const tx = (1 - pe) * x + px * xout, ty = (1 - pe) * y + px * yout, sc = lerp(s, 1, pe);
  node.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px)` + (sc !== 1 ? ` scale(${sc.toFixed(4)})` : '');
  return op;
}

// wipe from the left using clip-path, for bars and lower thirds
export function wipe(node, t, tin, o = {}) {
  const { d = 0.4, tout = Infinity, dout = 0.3 } = o;
  const pe = ease.outQuint(prog(t, tin, tin + d));
  const px = tout === Infinity ? 0 : ease.in(prog(t, tout - dout, tout));
  node.style.visibility = pe <= 0 || px >= 1 ? 'hidden' : 'visible';
  node.style.clipPath = `inset(0 ${((1 - pe) * 100).toFixed(2)}% 0 ${(px * 100).toFixed(2)}%)`;
}

// draw an SVG path from 0 to p (0..1)
export function draw(path, p) {
  const len = path.__len ?? (path.__len = path.getTotalLength());
  path.style.strokeDasharray = `${len} ${len}`;
  path.style.strokeDashoffset = (len * (1 - clamp(p))).toFixed(2);
}

export const fmt = (n, dp = 0) => n.toLocaleString('en-MY', { minimumFractionDigits: dp, maximumFractionDigits: dp });

// ── shared components ─────────────────────────────────────────────────────────────────────────────

export function chapter(root, num, title) {
  return el('div', 'chapter', `<b>${num}</b><i></i><span>${title}</span>`, root);
}
export function animChapter(node, t, dur) {
  show(node, t, 0.15, { d: 0.5, y: -12, tout: dur - 0.25, dout: 0.3 });
}

export function lowerThird(root, who) {
  const n = el('div', 'lt', `<div class="lt-stripe"></div><div class="lt-text"><b>${who.name}</b><span>${who.role}</span></div>`, root);
  return n;
}
export function animLowerThird(node, t, tin, hold = 4) {
  wipe(node, t, tin, { d: 0.45, tout: tin + hold, dout: 0.35 });
  const text = node.querySelector('.lt-text');
  show(text, t, tin + 0.15, { d: 0.35, y: 0, x: -16, tout: tin + hold - 0.05, dout: 0.25 });
}

// Line icons in the poster's style (24x24, stroke). Use icon(name, size, colour).
const P = {
  photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-8 8"/>',
  text: '<path d="M6 3h8l4 4v14H6z"/><path d="M9 12h6M9 15h6M9 18h4"/>',
  gps: '<path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 11.4 3.5 3.5 0 0 0 7 18z"/>',
  rain: '<path d="M7 14h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 7.4 3.5 3.5 0 0 0 7 14z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
  river: '<path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M12 3v3"/>',
  camera: '<rect x="3" y="7" width="13" height="10" rx="2"/><path d="M16 11l5-3v8l-5-3"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
  eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z"/><circle cx="12" cy="12" r="2.8"/>',
  merge: '<circle cx="6" cy="5.5" r="2"/><circle cx="6" cy="18.5" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 7.5v9M8 5.5c5 0 8 2.5 8 4.5M8 18.5c5 0 8-2.5 8-4.5"/>',
  map: '<path d="M9 5L3 7v13l6-2 6 2 6-2V5l-6 2z"/><path d="M9 5v13M15 7v13"/>',
  route: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H14a3.5 3.5 0 0 0 0-7h-4a3.5 3.5 0 0 1 0-7h5.5"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  solar: '<rect x="3" y="6" width="18" height="11" rx="1.5"/><path d="M9 6v11M15 6v11M3 11.5h18M12 17v3M8 20h8"/>',
  ping: '<path d="M5 12a7 7 0 0 1 14 0"/><path d="M8 12a4 4 0 0 1 8 0"/><circle cx="12" cy="12" r="1.2"/>',
  signal: '<path d="M4 9a11 11 0 0 1 16 0M7 12.5a6.5 6.5 0 0 1 10 0"/><circle cx="12" cy="16.5" r="1.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  q: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.6v.6"/><circle cx="12" cy="17" r=".6"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.3"/>',
  pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".6"/>',
  battery: '<rect x="3" y="8" width="16" height="9" rx="2"/><path d="M21 11v3M7 11v3M10.5 11v3"/>',
  box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
  board: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M4 9h2M4 15h2M18 9h2M18 15h2M9 4v2M15 4v2M9 18v2M15 18v2"/>',
  sensor: '<path d="M7 4h10v7a5 5 0 0 1-10 0z"/><path d="M9 19c1.8 1 4.2 1 6 0M7.5 21.5c2.7 1.4 6.3 1.4 9 0"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  building: '<path d="M4 21V8l6-4v17M10 21h10V10l-6-3"/><path d="M7 11v.01M7 14v.01M7 17v.01M14 13v.01M17 13v.01M14 16v.01M17 16v.01"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  satellite: '<path d="M13 7l4 4-6 6-4-4z"/><path d="M15 5l2-2 4 4-2 2M5 15l-2 2 4 4 2-2"/><path d="M6.5 13.5L4 11M13.5 6.5L11 4"/>',
  hold: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
  gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.5 3.5 5.2"/>',
};
export function icon(name, size = 28, color = 'currentColor', sw = 2) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${P[name]}</svg>`;
}

// phone frame with a screen that holds stacked layers (images or HTML)
export function phone(parent, { w = 390, h = 844, scale = 1, x = 0, y = 0 } = {}) {
  const root = el('div', 'phone', '', parent);
  root.style.cssText = `left:${x}px;top:${y}px;width:${w + 24}px;height:${h + 24}px;transform-origin:50% 50%;`;
  if (scale !== 1) root.style.transform = `scale(${scale})`;
  const screen = el('div', 'phone-screen', '', root);
  screen.style.cssText = `width:${w}px;height:${h}px;`;
  el('div', 'phone-island', '', root);
  return { root, screen };
}
export function screenImg(screen, src) {
  const im = el('img', 'phone-img', null, screen);
  im.src = src;
  return im;
}

// a wave line path across width w at height y with amplitude a, wavelength l, phase ph
export function wavePath(x0, x1, y, a, l, ph, step = 12) {
  let d = `M${x0} ${(y + a * Math.sin(ph)).toFixed(1)}`;
  for (let x = x0 + step; x <= x1 + step; x += step) d += ` L${x} ${(y + a * Math.sin(((x - x0) / l) * Math.PI * 2 + ph)).toFixed(1)}`;
  return d;
}
// a filled water body from a wavy top down to bottom yb
export function waterPath(x0, x1, y, yb, a, l, ph, step = 12) {
  return wavePath(x0, x1, y, a, l, ph, step) + ` L${x1 + step} ${yb} L${x0} ${yb} Z`;
}

// sound cues: scenes call cue(kind, t, opts) at build time; main.js turns local times into film times
export function cues(list) {
  return list.map(([t, kind, opts]) => ({ t, kind, ...(opts || {}) }));
}
