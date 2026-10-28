// The 2-minute FloodWay demo: one <Sequence> per scene from timeline.json, captions on top, one mixed audio track.
import React from 'react';
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { BODY, C, cueAt, f, marker, timeline } from './theme';
import { Captions, Chip, FadeIn, Heading, Phone, Stage, Tag } from './parts';
import { CarNight, EndCard, FloodedStreet, Sting } from './drawn';
import { River } from './River';

const fontCss = `
@font-face { font-family: 'Inter'; src: url('${staticFile('fonts/Inter-Variable.ttf')}') format('truetype'); font-weight: 100 900; }
@font-face { font-family: 'Outfit'; src: url('${staticFile('fonts/Outfit-Variable.ttf')}') format('truetype'); font-weight: 100 900; }
`;

/** App scene layout: heading and chips on the left, the phone on the right. */
const AppScene: React.FC<{ n: number; kicker: string; lines: string[]; glow?: string; chips?: React.ReactNode; note?: string }> = ({ n, kicker, lines, glow, chips, note }) => (
  <Stage glow={glow}>
    <div style={{ position: 'absolute', left: 150, top: 170, width: 860 }}>
      <Heading kicker={kicker} lines={lines} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 22, marginTop: 50 }}>{chips}</div>
    </div>
    {note && <div style={{ position: 'absolute', left: 150, top: 92 }}><Tag color={C.mist}>{note}</Tag></div>}
    <div style={{ position: 'absolute', right: 230, top: 50 }}>
      <Phone sceneNo={n} height={880} />
    </div>
  </Stage>
);

/** Scene 5: the same car, the phone on its dash mount lights up with the recorded 'Leave now' alert. */
const Alert: React.FC = () => {
  const fr = useCurrentFrame();
  const { fps } = useVideoConfig();
  const buzz = marker('phone_buzz');
  const shake = fr >= buzz && fr < buzz + f(0.8) ? Math.sin(fr * 2.6) * 7 : 0;
  const lift = spring({ frame: fr, fps, config: { damping: 18, stiffness: 110 } });
  const glow = interpolate(Math.sin((fr - buzz) / 5), [-1, 1], [0.25, 0.7]);
  return (
    <CarNight clock="11:24 PM">
      <div style={{ position: 'absolute', left: 1180, top: 120 + (1 - lift) * 300, transform: `rotate(${-3 + shake * 0.3}deg) translateX(${shake}px)`, filter: fr >= buzz ? `drop-shadow(0 0 40px rgba(220,38,38,${glow}))` : undefined }}>
        <Phone sceneNo={5} height={760} />
      </div>
    </CarNight>
  );
};

/** Word timings inside s05, for the factor chips (rain, river sensor, camera, flood history). */
const s05Word = (share: number) => cueAt('s05') + f(share * (timeline.cues.find((c) => c.id === 's05')!.end - timeline.cues.find((c) => c.id === 's05')!.start));

const scenes: Record<number, React.ReactNode> = {
  1: <Sting />,
  2: <FadeIn><CarNight flashAt={marker('lightning')} /></FadeIn>,
  3: <FadeIn><River /></FadeIn>,
  4: (
    <FadeIn>
      <AppScene n={4} kicker="FLOODWAY LIVE · KAMPUNG BARU" lines={['Four sources.', 'One decision.']} note="DEMO storm scenario, 15 s (in the app)"
        chips={<>
          <Chip at={s05Word(0.42)} color={C.cyan}>Rain warning</Chip>
          <Chip at={s05Word(0.55)} color={C.cyan}>River water sensor</Chip>
          <Chip at={s05Word(0.7)} color={C.cyan}>River camera</Chip>
          <Chip at={s05Word(0.84)} color={C.cyan}>Flood history model</Chip>
          <Chip at={cueAt('s06')} color={C.alert}>All four agree: DANGER</Chip>
        </>} />
    </FadeIn>
  ),
  5: <Alert />,
  6: (
    <FadeIn>
      <AppScene n={6} kicker="SAFE ROUTE" lines={['Full centre?', 'Find an open one.']} glow={C.safe} note="Start: Bangsar (demo position in the app)"
        chips={<>
          <Chip at={cueAt('s09') + 6} color={C.warn}>Kampung Baru centre: FULL</Chip>
          <Chip at={cueAt('s10') + f(1.2)} color={C.safe}>Sentul Perdana: open, avoids flood</Chip>
          <Chip at={cueAt('s11')} color={C.alert}>Ordinary GPS: shortest road, even through water</Chip>
        </>} />
    </FadeIn>
  ),
  7: (
    <AppScene n={7} kicker="ARRIVED" lines={['Safe.', 'And his family knows.']} glow={C.safe}
      chips={<>
        <Chip at={cueAt('s12') + f(1.0)} color={C.safe}>Telegram check-in sent to family</Chip>
        <Chip at={cueAt('s12') + f(2.0)} color={C.safe}>Family status: arrived safe</Chip>
      </>} />
  ),
  8: (
    <>
      <AppScene n={8} kicker="CITIZEN REPORTS" lines={['One photo.', 'The street is warned.']} note="In-app sample photo"
        chips={<>
          <Chip at={f(7.9)} color={C.cyan}>AI check: flooding, about 35 cm</Chip>
          <Chip at={f(13.1)} color={C.safe}>Verified by a person</Chip>
          <Chip at={f(15.6)} color={C.alert}>2 km warning area on the map</Chip>
        </>} />
      <Sequence durationInFrames={f(4.3)}><FloodedStreet /></Sequence>
    </>
  ),
  9: <FadeIn frames={10}><EndCard /></FadeIn>,
};

export const FloodWayDemo: React.FC = () => (
  <AbsoluteFill style={{ background: C.night, fontFamily: BODY }}>
    <style>{fontCss}</style>
    {timeline.scenes.map((s) => (
      <Sequence key={s.scene} from={s.from} durationInFrames={s.frames} name={`${s.scene} ${s.name}`}>
        {scenes[s.scene]}
      </Sequence>
    ))}
    <Captions />
    <Audio src={staticFile('audio/mix.wav')} />
  </AbsoluteFill>
);

