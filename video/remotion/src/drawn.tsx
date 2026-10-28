// Illustrated (stylised) scenes: the car at night, the flooded street, the logo sting and the end card.
import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { BODY, C, f, HEAD } from './theme';

/** Rain streaks falling across the frame. */
export const Rain: React.FC<{ count?: number; seed?: string; opacity?: number; angle?: number }> = ({ count = 140, seed = 'rain', opacity = 0.5, angle = 12 }) => {
  const fr = useCurrentFrame();
  return (
    <AbsoluteFill style={{ transform: `rotate(${angle}deg) scale(1.2)` }}>
      {Array.from({ length: count }, (_, i) => {
        const x = random(`${seed}x${i}`) * 1920;
        const speed = 38 + random(`${seed}s${i}`) * 30;
        const len = 40 + random(`${seed}l${i}`) * 70;
        const y = ((random(`${seed}y${i}`) * 1300 + fr * speed) % 1400) - 200;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 2, height: len, background: `linear-gradient(transparent, rgba(190,215,255,${opacity}))` }} />;
      })}
    </AbsoluteFill>
  );
};

/** Night windscreen: traffic jam bokeh, drops, wiper, dashboard and clock. `flashAt` is a lightning frame. */
export const CarNight: React.FC<{ flashAt?: number; clock?: string; children?: React.ReactNode }> = ({ flashAt, clock = '11:00 PM', children }) => {
  const fr = useCurrentFrame();
  const drift = interpolate(fr, [0, f(12)], [1.0, 1.06]);
  const flash = flashAt === undefined ? 0 : interpolate(fr - flashAt, [0, 2, 5, 7, 16], [0, 0.85, 0.2, 0.6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const wiperPeriod = f(1.9);
  const wp = (fr % wiperPeriod) / wiperPeriod;
  const wiper = interpolate(Math.sin(wp * Math.PI * 2 - Math.PI / 2), [-1, 1], [-78, 8]);
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(#050a16, #0b1424 55%, #111827)', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${drift})` }}>
        {/* city glow and road */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 360, height: 260, background: 'radial-gradient(900px 160px at 960px 140px, rgba(255,170,90,.18), transparent 70%)' }} />
        <div style={{ position: 'absolute', left: 260, right: 260, top: 560, height: 420, background: 'linear-gradient(#0d1322, #1a2233)', clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)' }} />
        {/* tail lights of the jam: pairs of red bokeh, brake lights pulse */}
        {Array.from({ length: 18 }, (_, i) => {
          const row = random(`row${i}`);
          const y = 560 + row * 170;
          const spread = 120 + row * 520;
          const x = 960 + (random(`x${i}`) - 0.5) * spread * 2;
          const size = 14 + row * 46;
          const brake = 0.55 + 0.45 * Math.max(0, Math.sin(fr / (18 + i) + i));
          return [-1, 1].map((side) => (
            <div key={`${i}${side}`} style={{ position: 'absolute', left: x + side * size * 1.6 - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,60,50,${brake}), rgba(255,30,30,0) 70%)`, filter: `blur(${2 + row * 5}px)` }} />
          ));
        })}
        {/* headlights from the other side */}
        {Array.from({ length: 5 }, (_, i) => {
          const x = 1300 + ((fr * (6 + i) + i * 300) % 900);
          return <div key={`h${i}`} style={{ position: 'absolute', left: x, top: 600 + i * 12, width: 60, height: 60, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,245,210,.55), transparent 70%)', filter: 'blur(6px)' }} />;
        })}
      </AbsoluteFill>
      {/* drops on the glass */}
      {Array.from({ length: 70 }, (_, i) => {
        const x = random(`dx${i}`) * 1920;
        const y = (random(`dy${i}`) * 820 + fr * (0.4 + random(`dv${i}`) * 1.2)) % 840;
        const r = 3 + random(`dr${i}`) * 9;
        return <div key={`d${i}`} style={{ position: 'absolute', left: x, top: y, width: r * 2, height: r * 2.3, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,.55), rgba(150,180,220,.15) 60%, transparent 70%)' }} />;
      })}
      <Rain count={120} opacity={0.35} />
      {/* wiper */}
      <div style={{ position: 'absolute', left: 640, top: 900, width: 980, height: 14, borderRadius: 7, background: '#05070c', transformOrigin: '0 50%', transform: `rotate(${wiper}deg)`, boxShadow: '0 0 10px rgba(0,0,0,.6)' }} />
      {/* dashboard */}
      <div style={{ position: 'absolute', left: -100, right: -100, top: 830, height: 400, background: 'linear-gradient(#0a0d14, #020305)', borderTopLeftRadius: '50% 120px', borderTopRightRadius: '50% 120px' }} />
      <div style={{ position: 'absolute', left: 200, top: 860, width: 640, height: 640, borderRadius: '50%', border: '46px solid #05070b', boxShadow: '0 0 0 2px rgba(255,255,255,.05)' }} />
      <div style={{ position: 'absolute', left: 1440, top: 880, padding: '10px 26px', borderRadius: 14, background: '#03141a', border: '1px solid rgba(77,208,225,.35)', fontFamily: HEAD, fontWeight: 700, fontSize: 40, color: C.cyan, textShadow: '0 0 14px rgba(77,208,225,.7)' }}>{clock}</div>
      {children}
      <AbsoluteFill style={{ background: '#dfe8ff', opacity: flash, mixBlendMode: 'screen' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55))' }} />
      <div style={{ position: 'absolute', right: 40, top: 36 }}><Illustration /></div>
    </AbsoluteFill>
  );
};

/** Corner note: these scenes are drawn, not filmed. */
export const Illustration: React.FC = () => (
  <span style={{ fontFamily: BODY, fontSize: 20, fontWeight: 600, letterSpacing: 2, color: 'rgba(255,255,255,.55)' }}>ILLUSTRATION</span>
);

/** Night street with a flooded road, someone holding up a phone. */
export const FloodedStreet: React.FC = () => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const raise = spring({ frame: fr - f(1.2), fps, config: { damping: 16, stiffness: 90 } });
  const flash = interpolate(fr - f(3.6), [0, 2, 8], [0, 0.9, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(#060b18, #0d1628 50%, #0b1220)', overflow: 'hidden' }}>
      {/* houses */}
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} style={{ position: 'absolute', left: i * 290 - 40, top: 330 + (i % 3) * 30, width: 260, height: 360, background: '#0a1120', borderTop: '3px solid #16213a' }}>
          {Array.from({ length: 4 }, (_, j) => <div key={j} style={{ position: 'absolute', left: 30 + (j % 2) * 120, top: 50 + Math.floor(j / 2) * 110, width: 70, height: 60, background: random(`w${i}${j}`) > 0.45 ? 'rgba(255,196,110,.55)' : '#121b2e' }} />)}
        </div>
      ))}
      {/* street lights */}
      {[300, 980, 1640].map((x) => <div key={x} style={{ position: 'absolute', left: x - 160, top: 200, width: 320, height: 520, background: 'radial-gradient(ellipse at 50% 10%, rgba(255,200,120,.25), transparent 60%)' }} />)}
      {/* flood water with moving reflections */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 660, bottom: 0, background: 'linear-gradient(#1b3550, #0c1a2c)' }}>
        {Array.from({ length: 26 }, (_, i) => {
          const y = 20 + random(`ry${i}`) * 380;
          const x = ((random(`rx${i}`) * 2200 + fr * (1 + random(`rv${i}`) * 2)) % 2200) - 140;
          return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 120 + random(`rw${i}`) * 200, height: 3, borderRadius: 2, background: 'rgba(255,210,150,.35)' }} />;
        })}
      </div>
      <Rain count={110} opacity={0.4} seed="street" />
      {/* hand + phone rising into view */}
      <div style={{ position: 'absolute', left: 1180, top: 1080 - raise * 560, width: 300, height: 600, borderRadius: 46, background: '#05070d', border: '10px solid #1e293b', transform: `rotate(${-8 + raise * 6}deg)`, boxShadow: '0 30px 70px rgba(0,0,0,.6)' }}>
        <div style={{ position: 'absolute', inset: 14, borderRadius: 32, background: 'linear-gradient(#1b3550, #0c1a2c)' }} />
      </div>
      <AbsoluteFill style={{ background: '#fff', opacity: flash }} />
      <div style={{ position: 'absolute', right: 40, top: 36 }}><Illustration /></div>
    </AbsoluteFill>
  );
};

/** Logo row used by the sting and the end card. Logos are drawn at or below their native size. */
const Logos: React.FC<{ at: number }> = ({ at }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = (d: number) => spring({ frame: fr - at - d, fps, config: { damping: 14, stiffness: 140 } });
  const card = (src: string, w: number, d: number) => (
    <div style={{ opacity: pop(d), transform: `scale(${0.8 + 0.2 * pop(d)})`, padding: '18px 28px', borderRadius: 22, background: '#fff', boxShadow: '0 16px 40px rgba(15,23,42,.12)' }}>
      <Img src={staticFile(src)} style={{ width: w, display: 'block' }} />
    </div>
  );
  return (
    <div style={{ display: 'flex', gap: 48, alignItems: 'center' }}>
      {card('img/uitm.png', 330, 0)}
      {card('img/huawei.png', 300, 6)}
    </div>
  );
};

const Wordmark: React.FC<{ at: number; size?: number }> = ({ at, size = 150 }) => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: fr - at, fps, config: { damping: 15, stiffness: 120 } });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, opacity: s, transform: `translateY(${(1 - s) * 30}px) scale(${0.92 + 0.08 * s})` }}>
      <Img src={staticFile('img/floodway-mark.png')} style={{ height: size * 0.95 }} />
      <span style={{ fontFamily: HEAD, fontWeight: 800, fontSize: size, letterSpacing: -2 }}>
        <span style={{ color: C.tealDark }}>Flood</span>
        <span style={{ color: C.teal }}>Way</span>
      </span>
    </div>
  );
};

export const Sting: React.FC = () => {
  const fr = useCurrentFrame();
  const out = interpolate(fr, [f(6.2), f(7)], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
  const flash = interpolate(fr, [f(6.5), f(6.7), f(7)], [0, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ opacity: out }}>
        <Img src={staticFile('img/huawei-bg.png')} style={{ width: 1920, height: 1080 }} />
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 56 }}>
          <Logos at={f(0.4)} />
          <Wordmark at={f(1.4)} />
          <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 34, color: C.slate, opacity: interpolate(fr, [f(2.4), f(3)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
            Huawei ICT Competition 2026–2027 · UiTM RESQ4ACE
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#e8efff', opacity: flash }} />
    </AbsoluteFill>
  );
};

export const EndCard: React.FC = () => {
  const fr = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Img src={staticFile('img/huawei-bg.png')} style={{ width: 1920, height: 1080 }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 50, paddingBottom: 120 }}>
        <Wordmark at={f(0.2)} size={130} />
        <div style={{ fontFamily: HEAD, fontWeight: 700, fontSize: 64, color: C.navy, opacity: interpolate(fr, [f(2), f(2.8)], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
          Ninety minutes that change the night.
        </div>
        <Logos at={f(0.9)} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
