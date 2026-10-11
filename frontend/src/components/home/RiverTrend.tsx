import React, { useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { visionActions } from '../../hooks/vision/useVisionStore';
import { highestRisk, isSampleCamera } from '../../lib/home';
import type { Camera, Reading } from '../../types/vision';
import { LevelHistoryChart } from '../live/analysis/LevelHistoryChart';
import { EmptyState } from '../live/shared/EmptyState';
import { Skeleton } from '../live/shared/Skeleton';
import { card, cardPad, cardTitle } from '../../styles/tokens';

interface Props {
  loading: boolean;
  cameras: Camera[];
  history: Record<string, Reading[]>;
}

/** Water level of the highest-risk camera over its recent readings, with the camera's own three reference lines. */
export function RiverTrend({ loading, cameras, history }: Props) {
  const top = highestRisk(cameras);
  const topId = top?.id;
  useEffect(() => {
    if (topId) void visionActions.loadHistory(topId);
  }, [topId]);

  return (
    <section className={`${card} ${cardPad}`} aria-labelledby="trend-title">
      <div className="flex items-start justify-between gap-3">
        <h2 id="trend-title" className={`${cardTitle} flex items-center gap-2`}>
          <TrendingUp className="h-5 w-5 text-slate-600" aria-hidden="true" /> Water level trend
        </h2>
        {top && <span className="truncate text-xs/4 text-slate-700" title={top.name}>{isSampleCamera(top) ? 'Sample camera' : 'Camera'}: {top.name}</span>}
      </div>
      <div className="mt-3">
        {loading ? (
          <Skeleton className="h-40 w-full" />
        ) : top ? (
          <LevelHistoryChart history={history[top.id] ?? []} calibration={top.calibration} />
        ) : (
          <EmptyState icon={TrendingUp} title="No readings yet" hint="The trend appears once a camera reports." />
        )}
      </div>
    </section>
  );
}
