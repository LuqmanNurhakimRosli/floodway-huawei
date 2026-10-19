// Route audit: loads every route at each viewport and records what a reviewer would otherwise check by hand.
//   - runtime errors (uncaught exceptions, console errors)
//   - failed requests, split into this app's own files (a defect) and outside hosts (often a network policy)
//   - HTTP errors from the app's own server and API
//   - horizontal page scroll, broken images, a page with almost no text (blank screen)
//   - touch targets under 44x44 on phone widths (counted)
// Writes audit-out/route-audit.json and screenshots at 390x844 and 1440x900.
//
// Usage (dev server, and the backend if API routes should answer):
//   node scripts/route-audit.mjs
//   ROUTES=/home,/map SIZES=390x844 node scripts/route-audit.mjs
//   CHROME_PATH=<browser binary> when Chrome is not installed.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const OUT = path.resolve(process.env.OUT ?? 'audit-out');
const ROUTES = (process.env.ROUTES ?? '/,/home,/map,/live,/studio,/control,/reports,/navigation/shelter-01,/navigation/no-such-centre,/profile,/shelters,/simulation,/no-such-page').split(',');
const SIZES = (process.env.SIZES ?? '320x640,360x800,390x844,430x932,768x1024,1024x768,1366x768,1440x900,1920x1080').split(',').map((s) => s.split('x').map(Number));
const SHOT_SIZES = new Set(['390x844', '1440x900']);
const WAIT = Number(process.env.WAIT_MS ?? 3500);
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });

const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH, headless: true } : { channel: process.env.CHROME_CHANNEL ?? 'chrome', headless: true },
);
const own = (u) => u.startsWith(BASE) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(u);
const results = [];

for (const route of ROUTES) {
  for (const [w, h] of SIZES) {
    const phone = w < 768;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: phone, hasTouch: phone });
    await ctx.addInitScript(() => {
      localStorage.setItem('floodway_user', JSON.stringify({ id: 'usr-01', name: 'Audit User', email: 'audit@floodway.my', phone: '', isDemo: true }));
    });
    const page = await ctx.newPage();
    const r = { route, size: `${w}x${h}`, pageErrors: [], consoleErrors: [], ownFailed: [], ownHttpErrors: [], externalFailed: new Set() };
    page.on('pageerror', (e) => r.pageErrors.push(e.message.split('\n')[0]));
    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      if (/Failed to load resource/.test(t)) return; // counted from the request events instead
      r.consoleErrors.push(t.slice(0, 200));
    });
    page.on('requestfailed', (q) => {
      const u = q.url();
      if (own(u)) r.ownFailed.push(`${u.replace(BASE, '')} (${q.failure()?.errorText})`);
      else r.externalFailed.add(new URL(u).host);
    });
    page.on('response', (s) => {
      if (s.status() >= 400 && own(s.url())) r.ownHttpErrors.push(`${s.status()} ${s.url().replace(BASE, '')}`);
    });
    try {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(WAIT);
      Object.assign(r, await page.evaluate((isPhone) => {
        const de = document.documentElement;
        const vis = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
        const imgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src'));
        const ownImg = (src) => !/^https?:/.test(src) || src.startsWith(location.origin);
        let small = 0;
        if (isPhone) {
          for (const el of document.querySelectorAll('a[href], button, [role="button"], input:not([type="hidden"]), select, [role="tab"]')) {
            if (!vis(el) || el.closest('.leaflet-control-attribution')) continue;
            const b = el.getBoundingClientRect();
            if (b.width < 44 || b.height < 44) small++;
          }
        }
        return {
          url: location.pathname,
          title: document.title,
          hscroll: de.scrollWidth > window.innerWidth + 1,
          scrollWidth: de.scrollWidth,
          textLength: (document.body.innerText || '').trim().length,
          // the app's own images; outside ones (map tiles) are reported apart, as a network policy can block them
          brokenImages: imgs.map((i) => i.getAttribute('src')).filter(ownImg),
          brokenExternalImages: imgs.map((i) => i.getAttribute('src')).filter((x) => !ownImg(x)).length,
          smallTargets: small,
          h1: [...document.querySelectorAll('h1')].map((x) => x.textContent.trim()).slice(0, 2),
        };
      }, phone));
      if (SHOT_SIZES.has(r.size)) await page.screenshot({ path: path.join(OUT, 'shots', `${route.replace(/[^a-z0-9]+/gi, '_') || 'root'}-${r.size}.png`) });
    } catch (e) {
      r.pageErrors.push('navigation: ' + e.message.split('\n')[0]);
    }
    r.externalFailed = [...r.externalFailed];
    r.blank = (r.textLength ?? 0) < 40;
    r.status = r.pageErrors.length || r.ownFailed.length || r.hscroll || r.brokenImages?.length || r.blank ? 'FAIL' : 'ok';
    results.push(r);
    console.log(`${r.status.padEnd(4)} ${route.padEnd(24)} ${r.size.padEnd(9)} errors:${r.pageErrors.length + r.consoleErrors.length} ownFail:${r.ownFailed.length} http:${r.ownHttpErrors.length} hscroll:${r.hscroll} imgs:${r.brokenImages?.length ?? '-'} small:${r.smallTargets ?? '-'} -> ${r.url ?? ''}`);
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'route-audit.json'), JSON.stringify(results, null, 1));
const fails = results.filter((r) => r.status === 'FAIL').length;
console.log(`\n${results.length} loads, ${fails} failing. Detail: ${path.join(OUT, 'route-audit.json')}`);
process.exitCode = fails ? 1 : 0;
