// Renders film.html frame by frame (window.renderFrame(t)) in headless Edge and pipes PNGs into ffmpeg, like the other
// booth films. Nothing is captured in real time, so every frame is exact. The repo is served over a local HTTP server
// because three.js and the 3D model load as modules.
//
//   node render.mjs --info                      scene list and sound cues -> out/scenes.json, out/cues.json
//   node render.mjs --stills 3,8.5,61           PNG stills (film seconds) -> out/stills/
//   node render.mjs --scene s01,s02             silent scene clips -> out/scenes/<id>.mp4
//   node render.mjs --all --jobs 4              every scene, 4 at a time, then the silent full film
//   node render.mjs --overlay lt-rakuman        transparent overlay -> out/overlays/<name>.mov (ProRes 4444) + .webm
//   node render.mjs --overlays                  every overlay
//   node render.mjs --mux                       after make_audio.py: scene clips with sound, full film with sound
// CHROME_PATH=<browser binary> to use another browser; FFMPEG_PATH=<ffmpeg> if ffmpeg is not on PATH.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const { chromium } = createRequire(path.join(ROOT, 'frontend', 'package.json'))('playwright-core');
const W = 1920, H = 1080, FPS = 30;
const OUT = path.join(HERE, 'out');
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const argv = process.argv.slice(2);
const arg = (k) => { const i = argv.indexOf(k); return i > -1 ? argv[i + 1] : null; };
const has = (k) => argv.includes(k);
const VIDEO_ARGS = ['-c:v', 'libx264', '-profile:v', 'high', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-r', String(FPS)];
fs.mkdirSync(OUT, { recursive: true });

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`${cmd} ${args.slice(0, 6).join(' ')} ... exited ${c}`))));
  });
}

// ── static server for the repo (read-only, no directory listing, no paths outside the repo) ──
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.ttf': 'font/ttf',
  '.woff2': 'font/woff2', '.json': 'application/json', '.wav': 'audio/wav' };
function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.resolve(ROOT, '.' + rel);
    if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

