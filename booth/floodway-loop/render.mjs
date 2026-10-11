#!/usr/bin/env node
/**
 * FloodWay film: offline exporter + QA for index.html.
 *
 * Steps window.renderFrame(t) frame by frame in headless Chromium (Playwright) and pipes lossless PNG
 * frames into ffmpeg. Nothing is captured in real time, so every frame is exact.
 *
 *   node render.mjs                     out/floodway-loop.mp4  1920x1080 · 30 fps · H.264 High · 1,800 frames = 60.000 s
 *   node render.mjs --stills [t,...]    out/stills/*.png (default: the QA checkpoints)
 *   node render.mjs --sheet [t,...]     out/contact-sheet.png (480 px tiles)
 *   node render.mjs --qa                errors, network, NaN draw args (all 1,800 frames), determinism (two launches)
 *   node render.mjs --bench             frame-cost report
 *   options: --out <file.mp4>  --dir <folder>  --crf <0-51, default 16>
 */
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const WIDTH = 1920, HEIGHT = 1080, FPS = 30, SECONDS = 60, FRAMES = FPS * SECONDS;
export const CHECKPOINTS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 59.0, 59.98];
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const FFPROBE = process.env.FFPROBE_PATH || 'ffprobe';

function parseArgs(argv) {
  const o = { mode: 'mp4', out: path.join(HERE, 'out', 'floodway-loop.mp4'), dir: path.join(HERE, 'out', 'stills'), crf: 16, times: CHECKPOINTS };
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split(/=(.*)/s);
    const next = () => (inline !== undefined ? inline : argv[++i]);
    const list = () => {
      const v = inline !== undefined ? inline : (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '');
      if (v) o.times = v.split(',').map(Number).filter(Number.isFinite);
    };
    if (flag === '--stills') { o.mode = 'stills'; list(); }
    else if (flag === '--sheet') { o.mode = 'sheet'; list(); }
    else if (flag === '--qa') o.mode = 'qa';
    else if (flag === '--bench') o.mode = 'bench';
    else if (flag === '--out') o.out = path.resolve(next());
    else if (flag === '--dir') o.dir = path.resolve(next());
    else if (flag === '--crf') o.crf = Number(next());
    else if (flag === '--help' || flag === '-h') o.mode = 'help';
    else throw new Error('Unknown option ' + argv[i] + ' (try --help)');
  }
  if (!Number.isFinite(o.crf) || o.crf < 0 || o.crf > 51) throw new Error('--crf must be between 0 and 51');
  return o;
}

async function loadChromium() {
  for (const name of ['playwright-core', 'playwright']) {
    try { return (await import(name)).chromium; } catch { /* try the next package */ }
  }
  throw new Error('Playwright is not installed here. From booth/floodway-loop run: npm install');
}

/** Headless Chromium: CHROME_PATH, Playwright's own build, installed Chrome, installed Edge. */
export async function launchBrowser() {
  const chromium = await loadChromium();
  const args = ['--force-device-scale-factor=1', '--hide-scrollbars', '--disable-lcd-text', '--font-render-hinting=none'];
  const attempts = [{}];
  if (process.env.CHROME_PATH) attempts.unshift({ executablePath: process.env.CHROME_PATH });
  attempts.push({ channel: 'chrome' }, { channel: 'msedge' });
  let last;
  for (const extra of attempts) {
    try { return await chromium.launch({ headless: true, args, ...extra }); } catch (err) { last = err; }
  }
  throw new Error('Could not start Chromium, Chrome or Edge. Set CHROME_PATH.\n' + (last ? last.message.split('\n')[0] : ''));
}

