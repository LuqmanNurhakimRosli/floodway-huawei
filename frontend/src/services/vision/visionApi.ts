import type { AlertEvent, Camera, CameraDraft, Reading } from '../../types/vision';
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
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* keep statusText */
    }
    throw new ApiError(res.status, detail);
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

/** Fetch one frame from a draft source. Returns an object URL; revoke it when done. */
export async function previewFrame(draft: Pick<CameraDraft, 'source_type' | 'source_url' | 'username' | 'password'>): Promise<string> {
  const res = await fetch(`${VISION_API}/cameras/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {
      /* keep statusText */
    }
    throw new ApiError(res.status, String(detail));
  }
  return URL.createObjectURL(await res.blob());
}

/** Latest captured frame. `tick` changes every cycle so the browser refetches. */
export const frameUrl = (cameraId: string, tick: string | number): string =>
  `${VISION_API}/cameras/${cameraId}/frame.jpg?t=${encodeURIComponent(String(tick))}`;
