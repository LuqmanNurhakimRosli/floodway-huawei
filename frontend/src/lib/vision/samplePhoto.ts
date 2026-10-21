import { frameUrl } from '../../services/vision/visionApi';
import type { Camera } from '../../types/vision';

// The sample cameras' AI-generated photos (docs/plans/GEMINI_LIVE_MEDIA_V2.md): 12 rungs per camera, r000 to r110, where
// the number is the water height as a share of bank height times 100. Used when the server is unreachable, so the page
// shows the same picture the reading would have described.
const PREFIX: Record<string, string> = {
  'sample-klang-jamek': 'klang',
  'sample-gombak-tun-razak': 'gombak',
  'sample-smart-tunnel': 'smart',
  'sample-batu-sentul': 'batu',
  'sample-kampung-baru-drain': 'drain',
};

/** The photo for the rung nearest `ratio` (0 = bed, 1 = bank top), or null for a camera that has no photos. */
export function samplePhotoUrl(cameraId: string, ratio: number): string | null {
  const prefix = PREFIX[cameraId];
  if (!prefix) return null;
  const rung = Math.min(11, Math.max(0, Math.round(ratio * 10)));
  return `/media/live/${prefix}-r${String(rung * 10).padStart(3, '0')}.webp`;
}

/** The picture to show for a camera: its sample photo, else the server's latest frame while live, else null. */
export function cameraPhotoUrl(c: Pick<Camera, 'id' | 'online' | 'reading'>, live: boolean): string | null {
  const sample = samplePhotoUrl(c.id, c.reading?.water_ratio ?? 0);
  if (sample) return sample;
  return live && c.online && c.reading ? frameUrl(c.id, c.reading.timestamp) : null;
}
