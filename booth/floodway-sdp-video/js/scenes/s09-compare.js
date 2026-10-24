// Scene 9, compared with JPS and other systems, ANIQ.
// Text-only table, no logos. Cells follow the evidence matrix in "FloodWay SDP hackathon competitive analysis.md"
// (checked Oct 2026); "Not found" means searched, not proof of absence. Columns fill in the order they are narrated.
import { el, show, icon, chapter, animChapter, lowerThird, animLowerThird } from '../lib.js';

const COLS = ['Waze and Google Maps', 'JPS', 'MyDIMS', 'FloodWay'];
const ROWS = ['Flood reports', 'River forecast', 'Shelter routing', 'Street-level timing'];
// [row, col, status, detail, time]
const CELLS = [
  [1, 1, 'Yes', 'bulletins 1 to 2 days ahead, district and basin level', 3.6], [3, 1, 'Not found', 'district and basin level', 6.6],
  [0, 1, 'Not found', '', 8.4], [2, 1, 'Not found', '', 9.0],
  [2, 2, 'Yes', 'open relief centres, with navigation', 11.2], [0, 2, 'Yes', 'verified before broadcast', 12.6],
  [1, 2, 'Not found', '', 13.8], [3, 2, 'Not found', '', 14.2],
  [0, 0, 'Yes', 'crowd hazard and closure reports', 15.4], [2, 0, 'Partial', 'reroutes around reported closures; no relief-centre routing found', 16.6],
  [1, 0, 'Yes', 'Flood Hub: river basins, up to 7 days', 17.6], [3, 0, 'Not found', 'flash-flood model is a 20 km grid', 18.4],
  [3, 3, 'Target', 'our sensors and cameras; the pilot will test it', 19.9], [2, 3, 'Yes', 'routes avoid flooded areas to a relief centre (simulation)', 22.6],
  [0, 3, 'Yes', 'photo reports, AI opinion, a person reviews', 24.4], [1, 3, 'Building', 'district level, being validated', 25.6],
];
const TONE = { Yes: 'yes', Partial: 'part', 'Not found': 'nf', Target: 'fw', Building: 'fw' };

export default {
  id: 's09', title: 'Compared with JPS and others', dur: 30,
  async build(root, ctx) {
    const ch = chapter(root, '09', 'Compared with JPS and other systems');
    const lt = lowerThird(root, ctx.team.aniq);
    const head = el('div', 'h2 s9-head', 'Official systems matter, and we build on them.', root);
    const tbl = el('div', 's9-table', '', root);
    const hdr = [el('div', 's9-h s9-corner', '', tbl), ...COLS.map((c, i) => el('div', 's9-h' + (i === 3 ? ' fw' : ''), c, tbl))];
    const rowLabels = [], cells = {};
    ROWS.forEach((r, ri) => {
      rowLabels.push(el('div', 's9-rl', r, tbl));
      COLS.forEach((_, ci) => { cells[`${ri}-${ci}`] = el('div', 's9-c' + (ci === 3 ? ' fw' : ''), '', tbl); });
    });
    for (const [r, c, st, det] of CELLS) {
      cells[`${r}-${c}`].innerHTML = `<div class="s9-in"><b class="${TONE[st]}">${st}</b>${det ? `<span>${det}</span>` : ''}</div>`;
    }
    const fwCol = el('div', 's9-fwcol', '', root);
    const gap = el('div', 's9-gap', `${icon('route', 34, '#fff')}<span><b>The gap we fill:</b> street-level timing from our own sensors and cameras, and routes that avoid the flood on the way to a shelter.</span>`, root);
    const foot = el('div', 'small s9-foot', 'Checked October 2026 against official help pages and news. "Not found" means searched, not proof of absence. Names are text references only.', root);

    return {
      activate() {
        tbl.style.transform = 'none';
        const tb = tbl.getBoundingClientRect(), h = hdr[4].getBoundingClientRect();
        Object.assign(fwCol.style, { left: h.left - 2 + 'px', top: tb.top - 2 + 'px', width: h.width + 4 + 'px', height: tb.height + 4 + 'px' });
        gap.style.top = tb.bottom + 22 + 'px';
      },
      cues: [[0.4, 'whoosh', { gain: 0.5 }], ...CELLS.filter(([, c]) => c === 3).map(([, , , , t]) => [t, 'tick', { gain: 0.7 }]), [19.2, 'shimmer', { gain: 0.5 }], [27.0, 'chime', { notes: [79, 84] }]]
        .map(([t, kind, o]) => ({ t, kind, ...(o || {}) })),
      frame(t) {
        animChapter(ch, t, 30);
        animLowerThird(lt, t, 0.5, 3.6);
        const out = { tout: 29.7, dout: 0.3 };
        show(head, t, 0.4, { d: 0.5, ...out });
        show(tbl, t, 0.8, { d: 0.5, y: 20, ...out });
        hdr.forEach((h, i) => show(h, t, 0.9 + i * 0.12, { d: 0.35, y: 8 }));
        rowLabels.forEach((r, i) => show(r, t, 1.4 + i * 0.15, { d: 0.35, x: -12, y: 0 }));
        for (const [r, c, , , ts] of CELLS) show(cells[`${r}-${c}`].firstChild, t, ts, { d: 0.35, y: 10 });
        show(fwCol, t, 19.2, { d: 0.5, y: 0, s: 0.98, ...out });
        show(gap, t, 27.0, { d: 0.5, y: 16, ...out });
        show(foot, t, 1.2, { d: 0.4, y: 0, ...out });
      },
    };
  },
};
