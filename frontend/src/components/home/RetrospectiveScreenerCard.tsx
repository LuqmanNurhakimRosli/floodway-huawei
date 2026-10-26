import React, { useState, useEffect } from 'react';
import { History, ShieldAlert, Cpu, Sparkles, Scale, Info, ArrowRight } from 'lucide-react';
import { card, cardPad, cardTitle, interactive } from '../../styles/tokens';
import {
  fetchHistoricalExamples,
  screenHistoricalRecord,
  compareBenchmarks,
  type HistoricalExample,
  type RetrospectiveScreeningResponse,
  type RetrospectiveComparisonResponse
} from '../../services/retrospectiveApi';

export function RetrospectiveScreenerCard() {
  const [examples, setExamples] = useState<HistoricalExample[]>([]);
  const [selectedExampleId, setSelectedExampleId] = useState<string>('example-flood-incident-1');
  const [modelId, setModelId] = useState<'benchmark_a_logistic_regression' | 'benchmark_b_random_forest'>('benchmark_a_logistic_regression');

  // 5 approved features
  const [rain1d, setRain1d] = useState<number>(7.5);
  const [rain3d, setRain3d] = useState<number>(41.4);
  const [rain7d, setRain7d] = useState<number>(98.5);
  const [elevation, setElevation] = useState<number>(19.11);
  const [slope, setSlope] = useState<number>(4.23);

  const [loading, setLoading] = useState<boolean>(false);
  const [singleResult, setSingleResult] = useState<RetrospectiveScreeningResponse | null>(null);
  const [compareResult, setCompareResult] = useState<RetrospectiveComparisonResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load preset historical examples on mount
  useEffect(() => {
    fetchHistoricalExamples().then((data) => {
      setExamples(data);
      if (data.length > 0) {
        applyExample(data[0]);
      }
    });
  }, []);

  const applyExample = (ex: HistoricalExample) => {
    setSelectedExampleId(ex.id);
    setRain1d(ex.rain_1d_prior_mm);
    setRain3d(ex.rain_3d_prior_mm);
    setRain7d(ex.rain_7d_prior_mm);
    setElevation(ex.elevation_m);
    setSlope(ex.slope_deg);
    setSingleResult(null);
    setCompareResult(null);
    setErrorMsg(null);
  };

  const handleRunScreening = async () => {
    setLoading(true);
    setErrorMsg(null);
    setCompareResult(null);

    try {
      const res = await screenHistoricalRecord({
        model_id: modelId,
        rain_1d_prior_mm: Number(rain1d),
        rain_3d_prior_mm: Number(rain3d),
        rain_7d_prior_mm: Number(rain7d),
        elevation_m: Number(elevation),
        slope_deg: Number(slope),
        metadata: {
          example_id: selectedExampleId
        }
      });
      setSingleResult(res);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Screening request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSingleResult(null);

    try {
      const res = await compareBenchmarks({
        model_id: modelId,
        rain_1d_prior_mm: Number(rain1d),
        rain_3d_prior_mm: Number(rain3d),
        rain_7d_prior_mm: Number(rain7d),
        elevation_m: Number(elevation),
        slope_deg: Number(slope),
        metadata: {
          example_id: selectedExampleId
        }
      });
      setCompareResult(res);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Comparison request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`${card} ${cardPad} space-y-4`} aria-labelledby="retrospective-title">
      {/* Header and Disclaimers */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600" aria-hidden="true" />
            <h2 id="retrospective-title" className={cardTitle}>
              Retrospective Incident Screening Demonstration
            </h2>
          </div>
          <p className="mt-1 text-xs/5 text-slate-600">
            Evaluates baseline model discrimination using Copernicus DEM topography and historical ECMWF ERA5 antecedent rainfall.
          </p>
        </div>

        <div className="flex flex-col sm:items-end gap-1 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
            Historical demonstration only · Not an operational forecast or safety warning
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Inputs: Historical ERA5 reanalysis (D-7..D-1) · Not live weather forecasts
          </span>
        </div>
      </div>

      {/* Preset Selector */}
      <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-200/70 space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="example-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            Load Authentic 2020 Historical Test Record:
          </label>
        </div>
        <select
          id="example-select"
          value={selectedExampleId}
          onChange={(e) => {
            const ex = examples.find((item) => item.id === e.target.value);
            if (ex) applyExample(ex);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {examples.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.is_incident ? '🔴 [Reported Flood Incident] ' : '⚪ [Background Landscape] '}
              {ex.title}
            </option>
          ))}
        </select>
      </div>

      {/* 5 Approved Predictors Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
          <label className="block text-[11px] font-bold text-slate-600 truncate" title="Antecedent 1-Day Rainfall (D-1)">
            Rain (D-1) [mm]
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="1500"
            value={rain1d}
            onChange={(e) => setRain1d(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm font-semibold tabular-nums text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500">ERA5 1-day prior</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
          <label className="block text-[11px] font-bold text-slate-600 truncate" title="Antecedent 3-Day Cumulative Rainfall (D-3..D-1)">
            Rain (D-3..D-1) [mm]
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="3000"
            value={rain3d}
            onChange={(e) => setRain3d(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm font-semibold tabular-nums text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500">ERA5 3-day sum</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
          <label className="block text-[11px] font-bold text-slate-600 truncate" title="Antecedent 7-Day Cumulative Rainfall (D-7..D-1)">
            Rain (D-7..D-1) [mm]
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5000"
            value={rain7d}
            onChange={(e) => setRain7d(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm font-semibold tabular-nums text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500">ERA5 7-day sum</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
          <label className="block text-[11px] font-bold text-slate-600 truncate" title="Copernicus DEM 30m Elevation">
            Elevation [m]
          </label>
          <input
            type="number"
            step="0.1"
            min="-50"
            max="4500"
            value={elevation}
            onChange={(e) => setElevation(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm font-semibold tabular-nums text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500">Copernicus DEM 30m</span>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
          <label className="block text-[11px] font-bold text-slate-600 truncate" title="Copernicus DEM 30m Slope">
            Slope [degrees]
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="90"
            value={slope}
            onChange={(e) => setSlope(parseFloat(e.target.value) || 0)}
            className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm font-semibold tabular-nums text-slate-900 focus:border-indigo-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-500">Copernicus DEM 30m</span>
        </div>
      </div>

      {/* Model Selection and Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">Model Pipeline:</span>
          <button
            type="button"
            onClick={() => setModelId('benchmark_a_logistic_regression')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              modelId === 'benchmark_a_logistic_regression'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Benchmark A: Logistic Regression (Default)
          </button>
          <button
            type="button"
            onClick={() => setModelId('benchmark_b_random_forest')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              modelId === 'benchmark_b_random_forest'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Benchmark B: Random Forest (Comparison)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRunScreening}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 ${interactive}`}
          >
            <Cpu className="h-4 w-4" />
            {loading ? 'Screening…' : 'Run Screening'}
          </button>
          <button
            type="button"
            onClick={handleCompare}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 ${interactive}`}
          >
            <Scale className="h-4 w-4 text-indigo-600" />
            Compare Both Benchmarks
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <b>Error:</b> {errorMsg}
        </div>
      )}

      {/* Single Model Result */}
      {singleResult && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Screening Result · {singleResult.model_name}
              </span>
              <p className="text-xs text-slate-600">{singleResult.benchmark_type}</p>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                  singleResult.screening_tier === 'Elevated Screening Index'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : singleResult.screening_tier === 'Moderate Screening Index'
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                {singleResult.screening_tier}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Illustrative demo tier (not official risk)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold tabular-nums text-slate-900">
              {singleResult.relative_classification_score.toFixed(4)}
            </span>
            <span className="text-sm font-semibold text-slate-600">
              ({singleResult.relative_score_percent}% relative incident similarity index)
            </span>
          </div>

          <p className="text-xs/5 text-slate-700 font-medium bg-white/70 rounded-lg p-2.5 border border-indigo-100">
            <Info className="inline h-3.5 w-3.5 mr-1 text-indigo-600" />
            {singleResult.score_interpretation}
          </p>
          {singleResult.tier_basis && (
            <p className="text-[11px] text-slate-500 italic">
              * Note: {singleResult.tier_basis}
            </p>
          )}
        </div>
      )}

      {/* Side-by-Side Comparison Result */}
      {compareResult && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Side-by-Side Benchmark Sensitivity Comparison
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Benchmark A */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Benchmark A (Logistic Regression)</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  Uniform Background
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-slate-900">
                  {compareResult.comparison.benchmark_a_logistic_regression.relative_classification_score.toFixed(4)}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  ({compareResult.comparison.benchmark_a_logistic_regression.relative_score_percent}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Illustrative Tier: <b>{compareResult.comparison.benchmark_a_logistic_regression.screening_tier}</b>
              </p>
            </div>

            {/* Benchmark B */}
            <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Benchmark B (Random Forest)</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  Terrain-Restricted
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-slate-900">
                  {compareResult.comparison.benchmark_b_random_forest.relative_classification_score.toFixed(4)}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  ({compareResult.comparison.benchmark_b_random_forest.relative_score_percent}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Illustrative Tier: <b>{compareResult.comparison.benchmark_b_random_forest.screening_tier}</b>
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 italic bg-white/80 p-2.5 rounded border border-slate-200">
            {compareResult.interpretation_note}
          </p>
        </div>
      )}
    </section>
  );
}
