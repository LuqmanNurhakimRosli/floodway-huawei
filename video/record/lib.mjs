// Shared helpers for recording FloodWay app scenes with headless Chrome (playwright-core from frontend/).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { chromium } = createRequire(path.join(ROOT, 'frontend', 'package.json'))('playwright-core');

export const APP = process.env.APP_URL ?? 'http://localhost:5173';
export const PHONE = { width: 390, height: 844 };

/** A fresh phone-sized page, logged in as the demo user, sitting on `route`. */
export async function openPhone(route = '/home') {
  const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--hide-scrollbars', '--font-render-hinting=none'] });
  const context = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  await page.goto(`${APP}/`, { waitUntil: 'networkidle' });
  const demo = page.getByRole('button', { name: 'Continue as demo user' });
  if (await demo.isVisible().catch(() => false)) await demo.click();
  await page.waitForURL(/\/home/, { timeout: 15000 }).catch(() => {});
  if (route !== '/home') await page.goto(`${APP}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  return { browser, page };
}

/** Pick the app's built-in demo position (Location sharing > Demo position), e.g. 'Bangsar'. */
export async function setDemoPosition(page, where) {
  await page.getByRole('button', { name: 'Location sharing settings' }).click();
  const labels = await page.$$eval('#demo-position option', (o) => o.map((x) => x.textContent));
  await page.selectOption('#demo-position', { label: labels.find((l) => l.includes(where)) });
  await page.getByRole('button', { name: 'Close' }).first().click();
  await page.waitForTimeout(800);
}

/**
 * Record the page with the Chrome screencast until `run` finishes. Frames arrive when the page repaints,
 * each with a timestamp; `save` turns them into a constant 30 fps video with ffmpeg, holding each frame
 * until the next one, so app timing (storm, drive) stays real time.
 */
export async function record(page, outFile, run) {
  const dir = outFile.replace(/\.mp4$/, '_frames');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  const taps = [];
  let stopped = false;
  cdp.on('Page.screencastFrame', async (f) => {
    if (stopped) return;
    const file = path.join(dir, `${String(frames.length).padStart(5, '0')}.jpg`);
    frames.push({ file, t: f.metadata.timestamp });
    fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: PHONE.width * 2, maxHeight: PHONE.height * 2, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  /** Tap a locator and remember where and when, so the edit can draw a ripple. */
  const tap = async (locator) => {
    const box = await locator.boundingBox();
    if (box) taps.push({ t: Date.now() / 1000 - t0, x: box.x + box.width / 2, y: box.y + box.height / 2 });
    await locator.click();
  };
  await run({ tap, mark: (name) => taps.push({ t: Date.now() / 1000 - t0, mark: name }) });
  await page.waitForTimeout(400);
  stopped = true;
  await cdp.send('Page.stopScreencast');
  const end = Date.now() / 1000;
  save(frames, end, outFile);
  fs.writeFileSync(outFile.replace(/\.mp4$/, '.taps.json'), JSON.stringify({ start: frames[0]?.t ?? t0, recStart: t0, taps }, null, 2));
  fs.rmSync(dir, { recursive: true, force: true });
  return { frames: frames.length, seconds: end - (frames[0]?.t ?? t0) };
}

function save(frames, end, outFile) {
  const list = frames.map((f, i) => {
    const next = frames[i + 1]?.t ?? end;
    return `file '${f.file.replace(/\\/g, '/')}'\nduration ${Math.max(0.001, next - f.t).toFixed(4)}`;
  });
  list.push(`file '${frames.at(-1).file.replace(/\\/g, '/')}'`);
  const txt = outFile.replace(/\.mp4$/, '_list.txt');
  fs.writeFileSync(txt, list.join('\n'));
  execFfmpeg(['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', txt, '-vf', 'fps=30,scale=780:1688:flags=lanczos,format=yuv420p',
    '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', outFile]);
  fs.rmSync(txt);
}

function execFfmpeg(args) {
  const r = createRequire(import.meta.url)('node:child_process').spawnSync('ffmpeg', args, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`ffmpeg failed (${r.status})`);
}

/** Visible buttons and links, for finding what to click. */
export async function listButtons(page) {
  return page.$$eval('button, a', (els) => els.filter((e) => e.offsetParent !== null)
    .map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60)).filter(Boolean));
}
