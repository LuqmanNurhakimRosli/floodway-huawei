import { ChevronDown, Map as MapIcon, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { isAlertLevel } from '../../../lib/vision/levels';
import type { Camera, Reading } from '../../../types/vision';
import { card, cardTitle, interactive } from '../shared/ui';
import { JsonOutputCard } from './JsonOutputCard';
import { LevelHistoryChart } from './LevelHistoryChart';
import { WaterLevelCard } from './WaterLevelCard';

interface Props {
  camera: Camera;
  history: Reading[];
  action: ReactNode;
}

/** The reading for the selected camera. Right column on wide layouts; under the feed (2-up when there is room)
 *  otherwise. Must sit inside an `@container/analysis`. */
export function AnalysisColumn({ camera, history, action }: Props) {
  const [aiOpen, setAiOpen] = useState(false);
  const reading = camera.reading;
  const level = camera.online ? reading?.level : undefined;
  const alerting = level ? isAlertLevel(level) : false;

  return (
    <div className="grid items-start gap-4 @min-[640px]/analysis:grid-cols-2">
      <div className="space-y-3">
        <WaterLevelCard camera={camera} history={history} />
        {camera.online && reading?.accepted === false && (
          <p className="flex items-start gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm/5 font-medium text-slate-800" role="status">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" aria-hidden="true" />
            Latest reading held by the fault filter: {reading.fault ?? 'it jumped more than water can rise'}. The level waits for the next reading to agree.
          </p>
        )}
        {alerting && (
          <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm/5 font-medium text-amber-900">
            <MapIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            This camera adds a flood zone that evacuation routes avoid.
          </p>
        )}
        {action}
      </div>

      {reading && camera.online && (
        <section className={card}>
          <button type="button" onClick={() => setAiOpen(!aiOpen)} aria-expanded={aiOpen} aria-controls="ai-output" className={`flex min-h-14 w-full items-center justify-between rounded-2xl px-4 text-left @min-[760px]/main:px-5 ${interactive}`}>
            <span className={cardTitle}>AI output and history</span>
            <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform duration-200 motion-reduce:transition-none ${aiOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {aiOpen && (
            <div id="ai-output" className="space-y-4 border-t border-slate-100 p-4 @min-[760px]/main:p-5">
              <LevelHistoryChart history={history} calibration={camera.calibration} />
              <JsonOutputCard reading={reading} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
