// Builds the timeline of scenes and exposes the render contract used by render.mjs:
//   window.renderFrame(t)   draw the frame at film time t (seconds)
//   window.FILM_SECONDS     total length
//   window.SCENES           [{id, title, start, dur}]
//   window.SFX_CUES         [{t, kind, ...}] in film time, read by make_audio.py
//   window.FLOODWAY_READY   true once fonts, images and the 3D model are loaded
// URL options: ?play (real-time preview, &t=60 to start at 60 s), ?overlay=<name> (one transparent overlay).
import s00 from './scenes/s00-montage.js';
import s01 from './scenes/s01-cold-open.js';
import s02 from './scenes/s02-problem.js';
import s03 from './scenes/s03-solution.js';
import s06 from './scenes/s06-node-camera.js';
import s06b from './scenes/s06b-factors.js';
import s07 from './scenes/s07-model.js';
import s08 from './scenes/s08-demo.js';
import s09 from './scenes/s09-compare.js';
import s10 from './scenes/s10-feasibility.js';
import s11 from './scenes/s11-close.js';
import { OVERLAYS } from './scenes/overlays.js';
import { logoRow, eout, eio } from './lib.js';

// Speaker names and roles for the lower thirds.
export const TEAM = {
  nadi: { name: 'Nadyie Azil', role: 'Team LarpGPT · the problem' },
  luqman: { name: 'Luqman Nurhakim', role: 'Team LarpGPT · the system and demo' },
  aniq: { name: 'Aniq Ihtisyam', role: 'Team LarpGPT · comparison and pilot' },
};

// Order follows the narration (materials-demo/script-video.md): Nadi s01 to s03, Luqman s06b to s08, Aniq s09 to s11.
const SCENES = [s00, s01, s02, s03, s06b, s06, s07, s08, s09, s10, s11];
const LOGO_STRIP = new Set(['s02', 's03', 's06', 's06b', 's07', 's08', 's09', 's10']);
const params = new URLSearchParams(location.search);
const stage = document.getElementById('stage');
const timeline = [];
let active = null, strip = null;

// timing.json maps a scene id to seconds (motion and cues stretch evenly) or to [[design s, film s], ...] keyframes,
// so chosen moments land on the narration. A first key [d, 0] starts the scene d seconds into its design.
function timeMap(sc, spec) {
  const keys = Array.isArray(spec) ? spec : [[0, 0], [sc.dur, Number(spec) > 0 ? Number(spec) : sc.dur]];
  const interp = (a, b) => (x) => {
    let i = 0;
    while (i < keys.length - 2 && x > keys[i + 1][a]) i++;
    const p = keys[i], q = keys[i + 1];
    return p[b] + ((x - p[a]) * (q[b] - p[b])) / (q[a] - p[a]);
  };
  return { dur: keys.at(-1)[1], d0: keys[0][0], toDesign: interp(1, 0), toFilm: interp(0, 1) };
}

function layerFrame(x, local) {
  const id = x.sc.id, d = x.dur;
  let s = LOGO_STRIP.has(id) ? 1 : 0;
  if (id === 's02') s = eout(local, 0.1, 0.6);
  if (id === 's10') s = 1 - eio(local, d - 0.3, d);
  strip.style.opacity = s.toFixed(3);
}

async function boot() {
  await Promise.all(['400 30px Inter', '500 24px Inter', '600 22px Inter', '700 20px Inter', '800 64px Inter'].map((f) => document.fonts.load(f)));
  await document.fonts.ready;
  const ov = params.get('overlay');
  const list = ov ? [OVERLAYS[ov]] : SCENES;
  if (ov && !OVERLAYS[ov]) throw new Error(`unknown overlay "${ov}"; known: ${Object.keys(OVERLAYS).join(', ')}`);
  if (ov) document.body.classList.add('transparent');
  const ctx = { team: TEAM };
  let timing = {};
  if (!ov) timing = await fetch('timing.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  let start = 0;
  for (const sc of list) {
    const root = document.createElement('section');
    root.className = `scene ${sc.cls ?? ''}`;
    root.id = sc.id;
    stage.appendChild(root);
    const api = await sc.build(root, ctx);
    const map = timeMap(sc, timing[sc.id]);
    timeline.push({ sc, start, end: start + map.dur, dur: map.dur, map, root, api });
    start += map.dur;
  }
  if (!ov) strip = logoRow(stage, 'strip');
  await Promise.all([...document.images].map((im) => (im.complete && im.naturalWidth ? Promise.resolve() : im.decode().catch(() => {
    throw new Error('image failed to load: ' + im.src);
  }))));
  window.FILM_SECONDS = +start.toFixed(3);
  window.OVERLAY_NAMES = Object.keys(OVERLAYS);
  window.SCENES = timeline.map((x) => ({ id: x.sc.id, title: x.sc.title, start: +x.start.toFixed(3), dur: +x.dur.toFixed(3) }));
  window.SFX_CUES = timeline.flatMap((x) => (x.api.cues ?? []).map((c) => ({ ...c, ft: x.map.toFilm(c.t) }))
    .filter((c) => c.t >= x.map.d0 && c.ft >= 0 && c.ft < x.dur)
    .map(({ ft, ...c }) => ({ ...c, t: +(x.start + ft).toFixed(3), scene: x.sc.id })));
  await window.renderFrame(0);
  window.FLOODWAY_READY = true;
}

window.renderFrame = async (t) => {
  let k = timeline.findIndex((x) => t >= x.start && t < x.end);
  if (k < 0) k = t < 0 ? 0 : timeline.length - 1;
  const x = timeline[k];
  if (active !== x) {
    if (active) active.root.classList.remove('on');
    x.root.classList.add('on');
    active = x;
    if (x.api.activate) await x.api.activate();
  }
  const local = Math.max(0, t - x.start);
  if (strip) layerFrame(x, local);
  await x.api.frame(Math.min(Math.max(x.map.toDesign(local), x.map.d0), x.sc.dur - 1e-4));
};

function preview() {
  const hud = document.getElementById('hud');
  hud.style.display = 'block';
  let t = Number(params.get('t') ?? 0), last = performance.now(), paused = false;
  const audio = params.has('audio') ? Object.assign(new Audio('out/audio/mix.wav'), { currentTime: t }) : null;
  addEventListener('keydown', (e) => {
    if (e.code === 'Space') { paused = !paused; if (audio) paused ? audio.pause() : audio.play(); }
    if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { t = Math.max(0, t + (e.code === 'ArrowRight' ? 5 : -5)); if (audio) audio.currentTime = t; }
  });
  if (audio) audio.play().catch(() => {});
  const loop = async (now) => {
    if (!paused) t += (now - last) / 1000;
    last = now;
    if (t >= window.FILM_SECONDS) t = 0;
    await window.renderFrame(t);
    const sc = active?.sc;
    hud.textContent = `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}  ${sc?.id} ${sc?.title}  (space: pause, arrows: seek)`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

boot().then(() => { if (params.has('play')) preview(); }).catch((e) => {
  console.error(e);
  document.title = 'BOOT FAILED: ' + e.message;
  window.FLOODWAY_ERROR = String(e && e.stack || e);
});
