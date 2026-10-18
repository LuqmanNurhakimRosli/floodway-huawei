import { FlaskConical, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import recorded from '../../data/stormLabRecorded.json';
import { describeRun, formatSeconds, timingFor } from '../../lib/vision/stormLab';
import { runStorm } from '../../services/vision/visionApi';
import type { StormRun, StormScenario } from '../../types/vision';
import { Segmented } from '../live/shared/Segmented';
import { btnPrimary, card, cardPad, cardTitle, num } from '../../styles/tokens';
import { StormChart } from './StormChart';

const RECORDED = recorded as unknown as { recorded_at: string; scenarios: StormScenario[]; runs: StormRun[] };

interface Props {
  /** false on sample data: the lab needs the server, so the page shows the recorded replay instead. */
  serverAvailable: boolean;
}

function Metric({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string; tone?: 'default' | 'good' | 'bad' }) {
  const color = tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-red-700' : 'text-slate-900';
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-xs/4 font-medium text-slate-600">{label}</p>
      <p className={`${num} mt-1 text-xl/7 font-bold ${color}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs/4 text-slate-600">{sub}</p>}
    </div>
  );
}

/**
 * Storm lab: replay a scripted storm through the real pipeline and see how fast it warns, with the fault filter on
 * and off. Opens on a recorded replay so the panel is never empty; "Run" replays it live on the server.
 */
export function StormLab({ serverAvailable }: Props) {
  const scenarios = RECORDED.scenarios;
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? 'rising-storm');
  const [live, setLive] = useState<Record<string, StormRun>>({});
  const [filter, setFilter] = useState<'on' | 'off'>('on');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setError(null), [scenarioId]);

  const run = live[scenarioId] ?? RECORDED.runs.find((r) => r.scenario === scenarioId) ?? null;
  const isLive = Boolean(live[scenarioId]);
  const scenario = scenarios.find((s) => s.id === scenarioId);
  const result = run ? (filter === 'on' ? run.with_filter : run.without_filter) : null;
  const other = run ? (filter === 'on' ? run.without_filter : run.with_filter) : null;
  const summary = useMemo(() => (run ? describeRun(run) : ''), [run]);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await runStorm(scenarioId);
      setLive((m) => ({ ...m, [scenarioId]: r }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The replay did not run.');
    } finally {
      setBusy(false);
    }
  };

  const warn = result ? timingFor(result, 'WARNING') : null;
  const danger = result ? timingFor(result, 'DANGER') : null;

  return (
    <section className={`${card} ${cardPad} @container/lab min-w-0`} aria-labelledby="lab-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="lab-title" className={`${cardTitle} flex items-center gap-2`}>
            <FlaskConical className="h-5 w-5 text-[#1677FF]" aria-hidden="true" /> Storm lab
          </h2>
          <p className="mt-0.5 max-w-prose text-sm/5 text-slate-600">
            Replays a scripted storm through the same analyser, fault filter and level rules as the live cameras, and measures
            how long each warning takes.
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${isLive ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-slate-50 text-slate-700'}`}>
          {isLive ? 'Replayed just now' : 'Recorded replay'}
        </span>
      </div>

      <div className="mt-4">
        <Segmented label="Storm scenario" kind="tabs" options={scenarios.map((s) => ({ id: s.id, label: s.title }))} value={scenarioId} onChange={(id) => setScenarioId(String(id))} />
      </div>
      {scenario && <p className="mt-2 text-sm/5 text-slate-700">{scenario.description}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className={btnPrimary} onClick={() => void start()} disabled={busy || !serverAvailable}>
          <Play className="h-4 w-4" aria-hidden="true" /> {busy ? 'Replaying…' : 'Run on the server'}
        </button>
        <div className="w-full max-w-[260px] @min-[520px]/lab:w-[240px]">
          <Segmented label="Fault filter" options={[{ id: 'on', label: 'Filter on' }, { id: 'off', label: 'Filter off' }]} value={filter} onChange={(v) => setFilter(v as 'on' | 'off')} />
        </div>
      </div>
      {!serverAvailable && (
        <p className="mt-2 text-xs/4 text-slate-600">The server is not reachable, so this shows a replay recorded on <span className={num}>{RECORDED.recorded_at.slice(0, 10)}</span>. Start the backend to run it live.</p>
      )}
      {error && <p role="alert" className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs/4 font-semibold text-red-900">{error}</p>}

      {run && result && other && scenario && (
        <>
          <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm/5 font-medium text-slate-800" aria-live="polite">{summary}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 @min-[620px]/lab:grid-cols-4">
            <Metric label="WARNING alert after the line" value={formatSeconds(warn?.detection_delay_s)} sub={warn?.truth_crossed_at === null ? 'water never got there' : undefined} />
            <Metric label="DANGER alert after the line" value={formatSeconds(danger?.detection_delay_s)} sub={danger?.truth_crossed_at === null ? 'water never got there' : undefined} />
            <Metric
              label="Lead before DANGER"
              value={formatSeconds(result.metrics.warning_lead_s)}
              tone={result.metrics.warning_lead_s !== null && result.metrics.warning_lead_s > 0 ? 'good' : 'default'}
              sub="WARNING alert to water at DANGER"
            />
            <Metric
              label="False alerts"
              value={String(result.metrics.false_alerts)}
              tone={result.metrics.false_alerts > 0 ? 'bad' : 'good'}
              sub={`${other.metrics.false_alerts} with filter ${filter === 'on' ? 'off' : 'on'} · ${result.metrics.held_readings} held`}
            />
          </div>
          <div className="mt-4">
            <StormChart result={result} durationS={scenario.duration_s} />
          </div>
          <p className="mt-3 text-xs/4 text-slate-600">
            {run.note} One reading every <span className={num}>{run.interval_s}</span> s, analyser <span className={num}>{run.analyzer}</span>.
          </p>
        </>
      )}
    </section>
  );
}
