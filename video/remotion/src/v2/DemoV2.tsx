// FloodWay demo v2: your narration, the reference video's teal layout, the judges' three asks.
// Times are seconds in the final video, read off your recording (see video/v2/STORYBOARD.md).
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile } from 'remotion';
import { appear, Backdrop, BODY, Captions, Cuts, edit, Foot, HEAD, LEFT, Panel, Phone, ServiceChip, sceneOf, segAt, type Seg, Tag, useT, V, win } from './kit';

const fontCss = `
@font-face { font-family: 'Inter'; src: url('${staticFile('fonts/Inter-Variable.ttf')}') format('truetype'); font-weight: 100 900; }
@font-face { font-family: 'Outfit'; src: url('${staticFile('fonts/Outfit-Variable.ttf')}') format('truetype'); font-weight: 100 900; }
`;

const Box: React.FC<{ x: number; y: number; w: number; h: number; o?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, w, h, o = 1, children, style }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, opacity: o, ...style }}>{children}</div>
);
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ position: 'absolute', inset: 0, borderRadius: 28, background: V.card, border: `1.5px solid ${V.line}`, boxShadow: '0 30px 80px rgba(0,0,0,.35)', overflow: 'hidden', ...style }}>{children}</div>
);

// ---------- 1-2 Shah Alam: reported floods, then the places hit most ----------

// Approximate spots on a drawn map (the records name places, not coordinates). First match wins.
const SPOTS: [string, number, number][] = [
  ['sri muda', 655, 655], ['padang jawa', 175, 690], ['persekutuan', 765, 228], ['mesra', 835, 268], ['subang', 690, 190],
  ['batu 3', 805, 214], ['stadium', 470, 340], ['seksyen 13', 492, 362], ['seksyen 14', 548, 395], ['seksyen 22', 565, 565],
  ['seksyen 3', 420, 420], ['seksyen 4', 392, 458], ['seksyen 7', 300, 305], ['ttdi', 205, 285], ['tasik puteri', 430, 112],
];
const YEAR_AT = (y: number) => 1.0 + (y - 2015) * 1.0; // the last 2021 dot lands before "twenty-six" (7.78 s)
type Rec = (typeof edit.shahAlam)[number];
const dots = (() => {
  const seen: Record<string, number> = {};
  const perYear: Record<number, number> = {};
  return edit.shahAlam.map((r: Rec) => {
    const p = r.place.toLowerCase();
    const [key, x, y] = SPOTS.find(([k]) => p.includes(k)) ?? ['other', 450, 450];
    const n = (seen[key] = (seen[key] ?? 0) + 1) - 1;
    const k = (perYear[r.year] = (perYear[r.year] ?? 0) + 1) - 1;
    const ang = n * 2.4;
    return { ...r, key, x: x + (n ? Math.cos(ang) * 15 * Math.sqrt(n) : 0), y: y + (n ? Math.sin(ang) * 15 * Math.sqrt(n) : 0), at: YEAR_AT(r.year) + k * 0.09 };
  }).sort((a, b) => a.at - b.at);
})();
const CALLOUTS = [
  { key: 'sri muda', at: 12.64, title: 'Taman Sri Muda', sub: 'Riverside homes · reported Nov 2019', dx: -225, dy: -185 },
  { key: 'padang jawa', at: 15.18, title: 'Kg Padang Jawa', sub: 'By the river · 3 reports in 2021, incl. 18 Dec', dx: 30, dy: 40 },
  { key: 'persekutuan', at: 17.56, title: 'Federal Highway motorcycle lane', sub: 'Riders · 5 reports, 2016–2017', dx: -560, dy: 70 },
];

