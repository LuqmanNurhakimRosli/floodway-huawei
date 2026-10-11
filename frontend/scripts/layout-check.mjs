// Layout check (Plan B P5-02). Opens each route at several sizes and reports:
//   - overlapping interactive elements (buttons, links, inputs) that are not nested in each other
//   - horizontal page scroll
//   - text under 12px (fails above MAX_SMALL_TEXT, default 0)
//   - touch targets under 44x44 on phone widths (counted, informational)
//
// Usage (dev server must be running):
//   npm run layout-check
//   ROUTES=/home,/live SIZES=360x740,1440x900 BASE=http://localhost:5173 npm run layout-check
// Exit code is 1 when any overlap or horizontal scroll is found, so it can gate a check.
import { chromium } from 'playwright-core';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const ROUTES = (process.env.ROUTES ?? '/home,/map,/reports,/live,/profile').split(',');
const SIZES = (process.env.SIZES ?? '360x740,390x844,768x1024,1024x768,1440x900').split(',').map((s) => s.split('x').map(Number));
const MAX_SMALL_TEXT = Number(process.env.MAX_SMALL_TEXT ?? 0); // nothing under 12px

const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL ?? 'chrome', headless: true });
let failures = 0;
const rows = [];

for (const route of ROUTES) {
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 760, hasTouch: w < 760 });
    await ctx.addInitScript(() =>
      localStorage.setItem('floodway_user', JSON.stringify({ id: 'usr-01', name: 'Demo User', email: 'demo@floodway.my', phone: '', isDemo: true })),
    );
    const page = await ctx.newPage();
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(Number(process.env.WAIT_MS ?? 3500));
    const r = await page.evaluate(() => {
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.05;
      };
      const label = (el) => `${el.tagName.toLowerCase()}"${(el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 28)}"`;
      // Interactive elements, minus the map canvas (Leaflet controls and markers legitimately overlap tiles).
      const items = [...document.querySelectorAll('a[href], button, input, select, textarea, [role=button], [role=tab], [role=option]')]
        .filter((el) => visible(el) && !el.closest('.leaflet-container') && !el.closest('[aria-hidden=true]'));
      // Page content scrolls under fixed and sticky chrome (header, bottom nav) by design, so compare two elements
      // only when they sit in the same layer: both in the page flow, or both inside the same fixed/sticky bar.
      const layer = (el) => {
        for (let n = el; n && n !== document.body; n = n.parentElement) {
          const pos = getComputedStyle(n).position;
          if (pos === 'fixed' || pos === 'sticky') return n;
        }
        return null;
      };
      const shownAt = (el, x, y) => {
        for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
          const cs = getComputedStyle(n);
          if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
          const r = n.getBoundingClientRect();
          if (x < r.left || x > r.right || y < r.top || y > r.bottom) return false;
        }
        return true;
      };
      const overlaps = [];
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i], b = items[j];
          if (a.contains(b) || b.contains(a)) continue;
          if (layer(a) !== layer(b)) continue;
          const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
          const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
          const oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
          // An element scrolled out of its scroll container is clipped: it has a box but is not visible there.
          const cx = Math.max(ra.left, rb.left) + ox / 2;
          const cy = Math.max(ra.top, rb.top) + oy / 2;
          if (ox > 4 && oy > 4 && shownAt(a, cx, cy) && shownAt(b, cx, cy)) overlaps.push(`${label(a)} x ${label(b)} (${Math.round(ox)}x${Math.round(oy)}px)`);
        }
      }
      let small = 0;
      for (const el of document.querySelectorAll('body *')) {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
        if (!visible(el) || el.closest('svg') || el.closest('.leaflet-container')) continue;
        if (parseFloat(getComputedStyle(el).fontSize) < 12) small++;
      }
      const touch = items.filter((el) => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length;
      const doc = document.documentElement;
      return { overlaps: overlaps.slice(0, 8), overlapCount: overlaps.length, hscroll: doc.scrollWidth > doc.clientWidth, small, touch, total: items.length };
    });
    const bad = r.overlapCount > 0 || r.hscroll || r.small > MAX_SMALL_TEXT;
    if (bad) failures++;
    rows.push({ route, size: `${w}x${h}`, ...r, bad });
    await ctx.close();
  }
}
await browser.close();

console.log('route'.padEnd(10), 'size'.padEnd(9), 'overlap'.padEnd(8), 'hscroll'.padEnd(8), 'small<12'.padEnd(9), 'targets<44', 'status');
for (const r of rows) {
  console.log(r.route.padEnd(10), r.size.padEnd(9), String(r.overlapCount).padEnd(8), String(r.hscroll).padEnd(8), String(r.small).padEnd(9), String(r.touch).padEnd(10), r.bad ? 'FAIL' : 'ok');
  for (const o of r.overlaps) console.log('    overlap:', o);
}
console.log(failures ? `\n${failures} failing combination(s)` : '\nNo overlaps, no horizontal scroll.');
process.exit(failures ? 1 : 0);
