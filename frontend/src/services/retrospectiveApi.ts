/**
 * frontend/src/services/retrospectiveApi.ts
 *
 * Client API for FloodWay Stage 5.5 Retrospective Model Screening Demonstration.
 */

import { API_BASE } from './vision/config';

const BACKEND_URL = `${API_BASE}/api/v1/retrospective`;

export interface FeatureItem {
  feature: string;
  value: number;
  unit: string;
  description: string;
}

export interface HistoricalExample {
  id: string;
  title: string;
  provenance: string;
  is_incident: boolean;
  date: string;
  state: string;
  place: string;
  rain_1d_prior_mm: number;
  rain_3d_prior_mm: number;
  rain_7d_prior_mm: number;
  elevation_m: number;
  slope_deg: number;
}

export interface RetrospectiveScreeningRequest {
  model_id: 'benchmark_a_logistic_regression' | 'benchmark_b_random_forest' | 'benchmark_a_random_forest' | 'benchmark_b_logistic_regression';
  rain_1d_prior_mm: number;
  rain_3d_prior_mm: number;
  rain_7d_prior_mm: number;
  elevation_m: number;
  slope_deg: number;
  metadata?: Record<string, unknown>;
}

export interface RetrospectiveScreeningResponse {
  model_id: string;
  model_name: string;
  benchmark_type: string;
  model_architecture: string;
  relative_classification_score: number;
  relative_score_percent: number;
  screening_tier: string;
  tier_description: string;
  tier_basis?: string;
  score_interpretation: string;
  disclaimer: string;
  data_source: string;
  feature_vector_used: FeatureItem[];
  metadata?: Record<string, unknown>;
}

export interface RetrospectiveComparisonResponse {
  comparison: {
    benchmark_a_logistic_regression: RetrospectiveScreeningResponse;
    benchmark_b_random_forest: RetrospectiveScreeningResponse;
  };
  interpretation_note: string;
  disclaimer: string;
  data_source: string;
}

const FALLBACK_EXAMPLES: HistoricalExample[] = [
  {
    id: 'example-flood-incident-1',
    title: 'Reported Flood Incident: Kg. Ulu Pulai, Johor (2020-06-20)',
    provenance: 'Authentic Test Set Record POS_9564 (JPS Historical Incident)',
    is_incident: true,
    date: '2020-06-20',
    state: 'Johor',
    place: 'Kg. Ulu Pulai',
    rain_1d_prior_mm: 7.5,
    rain_3d_prior_mm: 41.4,
    rain_7d_prior_mm: 98.5,
    elevation_m: 19.11,
    slope_deg: 4.23
  },
  {
    id: 'example-flood-incident-2',
    title: 'Reported Flood Incident: Jln. Bakariah, Johor (2020-07-13)',
    provenance: 'Authentic Test Set Record POS_9603 (JPS Historical Incident)',
    is_incident: true,
    date: '2020-07-13',
    state: 'Johor',
    place: 'Jln. Bakariah',
    rain_1d_prior_mm: 6.1,
    rain_3d_prior_mm: 15.5,
    rain_7d_prior_mm: 64.2,
    elevation_m: 5.57,
    slope_deg: 1.88
  },
  {
    id: 'example-background-landscape-1',
    title: 'Background Landscape Point: Selangor Lowland (2020-11-11)',
    provenance: 'Authentic Test Set Record STAGE5_1A_UNIFORM_NEG_166 (Uniform Background Sample)',
    is_incident: false,
    date: '2020-11-11',
    state: 'Selangor',
    place: 'Landscape background location',
    rain_1d_prior_mm: 0.1,
    rain_3d_prior_mm: 9.0,
    rain_7d_prior_mm: 20.4,
    elevation_m: 6.5,
    slope_deg: 0.0
  }
];

export async function fetchHistoricalExamples(): Promise<HistoricalExample[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/examples`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.examples) && data.examples.length > 0) {
        return data.examples;
      }
    }
  } catch {
    // Fallback if backend is unavailable
  }
  return FALLBACK_EXAMPLES;
}

export async function screenHistoricalRecord(
  req: RetrospectiveScreeningRequest
): Promise<RetrospectiveScreeningResponse> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/screen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(5000)
    });
  } catch (e: unknown) {
    throw new Error(
      `Backend inference service unreachable (${BACKEND_URL}). Live model screening requires the active FastAPI backend. Please verify that the backend is running on port 8080.`
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Screening request rejected (${res.status}): ${errText}`);
  }

  return await res.json();
}

export async function compareBenchmarks(
  req: RetrospectiveScreeningRequest
): Promise<RetrospectiveComparisonResponse> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal: AbortSignal.timeout(5000)
    });
  } catch (e: unknown) {
    throw new Error(
      `Backend inference service unreachable (${BACKEND_URL}). Live model comparison requires the active FastAPI backend. Please verify that the backend is running on port 8080.`
    );
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Comparison request rejected (${res.status}): ${errText}`);
  }

  return await res.json();
}
