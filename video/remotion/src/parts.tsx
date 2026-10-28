// Shared pieces: phone frame with recorded app footage, tap ripples, callout chips, captions, scene fade.
import React from 'react';
import { AbsoluteFill, Easing, Freeze, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BODY, C, edit, f, HEAD, scene, segmentsOf, timeline, type Segment } from './theme';

const SCREEN = { w: 390, h: 844 }; // CSS px of the recorded phone viewport

/** Recorded app footage for one segment, sized to the phone screen. */
const Footage: React.FC<{ s: Segment; w: number; h: number }> = ({ s, w, h }) => {
  const style: React.CSSProperties = { width: w, height: h, objectFit: 'cover' };
  return <OffthreadVideo src={staticFile(`footage/${s.file}`)} startFrom={f(s.from)} endAt={f(s.to)} playbackRate={s.rate} muted style={style} />;
};

/** A phone playing the scene's app segments back to back, with a ripple wherever the recorder tapped. */
export const Phone: React.FC<{ sceneNo: number; height: number; children?: React.ReactNode }> = ({ sceneNo, height, children }) => {
  const sc = scene(sceneNo);
  const segs = segmentsOf(sceneNo).filter((s) => s.phone);
  const w = (height * SCREEN.w) / SCREEN.h;
  const k = height / SCREEN.h;
  const bezel = Math.round(height * 0.018);
  const taps = edit.taps.filter((t) => t.t >= sc.start && t.t < sc.end);
  return (
    <div style={{ position: 'relative', width: w + bezel * 2, height: height + bezel * 2, borderRadius: bezel * 4.2, background: '#05070d', padding: bezel, boxShadow: '0 40px 90px rgba(0,0,0,.55), 0 0 0 2px rgba(255,255,255,.08) inset' }}>
      <div style={{ position: 'relative', width: w, height, borderRadius: bezel * 3.2, overflow: 'hidden', background: '#fff' }}>
        {segs.map((s) => {
          const from = f(s.start - sc.start);
          const dur = f(s.end - s.start);
          return (
            <React.Fragment key={`${s.file}-${s.from}`}>
              <Sequence from={from} durationInFrames={dur} layout="none">
                <Footage s={s} w={w} h={height} />
              </Sequence>
              {s.hold_last && (
                <Sequence from={from + dur} layout="none">
                  <Freeze frame={dur - 1}>
                    <Footage s={s} w={w} h={height} />
                  </Freeze>
                </Sequence>
              )}
            </React.Fragment>
          );
        })}
        {taps.map((t) => (
          <Sequence key={t.t} from={f(t.t - sc.start)} durationInFrames={f(0.6)} layout="none">
            <Ripple x={t.x * k} y={t.y * k} />
          </Sequence>
        ))}
        {children}
      </div>
    </div>
  );
};

const Ripple: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const fr = useCurrentFrame();
  const p = interpolate(fr, [0, f(0.6)], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const size = 26 + 70 * p;
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', border: `4px solid rgba(22,119,255,${0.9 * (1 - p)})`, background: `rgba(22,119,255,${0.25 * (1 - p)})` }} />
  );
};

/** A chip that springs in at `at` (frames into the scene). */
export const Chip: React.FC<{ at: number; color: string; children: React.ReactNode; size?: number; dark?: boolean }> = ({ at, color, children, size = 30, dark = true }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: fr - at, fps, config: { damping: 18, stiffness: 160 } });
  if (fr < at) return null;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, padding: `${size * 0.42}px ${size * 0.8}px`, borderRadius: 999, background: dark ? 'rgba(15,23,42,.72)' : '#fff', border: `2px solid ${color}`, color: dark ? C.white : C.navy, fontFamily: BODY, fontWeight: 650, fontSize: size, opacity: s, transform: `translateY(${(1 - s) * 18}px)`, boxShadow: '0 12px 30px rgba(0,0,0,.25)' }}>
      <span style={{ width: size * 0.42, height: size * 0.42, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {children}
    </div>
  );
};

/** Small honesty label, e.g. SAMPLE or DEMO. */
export const Tag: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.warn }) => (
  <span style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 10, background: 'rgba(15,23,42,.78)', border: `2px solid ${color}`, color: C.white, fontFamily: BODY, fontWeight: 700, fontSize: 24, letterSpacing: 1.5 }}>{children}</span>
);

