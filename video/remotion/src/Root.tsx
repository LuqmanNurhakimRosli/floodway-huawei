import { Composition } from 'remotion';
import { FloodWayDemo } from './FloodWayDemo';
import { timeline } from './theme';
import { FloodWayDemoV2 } from './v2/DemoV2';
import { DURATION_S, FPS } from './v2/kit';

export const Root = () => (
  <>
    <Composition
      id="FloodWayDemo"
      component={FloodWayDemo}
      durationInFrames={timeline.frames}
      fps={timeline.fps}
      width={timeline.width}
      height={timeline.height}
    />
    <Composition id="FloodWayDemoV2" component={FloodWayDemoV2} durationInFrames={Math.round(DURATION_S * FPS)} fps={FPS} width={1920} height={1080} />
  </>
);
