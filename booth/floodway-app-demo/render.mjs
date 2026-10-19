// Renders film.html frame by frame (window.renderFrame(t)) in headless Chrome and pipes PNGs into ffmpeg, as the
// booth film does. Nothing is captured in real time, so every frame is exact.
// Usage: node render.mjs                 out/floodway-app-demo.mp4 (1920x1080, 30 fps, H.264 High, BT.709)
//        node render.mjs --stills 3,10    PNG stills in out/stills/
// Run capture.mjs first (cap/). CHROME_PATH=<browser binary> when Chrome is not installed.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const { chromium } = createRequire(path.join(ROOT, 'frontend', 'package.json'))('playwright-core');
const W = 1920, H = 1080, FPS = 30;
const OUT = path.join(HERE, 'out');
fs.mkdirSync(OUT, { recursive: true });

// build: the measured element boxes go into the page, plus the control room capture's height
const boxes = JSON.parse(fs.readFileSync(path.join(HERE, 'cap', 'boxes.json'), 'utf8'));
const png = fs.readFileSync(path.join(HERE, 'cap', 'control.png'));
boxes.control = { ...(boxes.control ?? {}), imgH: png.readUInt32BE(20) / 2 };
const html = fs.readFileSync(path.join(HERE, 'film.html'), 'utf8').replace('/*BOXES*/{}/*END*/', JSON.stringify(boxes));
fs.writeFileSync(path.join(HERE, 'index.html'), html);

const browser = await chromium.launch({
  ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }),
  headless: true,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--font-render-hinting=none', '--allow-file-access-from-files'],
});
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, bypassCSP: true })).newPage();
const problems = [];
page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
page.on('requestfailed', (r) => problems.push('failed: ' + r.url()));
page.on('request', (r) => { const u = r.url(); if (!u.startsWith('file:') && !u.startsWith('data:')) problems.push('network: ' + u); });
await page.goto(pathToFileURL(path.join(HERE, 'index.html')).href + '?render', { waitUntil: 'load' });
try {
  await page.waitForFunction(() => window.FLOODWAY_READY === true, null, { timeout: 60000 });
} catch (e) {
  console.error('page never became ready:\n  ' + (problems.join('\n  ') || e.message));
  await browser.close();
  process.exit(1);
}
const SECONDS = await page.evaluate(() => window.FILM_SECONDS);
const cdp = await page.context().newCDPSession(page);
const shot = async (t) => {
  await page.evaluate((v) => window.renderFrame(v), t);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  return Buffer.from(data, 'base64');
};

const stillsArg = process.argv.indexOf('--stills');
if (stillsArg > -1) {
  const times = process.argv[stillsArg + 1].split(',').map(Number);
  fs.mkdirSync(path.join(OUT, 'stills'), { recursive: true });
  for (const t of times) fs.writeFileSync(path.join(OUT, 'stills', `t${t.toFixed(1).padStart(5, '0')}.png`), await shot(t));
  console.log(`${times.length} stills -> out/stills/`);
} else {
  // --chunk i/n renders only frames [i*frames/n, (i+1)*frames/n) to its own file, so chunks can run in parallel and be
  // joined with ffmpeg's concat demuxer (same settings, so no re-encode)
  const total = Math.round(SECONDS * FPS);
  const chunkArg = process.argv.indexOf('--chunk');
  const [ci, cn] = chunkArg > -1 ? process.argv[chunkArg + 1].split('/').map(Number) : [0, 1];
  const first = Math.floor((ci * total) / cn), last = Math.floor(((ci + 1) * total) / cn);
  const frames = last - first;
  const file = path.join(OUT, cn > 1 ? `chunk-${ci}.mp4` : 'floodway-app-demo-silent.mp4');
  const ff = spawn(process.env.FFMPEG_PATH || 'ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'medium', '-crf', '18', '-threads', '1', '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-r', String(FPS), '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    const buf = await shot((first + i) / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % (FPS * 5) === 0) console.log(`  chunk ${ci}: ${i}/${frames} frames, ${((Date.now() - t0) / Math.max(1, i)).toFixed(0)} ms/frame`);
  }
  ff.stdin.end();
  const code = await new Promise((r) => ff.on('close', r));
  if (code !== 0) throw new Error('ffmpeg exited with ' + code);
  console.log(`-> ${file}`);
}
await browser.close();
if (problems.length) { console.error('PROBLEMS:\n  ' + [...new Set(problems)].slice(0, 20).join('\n  ')); process.exitCode = 1; }
