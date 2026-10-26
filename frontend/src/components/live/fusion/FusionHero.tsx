import { BrainCircuit, Cctv, ChevronDown, CloudRain, Cpu, Play, RotateCcw } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useStormScenario } from '../../../hooks/useStormScenario';
import { visionActions } from '../../../hooks/vision/useVisionStore';
import { calmRatio, KAMPUNG_BARU_CAMERA } from '../../../services/vision/mockVision';
import type { FactorKey } from '../../../lib/fusion';
import { floodProneModel } from '../../../lib/fusion';
import type { FactorStates } from '../../../lib/stormScenario';
import { cameraFactor, fuseStates, idleIot, idleMet, modelFactor, STORM_DURATION_S, stormCameraRatio, stormStateAt } from '../../../lib/stormScenario';
import { LEVEL_META } from '../../../lib/vision/levels';
import { notificationPermission, requestNotificationPermission } from '../../../lib/vision/notify';
import type { Camera } from '../../../types/vision';
import { RetrospectiveScreenerCard } from '../../home/RetrospectiveScreenerCard';
import { btnPrimary, btnSecondary, card, cardPad, cardTitle, interactive, num } from '../shared/ui';
import { FactorTile } from './FactorTile';
import { RiskRing } from './RiskRing';
import { StormNotices } from './StormNotices';

const SITE_CAMERA = KAMPUNG_BARU_CAMERA;
const ORDER: FactorKey[] = ['model', 'met', 'iot', 'cctv'];
const LEFT: FactorKey[] = ['model', 'met'];
const FACTOR: Record<FactorKey, { icon: LucideIcon; name: string; role: string }> = {
  model: { icon: BrainCircuit, name: 'Flood-prone model', role: 'Where: 7 years of JPS floods' },
  met: { icon: CloudRain, name: 'MET Malaysia', role: 'When: rain warnings' },
  iot: { icon: Cpu, name: 'IoT water sensor', role: 'Now: depth at one point' },
  cctv: { icon: Cctv, name: 'CCTV vision', role: 'Now: water over an area' },
};

function idleFactors(cameras: Camera[]): FactorStates {
  const cam = cameras.find((c) => c.id === SITE_CAMERA);
  const reading = cam?.online ? cam.reading : null;
  return {
    model: modelFactor(floodProneModel.reference[0].rain as [number, number, number]),
    met: idleMet(),
    iot: idleIot(),
    cctv: reading ? cameraFactor(reading.water_ratio) : { level: null, value: '-', detail: 'Kampung Baru Drain camera is offline' },
  };
}

type Paths = Partial<Record<FactorKey, string>>;

/** Four factors flow into one fused level for Kampung Baru. Lines are drawn between the measured tile and ring
 *  positions on wide layouts; on phones the ring sits above a 2x2 grid with no lines. */
