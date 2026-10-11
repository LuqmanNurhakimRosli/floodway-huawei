import { useEffect, useState } from 'react';
import { DEMO_VIDEOS, isVideoAvailable } from '../../lib/vision/demoMedia';
import type { DemoVideo } from '../../lib/vision/demoMedia';

/** The demo loop for a camera, once we know the file really exists. null for cameras without one. */
export function useDemoVideo(cameraId: string, enabled = true): DemoVideo | null {
  const entry = DEMO_VIDEOS[cameraId];
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let alive = true;
    setOk(false);
    if (enabled && entry) void isVideoAvailable(entry.src).then((v) => alive && setOk(v));
    return () => { alive = false; };
  }, [entry, enabled]);
  return entry && ok ? entry : null;
}
