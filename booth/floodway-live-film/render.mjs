// Renders index.html frame by frame (window.renderFrame(t)) in headless Chrome and pipes lossless PNGs into ffmpeg.
// Nothing is captured in real time, so every frame is exact.
// Usage: node render.mjs               out/floodway-live-vision.mp4 (1920x1080, 30 fps, H.264 High, BT.709)
//        node render.mjs --stills 2,15,19.8,25.5,31.5,38.6,42.5   PNG stills in out/stills/
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const { chromium } = createRequire(path.join(ROOT, 'frontend', 'package.json'))('playwright-core');
const W = 1920, H = 1080, FPS = 30, SECONDS = 45, FRAMES = FPS * SECONDS;
const OUT = path.join(HERE, 'out');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--font-render-hinting=none'] });
// bypassCSP: Playwright's evaluate() needs eval, which the film's own strict CSP (rightly) forbids.
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, bypassCSP: true })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
page.on('request', (r) => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:')) problems.push('network: ' + u); });
await page.goto(pathToFileURL(path.join(HERE, 'index.html')).href + '?render', { waitUntil: 'load' });
try {
  await page.waitForFunction(() => window.FLOODWAY_READY === true, null, { timeout: 60000 });
} catch (e) {
  console.error('page never became ready:\n  ' + (problems.join('\n  ') || e.message));
  await browser.close();
  process.exit(1);
}
const cdp = await page.context().newCDPSession(page);
const shot = async (t) => {
  await page.evaluate((v) => window.renderFrame(v), t);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  return Buffer.from(data, 'base64');
};

const stillsArg = process.argv.indexOf('--stills');
if (stillsArg > -1) {
  const times = (process.argv[stillsArg + 1] || '2,15,19.8,25.5,31.5,38.6,42.5').split(',').map(Number);
  fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
  for (const t of times) fs.writeFileSync(path.join(OUT, 'stills', `t${t.toFixed(1).padStart(4, '0')}.png`), await shot(t));
  console.log(`${times.length} stills -> out/stills/`);
} else {
  const file = path.join(OUT, 'floodway-live-vision.mp4');
  const ff = spawn(process.env.FFMPEG_PATH || 'ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-r', String(FPS), '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = 0; i < FRAMES; i++) {
    const png = await shot(i / FPS);
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % FPS === FPS - 1) process.stdout.write(`\r  ${i + 1}/${FRAMES} frames`);
  }
  ff.stdin.end();
  const code = await new Promise((r) => ff.on('close', r));
  if (code !== 0) throw new Error('ffmpeg exited with ' + code);
  console.log(`\n-> ${file}`);
}
await browser.close();
if (problems.length) { console.error('PROBLEMS:\n  ' + problems.join('\n  ')); process.exitCode = 1; }