async function openFilm(query = '') {
  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/booth/floodway-sdp-video/film.html${query}`;
  const browser = await chromium.launch({
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'msedge' }),
    headless: true,
    args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--font-render-hinting=none', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('requestfailed', (r) => problems.push('failed: ' + r.url()));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`http ${r.status()}: ${r.url()}`); });
  await page.goto(url, { waitUntil: 'load' });
  try {
    await page.waitForFunction(() => window.FLOODWAY_READY === true || window.FLOODWAY_ERROR, null, { timeout: 90000 });
  } catch { /* reported below */ }
  const err = await page.evaluate(() => window.FLOODWAY_ERROR || (window.FLOODWAY_READY ? null : 'page never became ready'));
  if (err) {
    console.error('film failed to load:\n  ' + [err, ...problems].join('\n  '));
    await browser.close(); server.close();
    process.exit(1);
  }
  const cdp = await page.context().newCDPSession(page);
  const shot = async (t) => {
    await page.evaluate((v) => window.renderFrame(v), t);
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    return Buffer.from(data, 'base64');
  };
  const close = async () => { await browser.close(); server.close(); };
  return { page, cdp, shot, close, problems };
}

async function encode(film, frames, startT, file, extraArgs = VIDEO_ARGS) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const ff = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    ...extraArgs, file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    const buf = await film.shot(startT + i / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % (FPS * 5) === 0) console.log(`  ${path.basename(file)}: ${i}/${frames} frames, ${((Date.now() - t0) / Math.max(1, i)).toFixed(0)} ms/frame`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error('ffmpeg exited ' + c)))));
}

const film = has('--overlay') || has('--overlays') || has('--mux') || (has('--all') && !has('--child')) ? null : await openFilm();
const scenes = film ? await film.page.evaluate(() => window.SCENES) : JSON.parse(fs.existsSync(path.join(OUT, 'scenes.json')) ? fs.readFileSync(path.join(OUT, 'scenes.json'), 'utf8') : '[]');

if (has('--info')) {
  const cues = await film.page.evaluate(() => window.SFX_CUES);
  const total = await film.page.evaluate(() => window.FILM_SECONDS);
  fs.writeFileSync(path.join(OUT, 'scenes.json'), JSON.stringify(scenes, null, 1));
  fs.writeFileSync(path.join(OUT, 'cues.json'), JSON.stringify({ seconds: total, fps: FPS, scenes, cues }, null, 1));
  for (const s of scenes) console.log(`${s.id}  ${String(s.start).padStart(6)}s  +${s.dur}s  ${s.title}`);
  console.log(`total ${total}s, ${cues.length} sound cues -> out/cues.json`);
} else if (has('--stills')) {
  fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
  for (const t of arg('--stills').split(',').map(Number)) {
    fs.writeFileSync(path.join(OUT, 'stills', `t${t.toFixed(2).padStart(7, '0')}.png`), await film.shot(t));
  }
  console.log('stills -> out/stills/');
} else if (has('--scene')) {
  for (const id of arg('--scene').split(',')) {
    const s = scenes.find((x) => x.id === id);
    if (!s) throw new Error('unknown scene ' + id);
    await encode(film, Math.round(s.dur * FPS), s.start, path.join(OUT, 'scenes', `${s.id}.mp4`));
  }
} else if (has('--all')) {
  // parent: write the scene list, split the scenes over N child processes (longest first), then join them
  const jobs = Number(arg('--jobs') ?? 3);
  const info = await openFilm();
  const list = await info.page.evaluate(() => window.SCENES);
  fs.writeFileSync(path.join(OUT, 'scenes.json'), JSON.stringify(list, null, 1));
  await info.close();
  const buckets = Array.from({ length: jobs }, () => ({ ids: [], load: 0 }));
  for (const s of [...list].sort((a, b) => b.dur - a.dur)) { const b = buckets.reduce((m, x) => (x.load < m.load ? x : m)); b.ids.push(s.id); b.load += s.dur; }
  await Promise.all(buckets.filter((b) => b.ids.length).map((b) => run(process.execPath, [fileURLToPath(import.meta.url), '--scene', b.ids.join(','), '--child'])));
  fs.writeFileSync(path.join(OUT, 'scenes', 'list.txt'), list.map((s) => `file '${s.id}.mp4'`).join('\n'));
  await run(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(OUT, 'scenes', 'list.txt'), '-c', 'copy', path.join(OUT, 'FloodWay_SDP_motion_silent.mp4')]);
  console.log('-> out/FloodWay_SDP_motion_silent.mp4');
} else if (has('--overlay') || has('--overlays')) {
  let names = [arg('--overlay')];
  if (has('--overlays')) { const probe = await openFilm(); names = await probe.page.evaluate(() => window.OVERLAY_NAMES); await probe.close(); }
  for (const name of names) {
    const ov = await openFilm(`?overlay=${encodeURIComponent(name)}`);
    await ov.cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    const secs = await ov.page.evaluate(() => window.FILM_SECONDS);
    const dir = path.join(OUT, 'overlays', name);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const frames = Math.round(secs * FPS);
    for (let i = 0; i < frames; i++) fs.writeFileSync(path.join(dir, `f${String(i).padStart(4, '0')}.png`), await ov.shot(i / FPS));
    await ov.close();
    const seq = ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(dir, 'f%04d.png')];
    await run(FFMPEG, [...seq, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-alpha_bits', '16', path.join(OUT, 'overlays', `${name}.mov`)]);
    await run(FFMPEG, [...seq, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '24', '-auto-alt-ref', '0', path.join(OUT, 'overlays', `${name}.webm`)]);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`-> out/overlays/${name}.mov and .webm (${secs}s)`);
  }
} else if (has('--mux')) {
  // scene clips get their own sound effects; the full film gets the full mix (music and effects)
  const A = path.join(OUT, 'audio');
  for (const s of scenes) {
    await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', path.join(OUT, 'scenes', `${s.id}.mp4`), '-i', path.join(A, 'scenes', `${s.id}_sfx.wav`),
      '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', path.join(OUT, 'scenes', `${s.id}_sfx.mp4`)]);
  }
  await run(FFMPEG, ['-y', '-loglevel', 'error', '-i', path.join(OUT, 'FloodWay_SDP_motion_silent.mp4'), '-i', path.join(A, 'mix.wav'),
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', path.join(OUT, 'FloodWay_SDP_motion_animatic.mp4')]);
  console.log('-> out/scenes/<id>_sfx.mp4 and out/FloodWay_SDP_motion_animatic.mp4');
}

if (film) {
  await film.close();
  if (film.problems.length) { console.error('PROBLEMS:\n  ' + [...new Set(film.problems)].slice(0, 20).join('\n  ')); process.exitCode = 1; }
}
