import { describe, it, expect, vi } from 'vitest';
import {
  fetchHistoricalExamples,
  screenHistoricalRecord,
  compareBenchmarks,
  type RetrospectiveScreeningRequest
} from '../services/retrospectiveApi';

describe('Retrospective API Client', () => {
  it('returns fallback authentic historical examples when offline', async () => {
    const examples = await fetchHistoricalExamples();
    expect(examples.length).toBeGreaterThanOrEqual(2);
    expect(examples[0].is_incident).toBe(true);
    expect(examples[0].place).toBe('Kg. Ulu Pulai');
    expect(examples[0].rain_1d_prior_mm).toBe(7.5);
    expect(examples[0].elevation_m).toBe(19.11);
    expect(examples[0].slope_deg).toBe(4.23);
  });

  it('posts screening requests with the 5 approved features', async () => {
    const mockResponse = {
      model_id: 'benchmark_a_logistic_regression',
      model_name: 'Benchmark A - Logistic Regression (Default)',
      benchmark_type: 'Benchmark A (Uniform landscape background)',
      model_architecture: 'StandardScaler + LogisticRegression',
      relative_classification_score: 0.722,
      relative_score_percent: 72.2,
      screening_tier: 'Elevated Screening Index',
      tier_description: 'Feature combination shares strong similarity with historical reported flood incidents.',
      score_interpretation: 'Relative presence-background discrimination score (0.0 to 1.0).',
      disclaimer: 'Historical flood incident screening demonstration only. Not a real-time flood forecast or safety warning.',
      data_source: 'Historical ECMWF ERA5 reanalysis & Copernicus DEM 30m. Not live forecasts or sensor readings.',
      feature_vector_used: [
        { feature: 'rain_1d_prior_mm', value: 7.5, unit: 'mm', description: 'ERA5' },
        { feature: 'rain_3d_prior_mm', value: 41.4, unit: 'mm', description: 'ERA5' },
        { feature: 'rain_7d_prior_mm', value: 98.5, unit: 'mm', description: 'ERA5' },
        { feature: 'elevation_m', value: 19.11, unit: 'm', description: 'Copernicus DEM' },
        { feature: 'slope_deg', value: 4.23, unit: 'degrees', description: 'Copernicus DEM' }
      ]
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    } as unknown as Response);

    const req: RetrospectiveScreeningRequest = {
      model_id: 'benchmark_a_logistic_regression',
      rain_1d_prior_mm: 7.5,
      rain_3d_prior_mm: 41.4,
      rain_7d_prior_mm: 98.5,
      elevation_m: 19.11,
      slope_deg: 4.23
    };

    const res = await screenHistoricalRecord(req);
    expect(res.relative_classification_score).toBe(0.722);
    expect(res.screening_tier).toBe('Elevated Screening Index');
    expect(res.disclaimer).toContain('Historical flood incident screening demonstration only');
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('posts comparison requests across both benchmarks', async () => {
    const mockCompareResponse = {
      comparison: {
        benchmark_a_logistic_regression: {
          model_id: 'benchmark_a_logistic_regression',
          relative_classification_score: 0.722,
          relative_score_percent: 72.2,
          screening_tier: 'Elevated Screening Index'
        },
        benchmark_b_random_forest: {
          model_id: 'benchmark_b_random_forest',
          relative_classification_score: 0.751,
          relative_score_percent: 75.1,
          screening_tier: 'Elevated Screening Index'
        }
      },
      interpretation_note: 'Benchmark A was trained against uniform landscape background; Benchmark B was trained against terrain-restricted lowlands.',
      disclaimer: 'Historical flood incident screening demonstration only. Not a real-time flood forecast or safety warning.',
      data_source: 'Historical ECMWF ERA5 reanalysis & Copernicus DEM 30m.'
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockCompareResponse
    } as unknown as Response);

    const req: RetrospectiveScreeningRequest = {
      model_id: 'benchmark_a_logistic_regression',
      rain_1d_prior_mm: 7.5,
      rain_3d_prior_mm: 41.4,
      rain_7d_prior_mm: 98.5,
      elevation_m: 19.11,
      slope_deg: 4.23
    };

    const res = await compareBenchmarks(req);
    expect(res.comparison.benchmark_a_logistic_regression.relative_classification_score).toBe(0.722);
    expect(res.comparison.benchmark_b_random_forest.relative_classification_score).toBe(0.751);
    expect(res.interpretation_note).toContain('Benchmark A was trained against uniform landscape');
    expect(fetchSpy).toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
