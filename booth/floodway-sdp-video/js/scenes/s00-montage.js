// Scene 0, news montage (5 s). Real flash-flood footage from The Star (Kuala Lumpur, 20 Sept 2026), credited on screen:
// a full-width street shot, three vertical clips side by side, the bus shot, then a dip to the cold open's night sky.
// Frames come from prep_media.py (out/montage, watermarks cropped out); played at normal speed.
import { el, show, eio, eout, ease, lerp, prog } from '../lib.js';

// shot: [folder, frame count, film in, film out]
const FULL = [['A', 44, 0, 1.45], ['B', 34, 3.5, 4.62]];
const STRIPS = [['S1', 65, 1.40], ['S2', 65, 1.52], ['S3', 65, 1.64]];
const STRIP_END = 3.55;
const src = (dir, i) => `out/montage/${dir}/${String(i).padStart(3, '0')}.jpg`;

export default {
  id: 's00', title: 'News montage', dur: 5, cls: 'dark',
  async build(root) {
    root.style.background = '#050D1C';
    const full = FULL.map(([dir, n, a, b]) => {
      const im = el('img', 's0-full', null, root);
      im.src = src(dir, 1);
      return { im, dir, n, a, b, cur: 1 };
    });
    const strips = STRIPS.map(([dir, n, a], i) => {
      const im = el('img', 's0-strip', null, root);
      im.src = src(dir, 1);
      im.style.left = i * 640 + 'px';
      return { im, dir, n, a, cur: 1 };
    });
    el('div', 's0-vig', '', root);
    const tag = el('div', 's0-tag', '<i></i>Kuala Lumpur · 20 September 2026', root);
    const head = el('div', 's0-head', '<span>Flash</span> <span>floods.</span>', root);
    const words = [...head.children];
    const credit = el('div', 's0-credit', 'Footage: The Star (thestar.com.my)', root);
    const dip = el('div', 's0-dip', '', root);
    // swap to the frame for time t (30 fps) and wait for it to decode, so every rendered frame is exact
    const seq = async (s, t0, t) => {
      const i = Math.min(s.n, Math.max(1, Math.floor((t - t0) * 30) + 1));
      if (i !== s.cur) { s.cur = i; s.im.src = src(s.dir, i); await s.im.decode().catch(() => {}); }
    };

    return {
      cues: [[0, 'rumble'], [0.05, 'rain', { dur: 5.2, gain: 0.6 }], [1.36, 'whoosh'], [3.46, 'swoosh'], [4.5, 'low'], [4.62, 'whoosh', { gain: 0.6 }]]
        .map(([t, kind, o]) => ({ t, kind, ...(o || {}) })),
      async frame(t) {
        const jobs = [];
        for (const f of full) {
          const on = t >= f.a && t < f.b;
          f.im.style.visibility = on ? 'visible' : 'hidden';
          if (on) jobs.push(seq(f, f.a, t));
          f.im.style.transform = `scale(${lerp(1.03, 1.1, prog(t, f.a, f.b)).toFixed(4)})`;
        }
        for (const s of strips) {
          const on = t >= s.a && t < STRIP_END;
          s.im.style.visibility = on ? 'visible' : 'hidden';
          if (on) jobs.push(seq(s, s.a, t));
          s.im.style.transform = `translateY(${((1 - ease.outQuint(prog(t, s.a, s.a + 0.35))) * 1080).toFixed(1)}px)`;
        }
        await Promise.all(jobs);
        show(tag, t, 0.2, { d: 0.4, x: -24, y: 0, tout: 4.4, dout: 0.3 });
        words.forEach((w, i) => show(w, t, 1.9 + i * 0.18, { d: 0.35, y: 40, tout: 4.4, dout: 0.3 }));
        credit.style.opacity = (eout(t, 0.1, 0.4) * (1 - eio(t, 4.4, 4.7))).toFixed(3);
        // a white flash on each cut, then the dip to night
        const flash = Math.max(0, ...[1.4, 3.5].map((c) => (t >= c ? 0.35 * Math.exp(-(t - c) / 0.07) : 0)));
        dip.style.background = t < 4.55 ? `rgba(255,255,255,${flash.toFixed(3)})` : '#050D1C';
        dip.style.opacity = t < 4.55 ? 1 : eio(t, 4.55, 4.95).toFixed(3);
      },
    };
  },
};
