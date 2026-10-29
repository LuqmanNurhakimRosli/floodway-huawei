// Shared pieces for the v2 demo: timing helpers, teal background, right-hand panel, word captions, phone, chips.
import React from 'react';
import { AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import edit from '../data/v2/edit.json';
import words from '../data/v2/words.json';

export const FPS = 30;
export const DURATION_S = 113.5;
export const f = (s: number) => Math.round(s * FPS);
/** Seconds since the start of the video. */
export const useT = () => useCurrentFrame() / FPS;

export const V = {
  bg1: '#0e3b47',
  bg2: '#061c24',
  card: 'rgba(8,36,45,.82)',
  line: 'rgba(255,255,255,.10)',
  cyan: '#4dd0e1',
  mist: '#b7d0d6',
  dim: 'rgba(255,255,255,.32)',
  white: '#ffffff',
  red: '#ef4444',
  warn: '#f59e0b',
  safe: '#22c55e',
  blue: '#3b82f6',
  huawei: '#e0242f',
};
export const HEAD = 'Outfit, Inter, sans-serif';
export const BODY = 'Inter, sans-serif';
export const LEFT = { x: 90, y: 80, w: 920, h: 920 };
export const RIGHT = { x: 1090, w: 750 };

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = Easing.out(Easing.cubic);
/** 0 -> 1 eased, starting at `a` seconds, over `d` seconds. */
export const appear = (t: number, a: number, d = 0.5) => easeOut(clamp((t - a) / d));
/** Visible between a and b, fading in and out. */
export const win = (t: number, a: number, b: number, fade = 0.4) => Math.min(appear(t, a, fade), 1 - clamp((t - (b - fade)) / fade));

export type Seg = { file: string; from: number; to: number; start: number; end: number; rate: number; badge?: string; note?: string };
export const scenes = edit.scenes as unknown as Record<string, [number, number]>;
export const sceneOf = (n: number) => scenes[String(n)];
export { edit };

/** Recorded footage cut onto the timeline (absolute times), filling its box. */
export const Cuts: React.FC<{ segs: Seg[]; w: number; h: number; muted?: boolean }> = ({ segs, w, h }) => (
  <>
    {segs.map((s) => (
      <Sequence key={`${s.file}-${s.from}`} from={f(s.start)} durationInFrames={f(s.end) - f(s.start)} layout="none">
        <OffthreadVideo src={staticFile(`footage/${s.file}`)} startFrom={f(s.from)} endAt={f(s.to) + 2} playbackRate={s.rate} muted
          style={{ position: 'absolute', inset: 0, width: w, height: h, objectFit: 'cover' }} />
      </Sequence>
    ))}
  </>
);

/** Phone frame around recorded app footage (390x844 CSS px viewport). */
export const Phone: React.FC<{ segs: Seg[]; height: number }> = ({ segs, height }) => {
  const w = (height * 390) / 844;
  const bezel = Math.round(height * 0.018);
  return (
    <div style={{ width: w + bezel * 2, height: height + bezel * 2, borderRadius: bezel * 4.2, background: '#04080c', padding: bezel, boxShadow: '0 40px 90px rgba(0,0,0,.5), 0 0 0 2px rgba(255,255,255,.08) inset' }}>
      <div style={{ position: 'relative', width: w, height, borderRadius: bezel * 3.2, overflow: 'hidden', background: '#fff' }}>
        <Cuts segs={segs} w={w} h={height} />
      </div>
    </div>
  );
};

/** The segment playing at time t, if any. */
export const segAt = (segs: Seg[], t: number) => segs.find((s) => t >= s.start && t < s.end);

/** Small honesty label. */
export const Tag: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = V.warn, size = 20 }) => (
  <span style={{ display: 'inline-block', padding: `${size * 0.35}px ${size * 0.75}px`, borderRadius: 9, background: 'rgba(4,16,22,.82)', border: `2px solid ${color}`, color: V.white, fontFamily: BODY, fontWeight: 700, fontSize: size, letterSpacing: 1.4, whiteSpace: 'nowrap' }}>{children}</span>
);

