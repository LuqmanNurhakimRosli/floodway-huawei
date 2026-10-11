import { ChevronDown, Map as MapIcon } from 'lucide-react';
import { useState } from 'react';
import { isAlertLevel } from '../../../lib/vision/levels';
import type { AlertEvent, Camera, Reading } from '../../../types/vision';
import { RecentAlerts } from '../alerts/RecentAlerts';
import { btnPrimary, btnSecondary, card, focusRing } from '../shared/ui';
import { CameraDetailsCard } from './CameraDetailsCard';
import { JsonOutputCard } from './JsonOutputCard';
import { LevelHistoryChart } from './LevelHistoryChart';
import { WaterLevelCard } from './WaterLevelCard';

interface Props {
  camera: Camera;
  distanceKm: number;
  history: Reading[];
  alerts: AlertEvent[];
  onShowMap: () => void;
  onNotifyFamily?: () => void;
  onRemove?: () => Promise<void>;
}

/** Right column on desktop; stacked under the feed on phones. */
export function AnalysisColumn({ camera, distanceKm, history, alerts, onShowMap, onNotifyFamily, onRemove }: Props) {
  const [aiOpen, setAiOpen] = useState(false);
  const reading = camera.reading;
  const level = camera.online ? reading?.level : undefined;
  const alerting = level ? isAlertLevel(level) : false;

  return (
    <div className="space-y-3">
      <WaterLevelCard camera={camera} />

      {alerting && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900">
          <MapIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          This camera is adding a flood zone to evacuation routing.
        </p>
      )}

      {reading && camera.online && (
        <section className={card}>
          <button type="button" onClick={() => setAiOpen(!aiOpen)} aria-expanded={aiOpen} className={`flex min-h-12 w-full items-center justify-between rounded-2xl px-4 text-left text-sm font-bold text-slate-900 ${focusRing}`}>
            AI output and history
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform motion-reduce:transition-none ${aiOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {aiOpen && (
            <div className="space-y-4 border-t border-slate-100 p-4">
              <LevelHistoryChart history={history} calibration={camera.calibration} />
              <JsonOutputCard reading={reading} />
            </div>
          )}
        </section>
      )}

      <CameraDetailsCard camera={camera} distanceKm={distanceKm} onRemove={onRemove} />
      <RecentAlerts alerts={alerts} />

      <div className="sticky bottom-3 z-10 flex flex-col gap-2 md:static">
        <button type="button" onClick={onShowMap} className={`${level === 'NORMAL' || !level ? btnSecondary : btnPrimary} w-full shadow-lg shadow-blue-900/10 md:shadow-none`}>
          <MapIcon className="h-4 w-4" aria-hidden="true" />
          {level === 'NORMAL' || !level ? 'View on map' : 'Show evacuation routes'}
        </button>
        {alerting && onNotifyFamily && (
          <button type="button" onClick={onNotifyFamily} className={`${btnSecondary} w-full`}>
            Notify my family
          </button>
        )}
      </div>
    </div>
  );
}
