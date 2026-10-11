// Map frame-rate measurement (Plan B P3-05). Drags the map for ~2 s with every layer on (Danger scenario, route shown)
// and reports frames per second from requestAnimationFrame. Dev server must be running: npm run map-fps
// Headless Chrome renders in software and the phone row only SLOWS the CPU 4x: this is a relative check, not a real-device number.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const rows = [];
for (const [label, w, h, cpu] of [['desktop 1440x900', 1440, 900, 1], ['phone 390x844, CPU 4x slower', 390, 844, 4]]) {
  const mobile = w < 768;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
  await ctx.addInitScript(() => localStorage.setItem('floodway_user', JSON.stringify({ id: 'usr-01', name: 'L', email: 'l@f.my', phone: '1', isDemo: true })));
  const page = await ctx.newPage();
  if (cpu > 1) { const c = await ctx.newCDPSession(page); await c.send('Emulation.setCPUThrottlingRate', { rate: cpu }); }
  await page.goto((process.env.BASE ?? 'http://localhost:5173') + '/map', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4500);
  await page.getByRole('button', { name: /Danger/ }).first().click().catch(async () => { await page.getByRole('slider').click(); await page.getByRole('button', { name: /Danger/ }).first().click(); await page.getByRole('slider').press('ArrowDown'); await page.getByRole('slider').press('ArrowDown'); });
  await page.waitForTimeout(2000);
  await page.evaluate(() => { window.__f = []; let last = performance.now(); const loop = (t) => { window.__f.push(t - last); last = t; window.__run && requestAnimationFrame(loop); }; window.__run = true; requestAnimationFrame(loop); });
  const cx = w * (mobile ? 0.5 : 0.35), cy = h * 0.35;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 0; i < 120; i++) { await page.mouse.move(cx + Math.sin(i / 10) * 120, cy + Math.cos(i / 10) * 80); await page.waitForTimeout(16); }
  await page.mouse.up();
  const f = await page.evaluate(() => { window.__run = false; return window.__f.slice(2); });
  const total = f.reduce((a, b) => a + b, 0);
  const sorted = [...f].sort((a, b) => a - b);
  rows.push(`${label}: ${(f.length / (total / 1000)).toFixed(1)} fps avg, p95 frame ${sorted[Math.floor(sorted.length * 0.95)].toFixed(1)} ms, worst ${sorted.at(-1).toFixed(1)} ms, frames>50ms: ${f.filter((x) => x > 50).length}/${f.length}`);
  await ctx.close();
}
console.log(rows.join('\n'));
await browser.close();
