import React, { useRef } from 'react';
import { Radio, Battery, Usb, ChevronDown, Loader2, AlertCircle, CheckCircle2, Unplug, Bluetooth } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { DEMO_SCENARIO } from '../../config/demoScenario';
import { benchActions, useBenchSensor } from '../../hooks/useBenchSensor';
import { setHeaderPanel, useCloseOnOutside, useHeaderPanel } from '../../hooks/useHeaderPanel';
import { LEVEL_META } from '../../lib/vision/levels';
import { StatusChip } from '../live/shared/StatusChip';
import { BenchCup } from './BenchCup';

/** A collapsible section of the popover. */
function Section({ title, badge, defaultOpen = false, children }: { title: string; badge?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details open={defaultOpen} className="group border-t border-slate-100 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-2.5 [&::-webkit-details-marker]:hidden">
        <span className="font-heading text-sm font-bold text-slate-900">{title}</span>
        <span className="flex items-center gap-2">
          {badge}
          <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
        </span>
      </summary>
      <div className="pb-3">{children}</div>
    </details>
  );
}

function ago(at: number | null): string {
  if (!at) return '';
  const s = Math.round((Date.now() - at) / 1000);
  return s < 3 ? 'Updated just now' : `Updated ${s}s ago`;
}

export function IoTHeaderPopover() {
  const isOpen = useHeaderPanel() === 'iot';
  const setIsOpen = (o: boolean) => setHeaderPanel(o ? 'iot' : null);
  const box = useRef<HTMLDivElement>(null);
  useCloseOnOutside('iot', box);
  const { telemetry } = useApp();
  const bench = useBenchSensor();
  // The steady level (up at once, down after a few readings agree), with the latest percentage.
  const reading = bench.reading && bench.level ? { ...bench.reading, level: bench.level } : null;
  const live = bench.status === 'live' && reading;
  const busy = bench.status === 'picking' || bench.status === 'opening';
  const connected = bench.status === 'waiting' || bench.status === 'live' || bench.status === 'stalled';
  const problem = bench.status === 'error' || bench.status === 'stalled';
  // Only show the message when it needs attention or while connecting; a working link speaks for itself.
  const showMessage = bench.message && (problem || busy || bench.status === 'waiting' || bench.status === 'idle');
  const LinkIcon = bench.portLabel === 'Bluetooth' ? Bluetooth : Usb;

  return (
    <div ref={box} className="relative">
      <button
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 max-md:min-h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200/80 transition-colors"
      >
        {live ? (
          <>
            <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${LEVEL_META[reading.level].dot}`} />
            <span className="hidden xl:inline">LIVE · IoT node · {reading.pct}% {LEVEL_META[reading.level].label}</span>
          </>
        ) : (
          <>
            <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${connected ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            <span className="hidden xl:inline">
              {connected ? 'IoT node · connecting' : `IoT demo · ${DEMO_SCENARIO.sensors.online}/${DEMO_SCENARIO.sensors.active} (simulated)`}
            </span>
          </>
        )}
        <Radio className="w-3.5 h-3.5 xl:hidden" aria-hidden="true" /><span className="sr-only">IoT sensors</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-slate-200 px-4 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* ---- Simulated station (demo data) ---- */}
          <Section title="Simulated station" badge={<span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{DEMO_SCENARIO.station.id}</span>}>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between gap-3 text-slate-600">
                <span>Location</span>
                <span className="text-right font-semibold text-slate-800">{DEMO_SCENARIO.station.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ultrasonic distance</span>
                <span className="font-semibold text-slate-800">{telemetry.distanceCm} cm</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Water depth</span>
                <span className="font-bold text-red-600">{telemetry.waterLevelM.toFixed(2)} m (Rising)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Battery & signal</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5" /> {DEMO_SCENARIO.station.batteryPct}% · {DEMO_SCENARIO.station.signalDbm} dBm
                </span>
              </div>
            </div>
          </Section>

          {/* ---- The physical IoT node ---- */}
          <Section
            title="IoT node"
            defaultOpen
            badge={live ? <StatusChip level={reading.level} /> : (
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${connected ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{connected ? 'Connecting' : 'Offline'}</span>
            )}
          >
            <div className="flex items-center gap-4">
              <BenchCup pct={reading?.pct ?? null} level={reading?.level ?? null} />
              <div className="min-w-0 flex-1">
                {reading ? (
                  <>
                    <p className="font-heading text-3xl font-bold leading-9 text-slate-900">{reading.pct}%</p>
                    <p className="text-sm text-slate-600">Water height {reading.waterCm.toFixed(1)} cm</p>
                    <p className="mt-1 text-xs text-slate-500">{ago(bench.readingAt)}</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Not connected. Connect the IoT node by USB cable or Bluetooth.</p>
                )}
              </div>
            </div>

            {connected && (
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                <span className="flex items-center gap-1"><LinkIcon className="h-3.5 w-3.5" aria-hidden="true" /> {bench.portLabel}</span>
                {bench.server && (
                  <span className={`flex items-center gap-1 ${bench.server.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                    {bench.server.ok ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                    {bench.server.ok ? 'Synced to FloodWay' : bench.server.text}
                  </span>
                )}
              </div>
            )}

            {showMessage && (
              <p className={`mt-3 flex gap-1.5 rounded-lg px-2 py-1.5 text-xs ${problem ? 'bg-red-50 text-red-800' : 'bg-sky-50 text-sky-800'}`}>
                {problem
                  ? <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  : <Loader2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${busy || bench.status === 'waiting' ? 'animate-spin' : ''}`} aria-hidden="true" />}
                <span>{bench.message}</span>
              </p>
            )}

            <div className="mt-3">
              {connected ? (
                <button onClick={() => void benchActions.disconnect()} className="w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200">
                  <Unplug className="w-3.5 h-3.5" /> Disconnect
                </button>
              ) : (
                <button onClick={() => void benchActions.connect()} disabled={busy} className="w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60">
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Usb className="w-3.5 h-3.5" />}
                  <span>{busy ? 'Connecting...' : 'Connect IoT node'}</span>
                </button>
              )}
              {!connected && !benchActions.supported() && <p className="mt-1.5 text-[11px] leading-4 text-slate-500">Needs Chrome or Edge on a laptop.</p>}
            </div>
          </Section>
        </div>
      )}
    </div>
  );
}
