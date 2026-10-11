// AI assessment of a citizen flood photo. The call is made by the FloodWay backend (POST /api/v1/ai/flood-image-check),
// so the OpenRouter key never reaches the browser. Never add a VITE_ key here.
//
// HONESTY: this is a model's opinion of one photo, not a verification by any agency. When the check cannot run
// (no key on the server, server unreachable, quota, bad output) the result says `ran: false`. There is no fallback
// that invents a result.
import { API_BASE } from './vision/config';
import { AiVerificationResult } from '../types';

export interface VisionAnalysisParams {
  imageUrl?: string;
  userDescription?: string;
  reportedDepthCm?: number;
}

interface BackendResult {
  available: boolean;
  engine: string;
  looks_like_flooding: boolean | null;
  appears_authentic: boolean | null;
  estimated_depth_cm: number | null;
  confidence: number | null;
  hazards: string[];
  notes: string;
}

const NOT_RUN = (notes: string, depth: number | undefined): AiVerificationResult => ({
  ran: false,
  verified: false,
  confidenceScore: 0,
  detectedHazards: [],
  estimatedDepthCm: depth ?? 0,
  engine: 'AI check not run',
  notes,
});

/** Converts an image path or blob URL to a base64 data URL the backend can forward to the model. */
async function toDataUrl(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith('data:')) return imageUrl;
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function analyzeFloodImage(params: VisionAnalysisParams): Promise<AiVerificationResult> {
  if (!params.imageUrl) return NOT_RUN('No photo was attached, so no AI check was run.', params.reportedDepthCm);
  try {
    const dataUrl = await toDataUrl(params.imageUrl);
    const res = await fetch(`${API_BASE}/api/v1/ai/flood-image-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_data_url: dataUrl,
        description: (params.userDescription ?? '').slice(0, 300),
        reported_depth_cm: params.reportedDepthCm ?? null,
      }),
      signal: AbortSignal.timeout(45000),
    });
    if (res.status === 429) return NOT_RUN('Too many AI checks in a short time. Try again in a minute.', params.reportedDepthCm);
    if (res.status === 401) return NOT_RUN('The AI check is protected on this server.', params.reportedDepthCm);
    if (!res.ok) return NOT_RUN(`The AI check could not be completed (server answered ${res.status}).`, params.reportedDepthCm);
    const r = (await res.json()) as BackendResult;
    if (!r.available) return NOT_RUN(r.notes, params.reportedDepthCm);
    return {
      ran: true,
      // "verified" here only means the model judged it to look like real flooding. It is not an official verification.
      verified: r.looks_like_flooding === true && r.appears_authentic !== false,
      appearsAuthentic: r.appears_authentic,
      confidenceScore: r.confidence ?? 0,
      detectedHazards: r.hazards,
      estimatedDepthCm: r.estimated_depth_cm ?? params.reportedDepthCm ?? 0,
      engine: r.engine,
      notes: r.notes,
    };
  } catch {
    return NOT_RUN('Could not reach the FloodWay server, so the AI check was not run.', params.reportedDepthCm);
  }
}
