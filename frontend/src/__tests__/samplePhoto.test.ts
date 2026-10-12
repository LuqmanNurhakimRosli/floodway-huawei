import { describe, expect, it } from 'vitest';
import { samplePhotoUrl } from '../lib/vision/samplePhoto';

describe('samplePhotoUrl', () => {
  it('picks the rung nearest the water ratio', () => {
    expect(samplePhotoUrl('sample-klang-jamek', 0.44)).toBe('/media/live/klang-r040.webp');
    expect(samplePhotoUrl('sample-klang-jamek', 0.46)).toBe('/media/live/klang-r050.webp');
    expect(samplePhotoUrl('sample-batu-sentul', 0.0)).toBe('/media/live/batu-r000.webp');
  });

  it('clamps overtopping and negative readings to the ladder ends', () => {
    expect(samplePhotoUrl('sample-kampung-baru-drain', 1.04)).toBe('/media/live/drain-r100.webp');
    expect(samplePhotoUrl('sample-smart-tunnel', 1.5)).toBe('/media/live/smart-r110.webp');
    expect(samplePhotoUrl('sample-gombak-tun-razak', -0.2)).toBe('/media/live/gombak-r000.webp');
  });

  it('has no photo for a camera that is not a sample', () => {
    expect(samplePhotoUrl('cam-123abc', 0.5)).toBeNull();
  });
});
