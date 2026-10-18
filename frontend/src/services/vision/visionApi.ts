import type { AlertEvent, Barrier, BarrierAction, BarrierEvent, Camera, CameraDraft, LeadTimeEntry, Reading, StormRun, StormScenario } from '../../types/vision';
import { authHeaders, NEEDS_TOKEN_MESSAGE } from '../auth';
import { VISION_API } from './config';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${VISION_API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* keep statusText */
    }
    throw new ApiError(res.status, res.status === 401 ? NEEDS_TOKEN_MESSAGE : detail);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const listCameras = () => request<Camera[]>('/cameras');
export const createCamera = (draft: CameraDraft) => request<Camera>('/cameras', { method: 'POST', body: JSON.stringify(draft) });
export const deleteCamera = (id: string) => request<void>(`/cameras/${id}`, { method: 'DELETE' });
export const analyzeNow = (id: string) => request<Reading>(`/cameras/${id}/analyze`, { method: 'POST' });
export const getReadings = (id: string, limit = 30) => request<Reading[]>(`/cameras/${id}/readings?limit=${limit}`);
export const listAlerts = (limit = 20) => request<AlertEvent[]>(`/alerts?limit=${limit}`);
export const testCamera = (draft: CameraDraft) => request<Reading>('/cameras/test', { method: 'POST', body: JSON.stringify(draft) });

export const listLeadTimes = (limit = 50) => request<LeadTimeEntry[]>(`/lead-times?limit=${limit}`);
export const listBarriers = () => request<Barrier[]>('/barriers');
export const listBarrierEvents = (limit = 30) => request<BarrierEvent[]>(`/barriers/events?limit=${limit}`);
export const commandBarrier = (id: string, action: BarrierAction, note = '') =>
  request<BarrierEvent>(`/barriers/${encodeURIComponent(id)}/command`, { method: 'POST', body: JSON.stringify({ action, note }) });
export const listStormScenarios = () => request<StormScenario[]>('/storm-lab/scenarios');
export const runStorm = (scenario: string) => request<StormRun>('/storm-lab/run', { method: 'POST', body: JSON.stringify({ scenario }) });

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png'];

/** Send a photo as the raw request body (no multipart). Returns the `upload:<id>` reference to use as source_url. */
export async function uploadPhoto(file: File): Promise<string> {
  const { source_url } = await request<{ source_url: string }>('/cameras/upload', { method: 'POST', body: file, headers: { 'Content-Type': file.type } });
  return source_url;
}

/** Fetch one frame from a draft source. Returns an object URL; revoke it when done. */
export async function previewFrame(draft: Pick<CameraDraft, 'source_type' | 'source_url' | 'username' | 'password'>): Promise<string> {
  const res = await fetch(`${VISION_API}/cameras/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(draft),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* keep statusText */
    }
    throw new ApiError(res.status, res.status === 401 ? NEEDS_TOKEN_MESSAGE : String(detail));
  }
  return URL.createObjectURL(await res.blob());
}

/** Latest captured frame. `tick` changes every cycle so the browser refetches. */
export const frameUrl = (cameraId: string, tick: string | number): string =>
  `${VISION_API}/cameras/${cameraId}/frame.jpg?t=${encodeURIComponent(String(tick))}`;