const ShahAlamMap: React.FC = () => {
  const t = useT();
  const o = win(t, 0, sceneOf(2)[1]);
  if (o <= 0) return null;
  const shown = dots.filter((d) => t >= d.at).length;
  const lastYear = shown ? dots[shown - 1].year : 2015;
  const focus = appear(t, 11.6, 0.8); // scene 2: dim the rest, push in
  const zoom = 1 + 0.05 * focus;
  return (
    <Box x={LEFT.x} y={LEFT.y} w={LEFT.w} h={LEFT.h} o={o}>
      <Card>
        <svg viewBox="0 0 920 920" width={920} height={920} style={{ transform: `scale(${zoom})`, transformOrigin: '55% 55%' }}>
          {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={90 + i * 95} y1={60} x2={70 + i * 95} y2={860} stroke="rgba(255,255,255,.05)" strokeWidth={2} />)}
          {Array.from({ length: 8 }, (_, i) => <line key={`h${i}`} x1={40} y1={110 + i * 100} x2={880} y2={95 + i * 100} stroke="rgba(255,255,255,.05)" strokeWidth={2} />)}
          <path d="M 30 255 C 260 245, 520 230, 890 195" stroke="#5f7f86" strokeWidth={13} fill="none" strokeLinecap="round" />
          <text x={330} y={228} fill="#8fb0b7" fontFamily={BODY} fontSize={20} fontWeight={600}>Federal Highway</text>
          <path d="M 890 560 C 760 610, 700 700, 560 705 S 300 650, 30 735" stroke="#2c86b0" strokeWidth={16} fill="none" strokeLinecap="round" opacity={0.85} />
          <text x={330} y={712} fill="#7fc3e0" fontFamily={BODY} fontSize={20} fontWeight={600}>Klang River</text>
          <text x={40} y={70} fill={V.white} fontFamily={HEAD} fontSize={34} fontWeight={800} letterSpacing={6}>SHAH ALAM</text>
          {dots.map((d, i) => {
            const p = appear(t, d.at, 0.35);
            if (p <= 0) return null;
            const hot = CALLOUTS.some((c) => c.key === d.key && t >= c.at);
            const dec2021 = d.date === '2021-12-18';
            const op = hot ? 1 : 1 - 0.6 * focus;
            const pulse = dec2021 ? (t * 1.4) % 1 : 0;
            return (
              <g key={i} opacity={op}>
                {dec2021 && <circle cx={d.x} cy={d.y} r={12 + pulse * 26} fill="none" stroke={V.red} strokeWidth={3} opacity={1 - pulse} />}
                <circle cx={d.x} cy={d.y} r={(hot ? 12 : 9) * p} fill={dec2021 ? V.red : V.warn} stroke="#0a2228" strokeWidth={2.5} />
              </g>
            );
          })}
        </svg>
        <div style={{ position: 'absolute', right: 40, top: 34, textAlign: 'right', opacity: 1 - 0.5 * focus }}>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 120, lineHeight: 1, color: V.warn }}>{shown}</div>
          <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 24, color: V.mist }}>reported floods · 2015–{lastYear}</div>
        </div>
        {CALLOUTS.map((c) => {
          const p = appear(t, c.at, 0.5);
          if (p <= 0) return null;
          const d = dots.find((x) => x.key === c.key)!;
          const cx = 460 + (d.x - 460) * zoom * 1.0, cy = 460 + (d.y - 460) * zoom; // matches the push-in roughly
          return (
            <div key={c.key} style={{ position: 'absolute', left: cx + c.dx, top: cy + c.dy, opacity: p, transform: `translateY(${(1 - p) * 14}px)`, padding: '16px 22px', borderRadius: 18, background: 'rgba(4,16,22,.92)', border: `2px solid ${V.warn}`, boxShadow: '0 16px 40px rgba(0,0,0,.4)', maxWidth: 520 }}>
              <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 32, color: V.white }}>{c.title}</div>
              <div style={{ fontFamily: BODY, fontSize: 22, color: V.mist, marginTop: 4 }}>{c.sub}</div>
            </div>
          );
        })}
      </Card>
    </Box>
  );
};

// ---------- 3 four signals into one ring ----------