/** Opens index.html at exactly 1920x1080 and waits until fonts are decoded and the stage is built. */
export async function openStage(browser, query = 'render') {
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  const problems = [], requests = [];
  page.on('pageerror', e => problems.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') problems.push('console.' + m.type() + ': ' + m.text()); });
  page.on('request', r => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:')) requests.push(u); });
  const url = pathToFileURL(path.join(HERE, 'index.html')).href + (query ? '?' + query : '');
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.FLOODWAY_READY === true, null, { timeout: 30000 });
  const cdp = await page.context().newCDPSession(page);   // lossless PNG capture ~3.5x faster than page.screenshot
  return { page, cdp, problems, requests };
}

function requireBinary(bin, hint) {
  const r = spawnSync(bin, ['-hide_banner', '-version'], { encoding: 'utf8' });
  if (r.error || r.status !== 0) throw new Error(bin + ' was not found. ' + hint);
}
function checkClean({ problems, requests }) {
  if (problems.length) throw new Error('Page reported problems:\n  ' + problems.join('\n  '));
  if (requests.length) throw new Error('Unexpected network requests:\n  ' + requests.join('\n  '));
}
export function probe(file) {
  const r = spawnSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-count_frames',
    '-show_entries', 'stream=codec_name,profile,width,height,pix_fmt,r_frame_rate,nb_read_frames,color_primaries,color_transfer,color_space:format=duration',
    '-of', 'json', file], { encoding: 'utf8' });
  if (r.error || r.status !== 0) return null;
  const j = JSON.parse(r.stdout), s = j.streams[0];
  return { codec: s.codec_name, profile: s.profile, width: s.width, height: s.height, pix_fmt: s.pix_fmt, fps: s.r_frame_rate,
    frames: Number(s.nb_read_frames), duration: Number(j.format.duration), color: [s.color_primaries, s.color_transfer, s.color_space].join('/') };
}
const shot = async (stage, t) => {
  await stage.page.evaluate(v => window.renderFrame(v), t);
  const r = await stage.cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
  return Buffer.from(r.data, 'base64');
};
const name = t => 'floodway_t' + t.toFixed(2).replace('.', '_') + '.png';

async function exportMp4(o) {
  requireBinary(FFMPEG, 'Install ffmpeg or set FFMPEG_PATH.');
  fs.mkdirSync(path.dirname(o.out), { recursive: true });
  const browser = await launchBrowser();
  try {
    const stage = await openStage(browser);
    const ff = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y',
      '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-frames:v', String(FRAMES),
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv',
      '-c:v', 'libx264', '-preset', 'slow', '-tune', 'film', '-crf', String(o.crf),
      '-profile:v', 'high', '-level:v', '4.1', '-pix_fmt', 'yuv420p',
      '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
      '-r', String(FPS), '-movflags', '+faststart', o.out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const closed = once(ff, 'close');
    const started = process.hrtime.bigint();
    for (let i = 0; i < FRAMES; i++) {
      const png = await shot(stage, i / FPS);
      if (!ff.stdin.write(png)) await once(ff.stdin, 'drain');
      if (i % FPS === FPS - 1) process.stdout.write('\r  rendered ' + (i + 1) + '/' + FRAMES + ' frames');
    }
    ff.stdin.end();
    const [code] = await closed;
    if (code !== 0) throw new Error('ffmpeg exited with code ' + code);
    checkClean(stage);
    console.log('\n  wrote ' + path.relative(process.cwd(), o.out) + ' in ' + (Number(process.hrtime.bigint() - started) / 1e9).toFixed(1) + ' s');
    const info = probe(o.out);
    if (info) console.log('  ' + JSON.stringify(info));
    if (info && (info.frames !== FRAMES || Math.abs(info.duration - SECONDS) > 0.001)) throw new Error('Frame count / duration mismatch');
  } finally { await browser.close(); }
}

async function stills(o) {
  fs.mkdirSync(o.dir, { recursive: true });
  const browser = await launchBrowser();
  try {
    const stage = await openStage(browser);
    for (const t of o.times) { fs.writeFileSync(path.join(o.dir, name(t)), await shot(stage, t)); console.log('  ' + name(t)); }
    checkClean(stage);
  } finally { await browser.close(); }
}

async function sheet(o) {
  const tmp = path.join(HERE, 'out', 'sheet-tmp');
  fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  const browser = await launchBrowser();
  try {
    const stage = await openStage(browser);
    for (let i = 0; i < o.times.length; i++) fs.writeFileSync(path.join(tmp, String(i).padStart(3, '0') + '.png'), await shot(stage, o.times[i]));
    checkClean(stage);
  } finally { await browser.close(); }
  const cols = 4, rows = Math.ceil(o.times.length / cols), out = path.join(HERE, 'out', 'contact-sheet.png');
  const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '1', '-i', path.join(tmp, '%03d.png'),
    '-vf', 'scale=480:-1,tile=' + cols + 'x' + rows + ':padding=6:color=0x202020', '-frames:v', '1', out], { encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  if (r.status !== 0) throw new Error('ffmpeg tile failed: ' + r.stderr);
  console.log('  wrote ' + path.relative(process.cwd(), out) + ' (' + o.times.join(', ') + ')');
}

