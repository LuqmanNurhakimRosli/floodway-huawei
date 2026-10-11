import { useMemo } from 'react';
import { deriveHazards } from '../../lib/vision/hazards';
import type { VisionHazard } from '../../lib/vision/hazards';
import { useVisionStore } from './useVisionStore';

/** For the evacuation map: flood zones created by cameras at WARNING/DANGER. */
export function useVisionHazards(): VisionHazard[] {
  const { cameras } = useVisionStore();
  return useMemo(() => deriveHazards(cameras), [cameras]);
}
