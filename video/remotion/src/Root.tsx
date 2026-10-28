import { Composition } from 'remotion';
import { FloodWayDemo } from './FloodWayDemo';
import { timeline } from './theme';

export const Root = () => (
  <Composition
    id="FloodWayDemo"
    component={FloodWayDemo}
    durationInFrames={timeline.frames}
    fps={timeline.fps}
    width={timeline.width}
    height={timeline.height}
  />
);