/** Left-column heading for app scenes. */
export const Heading: React.FC<{ kicker: string; lines: string[]; at?: number }> = ({ kicker, lines, at = 0 }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: fr - at, fps, config: { damping: 20, stiffness: 120 } });
  return (
    <div style={{ opacity: s, transform: `translateX(${(1 - s) * -40}px)` }}>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 26, letterSpacing: 4, color: C.kicker }}>{kicker}</div>
      <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 78, lineHeight: 1.05, color: C.white, marginTop: 14 }}>
        {lines.map((l) => <div key={l}>{l}</div>)}
      </div>
    </div>
  );
};

// Words to colour in captions, per line.
const KEY: Record<string, [RegExp, string][]> = {
  s02: [[/rain/i, C.cyan]],
  s03: [[/river node prototype/i, C.cyan]],
  s04a: [[/Green/, C.safe]],
  s04b: [[/Yellow/, C.warn]],
  s04c: [[/Red/, C.alert], [/climbing fast/i, C.alert]],
  s05: [[/four things/i, C.cyan]],
  s06: [[/turns red/i, C.alert]],
  s07: [[/Leave now/i, C.alert]],
  s08: [[/ninety minutes/i, C.warn]],
  s09: [[/full/i, C.warn]],
  s10: [[/open/i, C.safe], [/around the flooded road/i, C.safe]],
  s11: [[/into the water/i, C.alert]],
  s12: [[/safe/i, C.safe]],
  s13: [[/doesn't know/i, C.warn]],
  s14: [[/AI/, C.cyan], [/a person/i, C.safe]],
  s15: [[/two kilometres/i, C.cyan]],
  s16: [[/Ninety minutes/i, C.cyan]],
};

function colour(id: string, text: string): React.ReactNode[] {
  let parts: React.ReactNode[] = [text];
  for (const [re, color] of KEY[id] ?? []) {
    parts = parts.flatMap((p, i) => {
      if (typeof p !== 'string') return [p];
      const m = p.match(re);
      if (!m || m.index === undefined) return [p];
      return [p.slice(0, m.index), <span key={`${id}-${i}-${m[0]}`} style={{ color }}>{m[0]}</span>, p.slice(m.index + m[0].length)];
    });
  }
  return parts;
}

/** One sentence at a time, synced to the voice. Absolute frames (place at the top level). */
export const Captions: React.FC = () => {
  const fr = useCurrentFrame();
  const cues = timeline.cues;
  const i = cues.findIndex((c, k) => fr >= f(c.start) - 3 && fr < Math.min(f(c.end) + 12, k + 1 < cues.length ? f(cues[k + 1].start) - 3 : Infinity));
  if (i < 0 || cues[i].scene === 9) return null; // the end card shows its line as the tagline
  const c = cues[i];
  const p = interpolate(fr, [f(c.start) - 3, f(c.start) + 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const out = interpolate(fr, [f(c.end) + 6, f(c.end) + 12], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // App scenes keep the phone clear: their captions sit in the left column (scene 8 after its drawn opening).
  const left = [4, 6, 7].includes(c.scene) || (c.scene === 8 && c.id !== 's13');
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: left ? 'flex-start' : 'center', padding: left ? '0 0 80px 150px' : '0 0 56px 0', pointerEvents: 'none' }}>
      <div style={{ maxWidth: left ? 900 : 1500, textAlign: left ? 'left' : 'center', padding: '16px 34px', borderRadius: 18, background: 'rgba(5,8,15,.72)', backdropFilter: 'blur(8px)', fontFamily: HEAD, fontWeight: 700, fontSize: left ? 46 : 50, lineHeight: 1.2, color: C.white, opacity: Math.min(p, out), transform: `translateY(${(1 - p) * 14}px)` }}>
        {colour(c.id, c.text)}
      </div>
    </AbsoluteFill>
  );
};

/** Fades a scene in from black over its first frames. */
export const FadeIn: React.FC<{ frames?: number; children: React.ReactNode }> = ({ frames = 8, children }) => {
  const fr = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(fr, [0, frames], [0, 1], { extrapolateRight: 'clamp' }) }}>{children}</AbsoluteFill>;
};

/** Dark navy stage with a soft glow, for the app scenes. */
export const Stage: React.FC<{ glow?: string; children: React.ReactNode }> = ({ glow = C.teal, children }) => {
  const fr = useCurrentFrame();
  const drift = Math.sin(fr / 90) * 30;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 900px at ${1350 + drift}px 480px, ${glow}33, transparent 60%), linear-gradient(160deg, #0b1220, #0f172a 55%, #0a101c)` }}>
      {children}
    </AbsoluteFill>
  );
};