/** Huawei Cloud service chip, as in the reference video. */
export const ServiceChip: React.FC<{ name: string; o?: number }> = ({ name, o = 1 }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '9px 18px 9px 12px', borderRadius: 999, background: 'rgba(255,255,255,.07)', border: `1.5px solid ${V.line}`, fontFamily: BODY, fontWeight: 700, fontSize: 24, color: V.white, opacity: o, transform: `translateY(${(1 - o) * 10}px)` }}>
    <Img src={staticFile('img/huawei-flower.png')} style={{ height: 26 }} />
    {name}
  </span>
);

/** Dark teal backdrop with slow rain. */
export const Backdrop: React.FC = () => {
  const fr = useCurrentFrame();
  const drops = Array.from({ length: 70 }, (_, i) => {
    const x = (i * 263.7) % 1920;
    const speed = 9 + (i % 5) * 2;
    const y = ((i * 97 + fr * speed) % 1240) - 120;
    return <div key={i} style={{ position: 'absolute', left: x - y * 0.12, top: y, width: 1.5, height: 26 + (i % 4) * 8, background: 'rgba(190,235,245,.10)', transform: 'rotate(7deg)' }} />;
  });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1300px 900px at 30% 40%, ${V.bg1}, ${V.bg2} 75%)`, overflow: 'hidden' }}>
      {drops}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.45))' }} />
    </AbsoluteFill>
  );
};

/** Right-hand text panel for one scene: chapter tag, headline, body, Huawei chips. */
export const Panel: React.FC<{ scene: number; tag: string; head: string; body?: string; chips?: string[]; children?: React.ReactNode }> = ({ scene, tag, head, body, chips = [], children }) => {
  const t = useT();
  const [a, b] = sceneOf(scene);
  const o = win(t, a, b);
  if (o <= 0) return null;
  const h = appear(t, a + 0.1, 0.6);
  return (
    <div style={{ position: 'absolute', left: RIGHT.x, top: 150, width: RIGHT.w, opacity: o }}>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 22, letterSpacing: 5, color: V.cyan, opacity: appear(t, a, 0.4) }}>{tag}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 68, lineHeight: 1.06, color: V.white, marginTop: 16, opacity: h, transform: `translateY(${(1 - h) * 24}px)` }}>{head}</div>
      {body && <div style={{ fontFamily: BODY, fontSize: 29, lineHeight: 1.4, color: V.mist, marginTop: 22, opacity: appear(t, a + 0.35, 0.6) }}>{body}</div>}
      {chips.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginTop: 26 }}>
          {chips.map((c, i) => <ServiceChip key={c} name={c} o={appear(t, a + 0.6 + i * 0.15, 0.5)} />)}
        </div>
      )}
      {children}
    </div>
  );
};

type Word = (typeof words.words)[number];
const sentences: Word[][] = [];
for (const w of words.words) {
  if (w.scene === 9) continue; // the end card shows its own line
  const cur = sentences[sentences.length - 1];
  if (!cur || /[.?]$/.test(cur[cur.length - 1].w) || cur[0].scene !== w.scene) sentences.push([w]);
  else cur.push(w);
}

/** The sentence being spoken, bottom right; spoken words bright, the rest dim. */
export const Captions: React.FC = () => {
  const t = useT();
  const i = sentences.findIndex((s, k) => t >= s[0].a - 0.2 && t < Math.min(s[s.length - 1].b + 0.9, k + 1 < sentences.length ? sentences[k + 1][0].a - 0.2 : Infinity));
  if (i < 0) return null;
  const s = sentences[i];
  const o = Math.min(appear(t, s[0].a - 0.2, 0.2), 1 - appear(t, s[s.length - 1].b + 0.6, 0.3));
  return (
    <div style={{ position: 'absolute', left: RIGHT.x, width: RIGHT.w, bottom: 92, fontFamily: HEAD, fontWeight: 700, fontSize: 40, lineHeight: 1.28, opacity: o }}>
      {s.map((w, k) => (
        <span key={k} style={{ color: t >= w.a - 0.04 ? V.white : V.dim }}>{w.w} </span>
      ))}
    </div>
  );
};

/** Small source / disclosure line under the left area. */
export const Foot: React.FC<{ a: number; b: number; children: React.ReactNode }> = ({ a, b, children }) => {
  const t = useT();
  const o = win(t, a, b);
  if (o <= 0) return null;
  return <div style={{ position: 'absolute', left: LEFT.x, top: 1022, width: 1750, fontFamily: BODY, fontSize: 19, color: V.mist, opacity: 0.85 * o }}>{children}</div>;
};
