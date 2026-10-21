// Transparent overlays for the editor: render with  node render.mjs --overlays  (ProRes 4444 .mov and VP9 .webm).
// Put them on a track above your own footage. Each one animates in and out on its own.
import { el, show, eout, eio, prog, ease, lerp, wavePath, draw, lowerThird, animLowerThird, logoRow } from '../lib.js';

const lt = (key) => ({
  id: 'lt-' + key, title: 'Lower third ' + key, dur: 4.0,
  async build(root, ctx) {
    const n = lowerThird(root, ctx.team[key]);
    return { frame(t) { animLowerThird(n, t, 0.15, 3.5); } };
  },
});

const pill = (id, text, cls, dur, style) => ({
  id, title: text, dur,
  async build(root) {
    const n = el('div', `pill sample ${cls}`, text, root);
    n.style.cssText = style;
    return { frame(t) { show(n, t, 0.15, { d: 0.4, y: 12, tout: dur - 0.1, dout: 0.35 }); } };
  },
});

export const OVERLAYS = Object.fromEntries([
  lt('nadi'), lt('luqman'), lt('aniq'),
  {
    id: 'title-card', title: 'FloodWay title card', dur: 4.5,
    async build(root) {
      const t0 = el('div', 's1-title ov-title', `<div class="s1-word"><img src="assets/logo-white.svg" alt=""><span>FloodWay</span></div>
        <svg class="s1-wave" viewBox="0 0 760 40" width="760" height="40"><path d="${wavePath(10, 750, 20, 9, 140, 0, 6)}" fill="none" stroke="#1677FF" stroke-width="7" stroke-linecap="round"/></svg>
        <div class="s1-sub">Street-level flood early warning for townships</div>`, root);
      const wave = t0.querySelector('.s1-wave path');
      return {
        frame(t) {
          const pin = ease.out(prog(t, 0.1, 0.8)), pout = eio(t, 4.0, 4.45);
          t0.style.opacity = (pin * (1 - pout)).toFixed(3);
          t0.style.transform = `translate(460px, 300px) scale(${lerp(0.96, 1, pin).toFixed(4)})`;
          draw(wave, eout(t, 0.35, 1.2));
        },
      };
    },
  },
  pill('tag-sample', 'SAMPLE · AI-generated frame', 'ov-tl', 5, 'position:absolute;left:96px;bottom:96px;font-size:28px;padding:10px 22px'),
  pill('tag-demo', 'Sample cameras · AI-generated frames · Sample relief centres', 'ov-tr', 6, 'position:absolute;right:96px;top:56px;font-size:26px;padding:10px 22px'),
  {
    id: 'logo-strip', title: 'UiTM, FloodWay and Sime Darby Property logos', dur: 6,
    async build(root) {
      const l = logoRow(root, 'strip');
      return { frame(t) { show(l, t, 0.15, { d: 0.45, y: -10, tout: 5.9, dout: 0.35 }); } };
    },
  },
  {
    id: 'banner-model', title: 'Model figures banner', dur: 6,
    async build(root) {
      const b = el('div', 's7-banner', '<i></i><span>Reported figures from GINKGO training report. Re-test in progress.</span>', root);
      return { frame(t) { show(b, t, 0.15, { d: 0.45, y: 20, tout: 5.9, dout: 0.35 }); } };
    },
  },
].map((o) => [o.id, o]));
