// Walk a route and save a screenshot plus the visible buttons, to plan a recording.
//   node video/record/probe.mjs /live
import fs from 'node:fs';
import path from 'node:path';
import { openPhone, listButtons, ROOT } from './lib.mjs';

const route = process.argv[2] ?? '/home';
const out = path.join(ROOT, 'video', 'footage', 'probe');
fs.mkdirSync(out, { recursive: true });
const { browser, page } = await openPhone(route);
const name = route.replace(/\W+/g, '_') || 'root';
await page.screenshot({ path: path.join(out, `${name}.png`) });
console.log(page.url());
console.log((await listButtons(page)).join(' | '));
await browser.close();