const SIGNALS = [
  { name: 'Rain warning', color: V.cyan, x: 70, y: 150 },
  { name: 'Flood history', color: V.warn, x: 600, y: 150 },
  { name: 'Water sensor', color: V.safe, x: 70, y: 690 },
  { name: 'Drain camera', color: V.blue, x: 600, y: 690 },
];
const FourSignals: React.FC = () => {
  const t = useT();
  const [a, b] = sceneOf(3);
  const o = win(t, a, b);
  if (o <= 0) return null;
  const cx = 460, cy = 460, R = 170;
  const fill = appear(t, 24.7, 0.7);
  return (
    <Box x={LEFT.x} y={LEFT.y} w={LEFT.w} h={LEFT.h} o={o}>
      <svg viewBox="0 0 920 920" width={920} height={920} style={{ position: 'absolute', inset: 0 }}>
        {SIGNALS.map((s, i) => {
          const p = appear(t, 20.6 + i * 0.55, 0.6);
          const sx = s.x + 125, sy = s.y + 45;
          return <line key={s.name} x1={sx} y1={sy} x2={sx + (cx - sx) * p * 0.72} y2={sy + (cy - sy) * p * 0.72} stroke={s.color} strokeWidth={4} strokeDasharray="10 10" opacity={0.8} />;
        })}
        <circle cx={cx} cy={cy} r={R} fill="rgba(4,16,22,.85)" stroke="rgba(255,255,255,.12)" strokeWidth={22} />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={V.red} strokeWidth={22} strokeLinecap="round" strokeDasharray={`${2 * Math.PI * R * fill} ${2 * Math.PI * R}`} transform={`rotate(-90 ${cx} ${cy})`} />
      </svg>
      <Img src={staticFile('img/floodway-mark.png')} style={{ position: 'absolute', left: 460 - 95, top: 460 - 80, width: 190, opacity: 1 - fill * 0.85 }} />
      <div style={{ position: 'absolute', left: 0, width: 920, top: 418, textAlign: 'center', fontFamily: HEAD, fontWeight: 800, fontSize: 56, color: V.white, opacity: fill }}>4 of 4<div style={{ fontSize: 26, color: V.red, letterSpacing: 4 }}>AGREE · WARN</div></div>
      {SIGNALS.map((s, i) => {
        const p = appear(t, 20.6 + i * 0.55, 0.6);
        return (
          <div key={s.name} style={{ position: 'absolute', left: s.x, top: s.y, width: 250, height: 90, borderRadius: 18, background: 'rgba(4,16,22,.9)', border: `2px solid ${s.color}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', opacity: p, transform: `scale(${0.85 + 0.15 * p})`, fontFamily: BODY, fontWeight: 700, fontSize: 27, color: V.white }}>
            <span style={{ width: 16, height: 16, borderRadius: '50%', background: s.color, flexShrink: 0 }} />{s.name}
          </div>
        );
      })}
    </Box>
  );
};

// ---------- 4 the river node, then the four signals on /live ----------

const LED = [['Green', V.safe, 28.5], ['Yellow', V.warn, 29.15], ['Red', V.red, 29.9]] as const;
const NodeAndLive: React.FC = () => {
  const t = useT();
  const [a, b] = sceneOf(4);
  const o = win(t, a, b);
  if (o <= 0) return null;
  const k = appear(t, 32.2, 0.7); // the node clip shrinks to make room for the phone
  const big = { x: 0, y: 150, w: 920, h: 518 }, small = { x: 0, y: 40, w: 430, h: 242 };
  const r = { x: big.x + (small.x - big.x) * k, y: big.y + (small.y - big.y) * k, w: big.w + (small.w - big.w) * k, h: big.h + (small.h - big.h) * k };
  const phoneSegs = (edit.phone as Record<string, Seg[]>)['4'];
  const ph = appear(t, 32.2, 0.6);
  return (
    <Box x={LEFT.x} y={LEFT.y} w={LEFT.w} h={LEFT.h} o={o}>
      <div style={{ position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.45)', border: `1.5px solid ${V.line}` }}>
        <Cuts segs={edit.nadi as Seg[]} w={r.w} h={r.h} />
      </div>
      <div style={{ position: 'absolute', left: r.x + 16, top: r.y + 16 }}><Tag color={V.safe} size={20 - 6 * k}>REAL FOOTAGE · BENCH TEST · TRIMMED</Tag></div>
      <div style={{ position: 'absolute', left: 0, top: 700, width: 920, display: 'flex', justifyContent: 'center', gap: 40, opacity: 1 - k }}>
        {LED.map(([name, color, at]) => {
          const on = appear(t, at, 0.15);
          return (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: HEAD, fontWeight: 800, fontSize: 44, color: on > 0.5 ? V.white : V.dim }}>
              <span style={{ width: 34, height: 34, borderRadius: '50%', background: color, opacity: 0.25 + 0.75 * on, boxShadow: on > 0.5 ? `0 0 30px ${color}` : 'none' }} />{name}
            </div>
          );
        })}
      </div>
      {ph > 0 && (
        <div style={{ position: 'absolute', left: 500, top: 0, opacity: ph, transform: `translateX(${(1 - ph) * 60}px)` }}>
          <Phone segs={phoneSegs} height={830} />
          <div style={{ position: 'absolute', left: -470, top: 300, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
            <Tag color={V.cyan}>2.5× SPEED</Tag>
            <Tag>DEMO STORM SCENARIO</Tag>
            <Tag>CAMERA: SAMPLE IMAGERY</Tag>
          </div>
        </div>
      )}
    </Box>
  );
};
const CHECKS = [['River node', 26.0], ['Rain warning', 33.68], ['Flood history', 34.92], ['Drain camera', 36.6]] as const;
const Checklist: React.FC = () => {
  const t = useT();
  return (
    <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {CHECKS.map(([name, at]) => {
        const p = appear(t, at, 0.35);
        return (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: BODY, fontWeight: 700, fontSize: 28, color: p > 0.5 ? V.white : V.dim }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, border: `2px solid ${p > 0.5 ? V.safe : V.dim}`, background: p > 0.5 ? V.safe : 'transparent', color: '#04140c', fontSize: 22, display: 'grid', placeItems: 'center' }}>{p > 0.5 ? '✓' : ''}</span>{name}
          </div>
        );
      })}
    </div>
  );
};

// ---------- 5 how 90 minutes works: the forecaster's own curve ----------

const STEPS = [['Rain warning', 'hours ahead', 41.82], ['Flood history', 'flags the street', 44.52], ['Sensor', 'crosses warning line', 49.02], ['Projection', 'water 2 h ahead', 52.58]] as const;
const Predict: React.FC = () => {
  const t = useT();
  const [a, b] = sceneOf(5);
  const o = win(t, a, b);
  if (o <= 0) return null;
  const fc = edit.forecast;
  const X = (m: number) => 120 + (m / 120) * 720;
  const Y = (v: number) => 820 - ((v - 0.8) / 0.9) * 400;
  const pts = fc.horizons_min.map((m, i) => [X(m), Y(fc.p50[i])] as const);
  const band = [...fc.horizons_min.map((m, i) => `${X(m)},${Y(fc.p90[i])}`), ...[...fc.horizons_min].reverse().map((m, j) => `${X(m)},${Y(fc.p10[fc.p10.length - 1 - j])}`)].join(' ');
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const draw = appear(t, 52.8, 2.6);
  const cross = appear(t, 55.82, 0.4);
  const bracket = appear(t, 57.0, 0.8);
  const big = appear(t, 62.84, 0.4);
  const dangerX = X(fc.time_to_danger_min!);
  const phone = (edit.phone as Record<string, Seg[]>)['5'];
  const ph = win(t, phone[0].start, phone[0].end, 0.25);
  return (
    <Box x={LEFT.x} y={LEFT.y} w={LEFT.w} h={LEFT.h} o={o}>
      <Card>
        <div style={{ position: 'absolute', left: 30, top: 34, right: 30, display: 'flex', gap: 14 }}>
          {STEPS.map(([title, sub, at], i) => {
            const p = appear(t, at, 0.45);
            return (
              <div key={title} style={{ flex: 1, padding: '16px 18px', borderRadius: 16, background: p > 0.5 ? 'rgba(77,208,225,.14)' : 'rgba(255,255,255,.04)', border: `2px solid ${p > 0.5 ? V.cyan : V.line}`, opacity: 0.35 + 0.65 * p }}>
                <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 18, color: V.cyan, letterSpacing: 2 }}>STEP {i + 1}</div>
                <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 26, color: V.white, marginTop: 4 }}>{title}</div>
                <div style={{ fontFamily: BODY, fontSize: 20, color: V.mist }}>{sub}</div>
              </div>
            );
          })}
        </div>
        <svg viewBox="0 0 920 920" width={920} height={920} style={{ position: 'absolute', inset: 0 }}>
          <line x1={X(0)} y1={820} x2={X(120)} y2={820} stroke="rgba(255,255,255,.3)" strokeWidth={2} />
          {fc.horizons_min.map((m) => <text key={m} x={X(m)} y={852} fill={V.mist} fontFamily={BODY} fontSize={20} textAnchor="middle">{m === 0 ? 'now' : `+${m}`}</text>)}
          <text x={X(120)} y={880} fill={V.mist} fontFamily={BODY} fontSize={18} textAnchor="end">minutes</text>
          <g opacity={appear(t, 52.58, 0.5)}>
            <line x1={X(0)} y1={Y(fc.danger_m)} x2={X(120)} y2={Y(fc.danger_m)} stroke={V.red} strokeWidth={3} strokeDasharray="12 10" />
            <text x={X(0)} y={Y(fc.danger_m) - 12} fill={V.red} fontFamily={BODY} fontWeight={800} fontSize={22} letterSpacing={3}>DANGER</text>
          </g>
          <polygon points={band} fill="rgba(77,208,225,.14)" opacity={draw} />
          <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={V.cyan} strokeWidth={6} strokeLinejoin="round" strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - draw)} />
          {pts.map((p, i) => appear(t, 52.8 + (i / (pts.length - 1)) * 2.6, 0.2) > 0 && <circle key={i} cx={p[0]} cy={p[1]} r={7} fill={V.cyan} />)}
          {cross > 0 && (
            <g opacity={cross}>
              <circle cx={dangerX} cy={Y(fc.p50[5])} r={14 + ((t * 1.5) % 1) * 20} fill="none" stroke={V.red} strokeWidth={3} opacity={1 - ((t * 1.5) % 1)} />
              <circle cx={dangerX} cy={Y(fc.p50[5])} r={12} fill={V.red} />
              <line x1={dangerX} y1={Y(fc.p50[5])} x2={dangerX} y2={820} stroke={V.red} strokeWidth={2} strokeDasharray="6 6" />
            </g>
          )}
          {bracket > 0 && (
            <g opacity={bracket}>
              <path d={`M ${X(0)} 770 L ${X(0)} 790 L ${X(0) + (dangerX - X(0)) * bracket} 790 L ${X(0) + (dangerX - X(0)) * bracket} 770`} stroke={V.warn} strokeWidth={4} fill="none" />
              <text x={(X(0) + dangerX) / 2} y={760} fill={V.warn} fontFamily={HEAD} fontWeight={800} fontSize={30 + 22 * big} textAnchor="middle">{big > 0 ? 'about 90 min left' : 'time left'}</text>
            </g>
          )}
        </svg>
        <div style={{ position: 'absolute', left: 30, top: 200, fontFamily: BODY, fontSize: 20, color: V.mist }}>Water level (m), storm input: {fc.level_m} m now, {fc.rain_mm_h} mm/h rain</div>
      </Card>
      {ph > 0 && (
        <div style={{ position: 'absolute', left: 690, top: 250, opacity: ph, transform: `scale(${0.9 + 0.1 * ph})` }}>
          <Phone segs={phone} height={560} />
        </div>
      )}
    </Box>
  );
};

// ---------- 6 accuracy: trained on the past, tested on the future ----------

const ALGOS = [['Logistic Regression', 0.836], ['CatBoost', 0.826], ['XGBoost', 0.822], ['Random Forest', 0.806], ['LightGBM', 0.8]] as const;
const INPUTS = ['Rain, 1 day before', 'Rain, 3 days', 'Rain, 7 days', 'Elevation', 'Slope'];
const Proof: React.FC = () => {
  const t = useT();
  const [a, b] = sceneOf(6);
  const o = win(t, a, b);
  if (o <= 0) return null;
  const big = appear(t, 81.66, 0.5);
  return (
    <Box x={LEFT.x} y={LEFT.y} w={LEFT.w} h={LEFT.h} o={o}>
      <Card style={{ padding: 40 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[2015, 2016, 2017, 2018, 2019, 2020, 2021].map((y) => {
            const test = y >= 2020;
            const p = appear(t, test ? 70.42 + (y - 2020) * 0.2 : 67.74 + (y - 2015) * 0.18, 0.4);
            const c = test ? V.warn : V.blue;
            return (
              <div key={y} style={{ flex: 1, height: 74, borderRadius: 12, background: p > 0 ? c : 'rgba(255,255,255,.05)', opacity: 0.3 + 0.7 * p, display: 'grid', placeItems: 'center', fontFamily: HEAD, fontWeight: 800, fontSize: 24, color: p > 0.5 ? '#04121a' : V.dim }}>{y}</div>
            );
          })}
        </div>
        <div style={{ display: 'flex', marginTop: 10, fontFamily: BODY, fontWeight: 800, fontSize: 20, letterSpacing: 2 }}>
          <div style={{ flex: 5, color: V.blue, opacity: appear(t, 67.74) }}>TRAIN · 330 RECORDS</div>
          <div style={{ flex: 2, color: V.warn, opacity: appear(t, 70.42), textAlign: 'right' }}>TEST · NEVER SEEN</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 34 }}>
          <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 20, color: V.cyan, letterSpacing: 2, alignSelf: 'center', marginRight: 6, opacity: appear(t, 75.96) }}>5 INPUTS</span>
          {INPUTS.map((x, i) => {
            const p = appear(t, 75.96 + i * 0.1, 0.35);
            return <span key={x} style={{ padding: '8px 16px', borderRadius: 999, border: `1.5px solid ${V.line}`, background: 'rgba(255,255,255,.06)', fontFamily: BODY, fontWeight: 600, fontSize: 21, color: V.white, opacity: p }}>{x}</span>;
          })}
        </div>
        <div style={{ marginTop: 34, fontFamily: BODY, fontWeight: 800, fontSize: 20, color: V.cyan, letterSpacing: 2, opacity: appear(t, 76.6) }}>5 ALGORITHMS · ROC-AUC ON 2020–21 FLOODS</div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ALGOS.map(([name, v], i) => {
            const p = appear(t, 76.6 + i * 0.22, 0.6);
            const best = i === 0;
            return (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 16, opacity: 0.2 + 0.8 * p }}>
                <div style={{ width: 250, fontFamily: BODY, fontWeight: 700, fontSize: 23, color: best ? V.white : V.mist }}>{name}</div>
                <div style={{ flex: 1, height: 30, borderRadius: 8, background: 'rgba(255,255,255,.06)' }}>
                  <div style={{ width: `${v * 100 * p}%`, height: '100%', borderRadius: 8, background: best ? V.cyan : 'rgba(183,208,214,.45)' }} />
                </div>
                <div style={{ width: 70, fontFamily: HEAD, fontWeight: 800, fontSize: 26, color: best ? V.cyan : V.mist }}>{v.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
        <div style={{ position: 'absolute', left: 40, right: 40, bottom: 34, display: 'flex', alignItems: 'center', gap: 28, opacity: big, transform: `translateY(${(1 - big) * 20}px)` }}>
          <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 104, lineHeight: 1, color: V.cyan, whiteSpace: 'nowrap' }}>84 in 100</div>
          <div style={{ fontFamily: BODY, fontSize: 23, lineHeight: 1.35, color: V.mist }}>times it ranks a real flood site above a random place (ROC-AUC 0.84). Its top 17 places were all real flood sites.</div>
        </div>
      </Card>
    </Box>
  );
};

// ---------- 7 route and report (app footage) ----------

const Guide: React.FC = () => {
  const t = useT();
  const [a, b] = sceneOf(7);
  const o = win(t, a, b);
  if (o <= 0) return null;
  const segs = (edit.phone as Record<string, Seg[]>)['7'];
  const s = segAt(segs, t);
  return (
    <Box x={LEFT.x} y={LEFT.y} w={LEFT.w} h={LEFT.h} o={o}>
      <div style={{ position: 'absolute', left: 250, top: 0 }}><Phone segs={segs} height={880} /></div>
      <div style={{ position: 'absolute', left: 0, top: 360, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
        {s?.badge && <Tag color={V.cyan}>{s.badge}</Tag>}
        {s?.note && <Tag>{s.note.toUpperCase()}</Tag>}
      </div>
    </Box>
  );
};

// ---------- 8 Huawei Cloud ----------

const SERVICES = [
  ['ModelArts', 'Trains the flood model', 97.96],
  ['OBS', 'Stores data, models and camera frames', 100.04],
  ['ECS', 'Hosts the FloodWay app online', 103.12],
  ['SMN', 'Sends flood alerts', 105.82],
] as const;
const Cloud: React.FC = () => {
  const t = useT();
  const [a, b] = sceneOf(8);
  const o = win(t, a, b);
  if (o <= 0) return null;
  return (
    <Box x={LEFT.x} y={LEFT.y + 60} w={LEFT.w} h={LEFT.h} o={o}>
      {SERVICES.map(([name, job, at], i) => {
        const p = appear(t, at, 0.5);
        return (
          <div key={name} style={{ position: 'absolute', left: (i % 2) * 470, top: Math.floor(i / 2) * 400, width: 440, height: 360, borderRadius: 26, background: V.card, border: `2px solid ${p > 0.5 ? 'rgba(224,36,47,.6)' : V.line}`, padding: 36, opacity: 0.15 + 0.85 * p, transform: `translateY(${(1 - p) * 30}px)`, boxShadow: '0 30px 70px rgba(0,0,0,.35)' }}>
            <Img src={staticFile('img/huawei-flower.png')} style={{ height: 64 }} />
            <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 64, color: V.white, marginTop: 30 }}>{name}</div>
            <div style={{ fontFamily: BODY, fontSize: 28, lineHeight: 1.35, color: V.mist, marginTop: 12 }}>{job}</div>
          </div>
        );
      })}
    </Box>
  );
};

// ---------- 9 end card ----------

const End: React.FC = () => {
  const t = useT();
  const [a] = sceneOf(9);
  const o = appear(t, a, 0.6);
  if (o <= 0) return null;
  const word = (w: string, at: number) => <span style={{ opacity: appear(t, at, 0.3), color: appear(t, at, 0.3) > 0.5 ? V.white : V.dim }}>{w} </span>;
  return (
    <AbsoluteFill style={{ opacity: o, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: `radial-gradient(1100px 700px at 50% 45%, ${V.bg1}, ${V.bg2} 80%)` }}>
      <Img src={staticFile('img/floodway-mark.png')} style={{ width: 170 }} />
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 150, lineHeight: 1, color: V.white, marginTop: 10 }}>Flood<span style={{ color: V.cyan }}>Way</span></div>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 60, marginTop: 24 }}>{word('Predict.', 109.22)}{word('Verify.', 110.26)}{word('Guide.', 110.96)}</div>
      <div style={{ marginTop: 50, display: 'flex', gap: 30, alignItems: 'center', padding: '18px 34px', borderRadius: 22, background: '#fff', opacity: appear(t, 111.3, 0.5) }}>
        <Img src={staticFile('img/uitm.png')} style={{ height: 84 }} />
        <Img src={staticFile('img/huawei.png')} style={{ height: 70 }} />
      </div>
      <div style={{ fontFamily: BODY, fontSize: 24, color: V.mist, marginTop: 26, opacity: appear(t, 111.5, 0.5) }}>RESQ4ACE · Universiti Teknologi MARA</div>
    </AbsoluteFill>
  );
};

export const FloodWayDemoV2: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: BODY }}>
    <style>{fontCss}</style>
    <Backdrop />
    <ShahAlamMap />
    <FourSignals />
    <NodeAndLive />
    <Predict />
    <Proof />
    <Guide />
    <Cloud />
    <Panel scene={1} tag="THE PROBLEM" head="Shah Alam floods again and again" body="26 reported floods between 2015 and 2021." />
    <Panel scene={2} tag="WHO IS HIT" head="Riverside families and highway riders" body="The same streets flood year after year." />
    <Panel scene={3} tag="MEET FLOODWAY" head="Warns only when four signals agree" body="Rain, flood history, a water sensor and a drain camera." />
    <Panel scene={4} tag="01 · SENSE" head="One river node, three more signals" chips={['ECS', 'OBS']}><Checklist /></Panel>
    <Panel scene={5} tag="02 · PREDICT" head="How we warn 90 minutes early" body="Time left is when the projected water first crosses danger." chips={['ModelArts', 'ECS']} />
    <Panel scene={6} tag="03 · PROOF" head="Tested on floods it never saw" body="Trained on 2015–2019, tested on 2020–2021." chips={['ModelArts', 'OBS']} />
    <Panel scene={7} tag="04 · GUIDE" head="Routes around the flood" body="To the nearest open relief centre. Every photo report is checked by AI." chips={['ECS', 'SMN']} />
    <Panel scene={8} tag="ON HUAWEI CLOUD" head="Runs on Huawei Cloud" body="Four services behind one flood warning." />
    <Foot a={0} b={sceneOf(2)[1]}>Source: public flood bulletins 2015–2021 (third-party compilation) · illustrated map, positions approximate</Foot>
    <Foot a={sceneOf(4)[0]} b={sceneOf(4)[1]}>Bench prototype of the river node, not a deployed sensor · the app side runs the in-app storm scenario</Foot>
    <Foot a={sceneOf(5)[0]} b={sceneOf(5)[1]}>Storm scenario · rule-based projection (FloodWay forecaster output), not a trained model</Foot>
    <Foot a={sceneOf(6)[0]} b={sceneOf(6)[1]}>500 records, 5 algorithms, retrospective test on past floods, not a live forecast · records: public flood bulletins (third-party compilation)</Foot>
    <Foot a={sceneOf(7)[0]} b={sceneOf(7)[1]}>Demo on our Kuala Lumpur data</Foot>
    <Captions />
    <End />
    <Audio src={staticFile('audio/v2mix.wav')} />
  </AbsoluteFill>
);
