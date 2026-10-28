// Record the FloodWay app scenes for the demo video at phone size (390x844, rendered at 2x, 30 fps).
//   node video/record/rec.mjs live | map | report
// Output: video/footage/<take>.mp4 plus <take>.taps.json (tap points and named marks, seconds from the take start).
// The map take ends with the arrival check-in, which sends a REAL Telegram message to the server's default chat.
import fs from 'node:fs';
import path from 'node:path';
import { openPhone, record, setDemoPosition, ROOT } from './lib.mjs';

const take = process.argv[2];
const out = path.join(ROOT, 'video', 'footage', `${take}.mp4`);
const wait = (page, s) => page.waitForTimeout(s * 1000);

/** Ease the page's scroll container (or `sel`) to `y` over `ms`, so the camera move reads smoothly on video. */
async function glide(page, y, ms, sel = 'main') {
  await page.evaluate(([to, dur, s]) => new Promise((done) => {
    const el = document.querySelector(s);
    const from = el.scrollTop, t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      el.scrollTop = from + (to - from) * e;
      if (k < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  }), [y, ms, sel]);
}

/** scrollTop that puts `locator`'s top `offset` px below the top of its scroll container. */
async function topOf(page, locator, offset = 70, sel = 'main') {
  return locator.evaluate((el, [o, s]) => {
    const c = el.closest(s) ?? document.querySelector(s);
    return c.scrollTop + el.getBoundingClientRect().top - c.getBoundingClientRect().top - o;
  }, [offset, sel]);
}

const takes = {
  // Scene 4: tour the four factor tiles, play the 15 s storm, show the tiles turn red, back to the ring.
  async live() {
    const { browser, page } = await openPhone('/live');
    const card = page.getByText('Flood risk from four factors');
    const cctv = page.getByText('CCTV vision').first();
    const top = await topOf(page, card, 12);
    await page.evaluate((y) => { document.querySelector('main').scrollTop = y; }, top);
    // Framing only: the storm selects the drain camera and its chip row scrolls itself into view, which would pull
    // the page down to the footnote. The recording browser ignores that scroll; the app is unchanged.
    await page.evaluate(() => { Element.prototype.scrollIntoView = () => {}; });
    // Measured at each move (the tiles grow during the storm): the CCTV tile's bottom lands just above the
    // bottom bar, so the reasons list and the data-source footnote below it stay off screen.
    const tilesY = () => cctv.evaluate((title) => {
      let el = title;
      while (el.parentElement && el.getBoundingClientRect().height < 110) el = el.parentElement; // the tile, not the whole card
      const c = document.querySelector('main');
      const bottom = c.scrollTop + el.getBoundingClientRect().bottom - c.getBoundingClientRect().top;
      return bottom - c.clientHeight + 16;
    });
    await wait(page, 1.5);
    const r = await record(page, out, async ({ tap, mark }) => {
      await wait(page, 0.5);
      mark('tour');
      await glide(page, await tilesY(), 3200);
      await wait(page, 0.4);
      await glide(page, top, 700);
      await tap(page.getByRole('button', { name: 'Play storm scenario' }));
      mark('storm_play');
      // The ring stays in view for the whole storm: scrolling while the tiles resize can bring the footnote in.
      await wait(page, 19.0);
      mark('end');
    });
    console.log(r);
    await browser.close();
  },

  // Scenes 6-7: from Bangsar, the home-area centre is FULL, pick an open one that avoids flood, Drive, 8 s drive, arrival.
  async map() {
    const { browser, page } = await openPhone('/map');
    await setDemoPosition(page, 'Bangsar');
    await page.getByRole('tab', { name: 'Route', exact: true }).click();
    await wait(page, 2);
    const full = page.getByRole('button', { name: /Dewan Serbaguna Kampung Baru/ }).first();
    const open = page.getByRole('button', { name: /Dewan Komuniti Sentul Perdana/ }).first();
    const sheet = await full.evaluate((el) => {
      let c = el.parentElement;
      while (c && !(c.scrollHeight > c.clientHeight + 20 && /(auto|scroll)/.test(getComputedStyle(c).overflowY))) c = c.parentElement;
      c?.setAttribute('data-sheet', '1');
      return Boolean(c);
    });
    if (!sheet) throw new Error('route sheet scroller not found');
    await page.evaluate(() => { document.querySelector('[data-sheet]').scrollTop = 0; });
    await wait(page, 1);
    const r = await record(page, out, async ({ tap, mark }) => {
      await wait(page, 1.0);
      mark('full_row');
      await glide(page, await topOf(page, full, 10, '[data-sheet]'), 900, '[data-sheet]');
      await wait(page, 1.4);
      await glide(page, await topOf(page, open, 10, '[data-sheet]'), 800, '[data-sheet]');
      await tap(open);
      mark('tap_open_centre');
      await wait(page, 1.2);
      const drive = page.getByRole('button', { name: 'Drive', exact: true });
      await glide(page, await topOf(page, drive, 60, '[data-sheet]'), 700, '[data-sheet]');
      await tap(drive);
      mark('tap_drive');
      await wait(page, 0.6);
      const start = page.getByRole('button', { name: 'Start turn-by-turn' });
      await glide(page, await topOf(page, start, 200, '[data-sheet]'), 600, '[data-sheet]');
      await tap(start);
      mark('drive_start');
      await page.getByRole('heading', { name: /Arrived at/ }).waitFor({ timeout: 20000 });
      mark('arrived');
      await wait(page, 6.5);
      mark('end');
    });
    console.log(r);
    await browser.close();
  },

  // Scene 8: sample photo, short note, AI check, send, operator desk approves, the 2 km area on the map.
  async report() {
    const { browser, page } = await openPhone('/reports');
    // Demo flood-prone spots (name -> lat, lon): the new report lands on one at random, named on its card.
    const spots = [...fs.readFileSync(path.join(ROOT, 'frontend', 'src', 'data', 'klDemo.ts'), 'utf8')
      .matchAll(/name: '([^']+)', lat: ([\d.]+), lon: ([\d.]+)/g)].map((m) => ({ name: m[1], lat: +m[2], lon: +m[3] }));
    const spotsShown = () => page.evaluate((names) => names.filter((n) => document.body.innerText.includes(n)), spots.map((s) => s.name));
    // Framing only: keep a handle on the app's Leaflet map (drawn on a canvas) so the camera can glide to the new area.
    await page.evaluate(() => {
      const fire = window.L.Map.prototype.fire;
      window.L.Map.prototype.fire = function (...args) { window.__fwMap = this; return fire.apply(this, args); };
    });
    const r = await record(page, out, async ({ tap, mark }) => {
      await wait(page, 1.0);
      await tap(page.getByRole('button', { name: 'Report a flood' }));
      await wait(page, 1.0);
      await tap(page.getByRole('button', { name: 'Sample photo: Drain overflow' }));
      mark('shutter');
      await wait(page, 0.8);
      const note = page.getByPlaceholder('e.g. Drain overflowing onto the road');
      await tap(note);
      await note.fill(''); // the sample photo pre-fills a description
      await note.pressSequentially('Drain overflowing onto the road', { delay: 45 });
      await wait(page, 0.4);
      const ask = page.getByRole('button', { name: 'Ask the AI about this photo' });
      await ask.scrollIntoViewIfNeeded();
      await tap(ask);
      mark('ai_check');
      await page.getByText(/via OpenRouter|could not be completed|not configured/).first().waitFor({ timeout: 45000 });
      mark('ai_result');
      await wait(page, 2.0);
      const send = page.getByRole('button', { name: 'Send report' });
      await send.scrollIntoViewIfNeeded();
      const before = await spotsShown();
      await tap(send);
      mark('sent');
      await wait(page, 4.0);
      mark('approved');
      const added = (await spotsShown()).find((n) => !before.includes(n));
      const spot = spots.find((s) => s.name === added);
      if (!spot) throw new Error('could not tell where the new report landed');
      await tap(page.getByRole('link', { name: 'Map' }));
      await wait(page, 1.5);
      // Glide so the area's centre sits in the visible map above the bottom sheet (y ~ 200 of 844), where its label shows.
      await page.evaluate(([lat, lon]) => {
        const m = window.__fwMap, z = 14;
        const target = m.unproject(m.project([lat, lon], z).add([0, 222]), z);
        m.flyTo(target, z, { duration: 1.8 });
      }, [spot.lat, spot.lon]);
      await wait(page, 2.2);
      mark('area');
      await wait(page, 4.0);
      mark('end');
    });
    console.log(r);
    await browser.close();
  },
};

if (!takes[take]) throw new Error(`take must be one of: ${Object.keys(takes).join(', ')}`);
await takes[take]();
