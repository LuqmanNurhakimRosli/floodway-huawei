// Scene 6b, how the factors combine, LUQMAN's opening line, then a music-only beat for the fusion rules.
// Four inputs feed the fusion rules, which raise one level.
// Values are examples: the river reading is a blueprint example (S2), the camera line is a sample frame.
// Labels: the river node says "design", camera frames say "sample", the map says "illustrative".
import { el, show, prog, icon, chapter, animChapter, ease, lerp, lowerThird, animLowerThird } from '../lib.js';

const CARDS = [
  ['river', 'River node', 'design', 'Reading: 1.95 m above the bed (example)', 'Warning', '#EA580C', 4.2],
  ['camera', 'Street camera', 'sample frame', 'Water above the warning line', 'Warning', '#EA580C', 6.0],
  ['rain', 'Forecast', 'open data', 'Heavy rain warning for the district', 'when', '#1677FF', 7.8],
  ['chip', 'Model 1 map', 'illustrative', 'Area sits in the High band (65 to 100)', 'where', '#B91C1C', 9.6],
];

export default {
  id: 's06b', title: 'How the factors combine', dur: 20,
  async build(root, ctx) {
    const ch = chapter(root, '04', 'How one warning is built');
    const lt = lowerThird(root, ctx.team.luqman);
    const head = el('div', 'h1 s6b-head', 'Four inputs. One fusion rule.', root);
    // 2 x 2 grid on the left; the fusion box sits to the right
    const POS = [[96, 250], [520, 250], [96, 530], [520, 530]];
    const cards = CARDS.map(([ic, name, tag, line, lvl, c], i) => {
      const n = el('div', 's6b-card', `
        <div class="s6b-top">${icon(ic, 30, '#1677FF')}<b>${name}</b><span class="pill sample">${tag}</span></div>
        <div class="s6b-line">${line}</div>
        <div class="s6b-lvl" style="--c:${c}"><i></i>${lvl}</div>`, root);
      n.style.left = POS[i][0] + 'px';
      n.style.top = POS[i][1] + 'px';
      return n;
    });
    const fusion = el('div', 'card s6b-fusion', `${icon('merge', 40, '#1677FF')}<div class="s6b-ft">Fusion rules</div>
      <div class="s6b-fr">Any single input can raise a level.<br>Two inputs at Warning together raise Danger.</div>`, root);
    const out = el('div', 's6b-out', `<div class="label">Resident sees</div><div class="s6b-danger" id="s6b-danger">DANGER</div>
      <div class="small">Evacuate prompt, route to the nearest open shelter, push alert</div>`, root);
    const note = el('div', 'small s6b-note', 'River and camera values are examples. Model 1 is an estimate, not a warning. The forecast is when, not where.', root);
    const danger = out.querySelector('#s6b-danger');

    return {
      cues: [[0.4, 'whoosh'], ...CARDS.map(([, , , , , , t], i) => [t, 'tick', { gain: 0.7 + 0.1 * i }]), [10.6, 'whoosh', { gain: 0.5 }], [12.6, 'drop'], [13.0, 'chime', { notes: [76, 83] }]]
        .map(([t, kind, o]) => ({ t, kind, ...(o || {}) })),
      frame(t) {
        animChapter(ch, t, 20);
        animLowerThird(lt, t, 0.8, 4.0);
        const out_ = { tout: 19.7, dout: 0.3 };
        show(head, t, 0.3, { d: 0.5, ...out_ });
        cards.forEach((c, i) => show(c, t, CARDS[i][6] - 2.6, { d: 0.45, y: 16, ...out_ }));
        show(fusion, t, 10.4, { d: 0.5, s: 0.96, ...out_ });
        show(out, t, 12.6, { d: 0.5, y: 18, ...out_ });
        danger.style.transform = `scale(${lerp(1.25, 1, ease.out(prog(t, 12.6, 13.2))).toFixed(3)})`;
        show(note, t, 14.6, { d: 0.5, y: 0, ...out_ });
      },
    };
  },
};