async function qa() {
  const browser = await launchBrowser();
  try {
    const stage = await openStage(browser, 'render&qa');
    const bad = await stage.page.evaluate(n => { for (let i = 0; i < n; i++) window.renderFrame(i / 30); return window.FLOODWAY.qaBad(); }, FRAMES);
    console.log('  non-finite canvas arguments across ' + FRAMES + ' frames: ' + bad);
    const hashes = [];
    for (const t of CHECKPOINTS) hashes.push(crypto.createHash('sha256').update(await shot(stage, t)).digest('hex'));
    checkClean(stage);
    await stage.page.close();
    const again = await openStage(browser);
    let same = 0;
    for (let i = 0; i < CHECKPOINTS.length; i++) {
      const h = crypto.createHash('sha256').update(await shot(again, CHECKPOINTS[i])).digest('hex');
      if (h === hashes[i]) same++; else console.log('  determinism mismatch at t=' + CHECKPOINTS[i]);
    }
    // re-render the checkpoints in reverse order in the same page: purity (no state carried between frames)
    let pure = 0;
    for (let i = CHECKPOINTS.length - 1; i >= 0; i--) {
      const h = crypto.createHash('sha256').update(await shot(again, CHECKPOINTS[i])).digest('hex');
      if (h === hashes[i]) pure++; else console.log('  purity mismatch at t=' + CHECKPOINTS[i]);
    }
    checkClean(again);
    console.log('  determinism (fresh page): ' + same + '/' + CHECKPOINTS.length + '   purity (reverse order): ' + pure + '/' + CHECKPOINTS.length);
    console.log('  console errors: 0   network requests: 0');
    if (bad || same !== CHECKPOINTS.length || pure !== CHECKPOINTS.length) process.exitCode = 1;
  } finally { await browser.close(); }
}

async function bench() {
  const browser = await launchBrowser();
  try {
    const stage = await openStage(browser);
    const ms = await stage.page.evaluate(async n => {
      const out = [];
      for (let i = 0; i < n; i += 3) {
        const a = performance.now(); window.renderFrame(i / 30); out.push(performance.now() - a);
        await new Promise(r => requestAnimationFrame(() => r()));
      }
      return out;
    }, FRAMES);
    const s = ms.slice().sort((a, b) => a - b), q = k => s[Math.floor(k * (s.length - 1))].toFixed(2) + ' ms';
    console.log('  renderFrame script   median ' + q(0.5) + '   p95 ' + q(0.95) + '   max ' + q(1) + '   (' + ms.length + ' frames)');
    const live = await openStage(browser, '');
    const gaps = await live.page.evaluate(() => new Promise(res => {
      const ts = [];
      const f = now => { ts.push(now); if (ts.length < 301) requestAnimationFrame(f); else res(ts.slice(1).map((v, i) => v - ts[i])); };
      requestAnimationFrame(f);
    }));
    const g = gaps.slice().sort((a, b) => a - b);
    console.log('  live rAF cadence     median ' + g[150].toFixed(2) + ' ms   p95 ' + g[285].toFixed(2) + ' ms   slow (>20 ms) ' + gaps.filter(v => v > 20).length + '/300 (headless software raster)');
    checkClean(stage); checkClean(live);
  } finally { await browser.close(); }
}

const HELP = `FloodWay film exporter
  node render.mjs                 export out/floodway-loop.mp4 (1920x1080, 30 fps, 1,800 frames = 60.000 s)
  node render.mjs --stills [t,..] PNG stills (default ${CHECKPOINTS.join(', ')})
  node render.mjs --sheet [t,..]  contact sheet
  node render.mjs --qa            error / network / NaN / determinism / purity checks
  node render.mjs --bench         frame-cost report
  options: --out <file.mp4>  --dir <folder>  --crf <0-51, default 16>`;

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  try {
    const o = parseArgs(process.argv.slice(2));
    await ({ mp4: exportMp4, stills, sheet, qa, bench, help: async () => console.log(HELP) }[o.mode])(o);
  } catch (err) {
    console.error('\n  ' + (err && err.message ? err.message : err));
    process.exitCode = 1;
  }
}