export function FusionHero({ cameras, autoStart = false }: { cameras: Camera[]; autoStart?: boolean }) {
  const storm = useStormScenario(autoStart);
  const base = useMemo(() => idleFactors(cameras), [cameras]);
  const { factors, notices } = useMemo(
    () => (storm.phase === 'idle' ? { factors: base, notices: [] } : stormStateAt(storm.elapsed, base)),
    [storm.phase, storm.elapsed, base],
  );
  const fusion = fuseStates(factors);

  // The Kampung Baru camera in the feed below rises with the storm, then goes back to calm when it stops.
  const calm = calmRatio(SITE_CAMERA);
  useEffect(() => {
    visionActions.demoCameraRatio(SITE_CAMERA, storm.phase === 'idle' ? null : stormCameraRatio(storm.elapsed, calm));
  }, [storm.phase, storm.elapsed, calm]);
  useEffect(() => () => visionActions.demoCameraRatio(SITE_CAMERA, null), []);

  // A tile pulses and a dash runs down its line whenever its reading changes.
  const [pulses, setPulses] = useState<Record<FactorKey, number>>({ model: 0, met: 0, iot: 0, cctv: 0 });
  const last = useRef(factors);
  useEffect(() => {
    const changed = ORDER.filter((k) => last.current[k].value !== factors[k].value || last.current[k].level !== factors[k].level);
    last.current = factors;
    if (changed.length) setPulses((p) => ({ ...p, ...Object.fromEntries(changed.map((k) => [k, p[k] + 1])) }));
  }, [factors]);

  const box = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const tiles = useRef<Partial<Record<FactorKey, HTMLDivElement | null>>>({});
  const [paths, setPaths] = useState<Paths>({});
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const o = el.getBoundingClientRect();
      const r = ring.current?.getBoundingClientRect();
      if (!r || r.width === 0) return;
      const cx = r.left + r.width / 2 - o.left;
      const cy = r.top + r.height / 2 - o.top;
      const next: Paths = {};
      for (const k of ORDER) {
        const t = tiles.current[k]?.getBoundingClientRect();
        if (!t) continue;
        const left = LEFT.includes(k);
        const x1 = (left ? t.right : t.left) - o.left;
        const y1 = t.top + t.height / 2 - o.top;
        const x2 = cx + (left ? -1 : 1) * (r.width / 2 - 4);
        const mx = (x1 + x2) / 2;
        next[k] = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${cy}, ${x2} ${cy}`;
      }
      setPaths(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const start = () => {
    if (notificationPermission() === 'default') void requestNotificationPermission();
    storm.start();
  };
  const why = fusion.agreeing.map((k) => factors[k].detail);
  const tile = (k: FactorKey) => (
    <FactorTile key={k} ref={(n) => { tiles.current[k] = n; }} {...FACTOR[k]} state={factors[k]} pulseKey={pulses[k]} />
  );

  return (
    <section className={`${card} ${cardPad} mt-4 @min-[640px]/main:mt-6`} aria-labelledby="fusion-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="fusion-title" className={cardTitle}>Flood risk from four factors</h2>
          <p className="text-sm/5 text-slate-600">
            Kampung Baru, Kuala Lumpur. FloodWay alerts when independent sources agree.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {storm.phase === 'idle' ? (
            <button type="button" onClick={start} className={btnPrimary}>
              <Play className="h-4 w-4" aria-hidden="true" /> Play storm scenario
            </button>
          ) : (
            <button type="button" onClick={storm.reset} className={btnSecondary}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> {storm.phase === 'running' ? 'Stop' : 'Reset'}
            </button>
          )}
        </div>
      </div>

      {storm.phase !== 'idle' && (
        <div className="mt-3">
          <div className="flex items-center justify-between gap-2 text-xs/4 text-slate-600">
            <span>DEMO: scripted storm. The flood-prone score uses rain recorded before the 18 Dec 2021 flood nearby.</span>
            <span className={num}>{Math.floor(storm.elapsed)}s / {STORM_DURATION_S}s</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full origin-left rounded-full bg-[#1677FF] transition-transform duration-300 ease-linear motion-reduce:transition-none" style={{ transform: `scaleX(${storm.elapsed / STORM_DURATION_S})` }} />
          </div>
        </div>
      )}

      <div ref={box} className="relative mt-4 grid grid-cols-1 gap-3 @min-[480px]/main:grid-cols-2 @min-[960px]/main:grid-cols-[minmax(0,1fr)_200px_minmax(0,1fr)] @min-[960px]/main:gap-x-12 @min-[960px]/main:gap-y-3">
        <svg className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible @min-[960px]/main:block" aria-hidden="true">
          {ORDER.map((k) => {
            const d = paths[k];
            if (!d) return null;
            const level = factors[k].level;
            const color = level ? LEVEL_META[level].hex : '#CBD5E1';
            return (
              <g key={k}>
                <path d={d} fill="none" stroke={color} strokeOpacity={level ? 0.45 : 1} strokeWidth={2} strokeDasharray={level ? undefined : '4 6'} className="transition-[stroke] duration-300 motion-reduce:transition-none" />
                {pulses[k] > 0 && (
                  <path key={pulses[k]} d={d} pathLength={100} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeDasharray="14 200" className="motion-safe:animate-[fusion-flow_800ms_cubic-bezier(0.22,1,0.36,1)_forwards] motion-reduce:hidden" style={{ strokeDashoffset: -100 }} />
                )}
              </g>
            );
          })}
        </svg>

        <p className="hidden text-xs/4 font-semibold uppercase tracking-wide text-slate-500 @min-[960px]/main:col-start-1 @min-[960px]/main:row-start-1 @min-[960px]/main:block">Context: where and when</p>
        <p className="hidden text-right text-xs/4 font-semibold uppercase tracking-wide text-slate-500 @min-[960px]/main:col-start-3 @min-[960px]/main:row-start-1 @min-[960px]/main:block">Live: what is happening now</p>

        <div className="col-span-full py-2 @min-[960px]/main:col-span-1 @min-[960px]/main:col-start-2 @min-[960px]/main:row-span-2 @min-[960px]/main:row-start-2 @min-[960px]/main:self-center @min-[960px]/main:py-0">
          <RiskRing ref={ring} fusion={fusion} total={ORDER.length} />
        </div>
        <div className="@min-[960px]/main:col-start-1 @min-[960px]/main:row-start-2">{tile('model')}</div>
        <div className="@min-[960px]/main:col-start-1 @min-[960px]/main:row-start-3">{tile('met')}</div>
        <div className="@min-[960px]/main:col-start-3 @min-[960px]/main:row-start-2">{tile('iot')}</div>
        <div className="@min-[960px]/main:col-start-3 @min-[960px]/main:row-start-3">{tile('cctv')}</div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-sm/5 text-slate-700">
        {why.length > 0 ? (
          <ul className="flex flex-col gap-1">
            {why.map((w) => <li key={w} className="flex gap-2"><span aria-hidden="true">•</span>{w}</li>)}
          </ul>
        ) : fusion.capped ? (
          <p>Context only: FloodWay is watching. A live sensor or camera reading must agree before it says leave.</p>
        ) : (
          <p>No factor is at warning. Watching {fusion.reporting} of {ORDER.length} sources.</p>
        )}
        <p className="mt-1.5 text-xs/4 text-slate-500">Rule-based fusion, not a trained model. Flood-prone model: {floodProneModel.result}. Terrain from the nearest held-out flood record ({floodProneModel.site.place}, about 1 km away). Rain and sensor values are demo numbers until those feeds connect.</p>
      </div>

      <details className="group mt-3">
        <summary className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-1 text-sm font-semibold text-[#0958D9] ${interactive}`}>
          <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
          Test the flood-prone model on past floods
        </summary>
        <div className="mt-2"><RetrospectiveScreenerCard /></div>
      </details>

      <StormNotices notices={notices} />
    </section>
  );
}
