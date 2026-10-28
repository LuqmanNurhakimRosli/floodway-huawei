// Scene 3: SAMPLE river camera (AI-generated ladder frames), then Nadi's real node clip, with a water gauge.
import React from 'react';
import { AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { BODY, C, f, HEAD, scene, segmentsOf } from './theme';
import { Tag } from './parts';

const RUNGS = [30, 40, 50, 60, 70];

/** Crossfade up the sample camera's water-height ladder. */
const SampleCamera: React.FC<{ dur: number }> = ({ dur }) => {
  const fr = useCurrentFrame();
  const pos = interpolate(fr, [0, dur], [0, RUNGS.length - 1], { extrapolateRight: 'clamp' });
  const zoom = interpolate(fr, [0, dur], [1, 1.06]);
  return (
    <div style={{ position: 'relative', width: 960, height: 540, borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.55)' }}>
      {RUNGS.map((r, i) => (
        <Img key={r} src={staticFile(`img/klang-r${String(r).padStart(3, '0')}.webp`)} style={{ position: 'absolute', inset: 0, width: 960, height: 540, opacity: Math.max(0, Math.min(1, pos - i + 1)), transform: `scale(${zoom})` }} />
      ))}
      <div style={{ position: 'absolute', left: 20, top: 20 }}><Tag>SAMPLE · AI-generated camera image</Tag></div>
    </div>
  );
};

/** Vertical gauge with danger / warning / normal lines. */
const Gauge: React.FC<{ level: number; color: string; label: string }> = ({ level, color, label }) => (
  <div style={{ width: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
    <div style={{ position: 'relative', width: 90, height: 560, borderRadius: 45, background: 'rgba(255,255,255,.08)', border: '2px solid rgba(255,255,255,.18)', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${level}%`, background: `linear-gradient(${color}, ${color}aa)` }} />
      {[[80, C.alert], [50, C.warn], [20, C.safe]].map(([p, c]) => <div key={p as number} style={{ position: 'absolute', left: 0, right: 0, bottom: `${p}%`, height: 3, background: c as string }} />)}
    </div>
    <div style={{ fontFamily: HEAD, fontWeight: 800, fontSize: 64, color }}>{Math.round(level)}%</div>
    <div style={{ fontFamily: BODY, fontWeight: 700, fontSize: 26, letterSpacing: 2, color }}>{label}</div>
  </div>
);

export const River: React.FC = () => {
  const fr = useCurrentFrame();
  const sc = scene(3);
  const segs = segmentsOf(3);
  const clipIn = f(segs[0].start - sc.start);
  const yellowAt = f(segs[1].start - sc.start);
  const redAt = f(segs[2].start - sc.start);
  // Gauge follows the node's own LCD: SAFE 35%, WARNING 58%, DANGER 81%.
  const level = fr < clipIn
    ? interpolate(fr, [0, clipIn], [24, 33])
    : interpolate(fr, [clipIn, yellowAt, redAt, redAt + f(1.2)], [35, 58, 70, 81], { extrapolateRight: 'clamp' });
  const [color, label] = fr < yellowAt ? [C.safe, 'SAFE'] : fr < redAt ? [C.warn, 'WARNING'] : [C.alert, 'DANGER'];
  const cardIn = interpolate(fr, [clipIn - 6, clipIn + 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(160deg, #07111f, #0b1a2c 60%, #08121f)' }}>
      <AbsoluteFill style={{ padding: '110px 0 0 150px' }}>
        <Sequence durationInFrames={clipIn + 6} layout="none">
          <div style={{ opacity: 1 - cardIn }}>
            <SampleCamera dur={clipIn} />
            <div style={{ marginTop: 22, fontFamily: BODY, fontSize: 28, color: C.mist }}>River camera, Kampung Baru · sample footage</div>
          </div>
        </Sequence>
        <Sequence from={clipIn - 6} layout="none">
          <div style={{ position: 'absolute', left: 150, top: 110, opacity: cardIn }}>
            <div style={{ position: 'relative', width: 1152, height: 648, borderRadius: 24, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.55)', background: '#000' }}>
              {segs.map((s) => (
                <Sequence key={s.from} from={f(s.start - sc.start) - (clipIn - 6)} durationInFrames={f(s.end - s.start)} layout="none">
                  <OffthreadVideo src={staticFile(`footage/${s.file}`)} startFrom={f(s.from)} endAt={f(s.to)} playbackRate={s.rate} muted style={{ width: 1152, height: 648 }} />
                  {s.badge && <div style={{ position: 'absolute', right: 20, top: 20 }}><Tag color={C.cyan}>{s.badge.toUpperCase()}</Tag></div>}
                </Sequence>
              ))}
              <div style={{ position: 'absolute', left: 20, top: 20 }}><Tag color={C.safe}>REAL FOOTAGE · BENCH TEST</Tag></div>
            </div>
            <div style={{ marginTop: 22, fontFamily: BODY, fontSize: 28, color: C.mist }}>FloodWay river node prototype: ultrasonic sensor, LCD, lights and buzzer</div>
          </div>
        </Sequence>
      </AbsoluteFill>
      <div style={{ position: 'absolute', right: 150, top: 150 }}>
        <Gauge level={level} color={color} label={label} />
      </div>
    </AbsoluteFill>
  );
};
