// The FloodWay backend API, the same endpoints the web app uses. Every request has a timeout, so a dead or stalled
// server shows as "not reachable" instead of a screen that loads forever.
import { mapReport, mapShelter, type AlertEvent, type Camera, type CitizenReport, type Shelter } from '../shared';
import { serverUrl } from './settings';

export class ApiError extends Error {
  constructor(message: string, readonly status: number | null) {
    super(message);
  }
}

export async function getJson<T>(path: string, timeoutMs = 10000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${serverUrl()}${path}`, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new ApiError(`The server answered ${res.status}.`, res.status);
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(ctrl.signal.aborted ? 'The server did not answer in time.' : 'Could not reach the FloodWay server.', null);
  } finally {
    clearTimeout(timer);
  }
}

const asList = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? (v as Record<string, unknown>[]) : []);

export const api = {
  cameras: () => getJson<Camera[]>('/api/v1/vision/cameras'),
  alerts: (limit = 30) => getJson<AlertEvent[]>(`/api/v1/vision/alerts?limit=${limit}`),
  shelters: async (): Promise<Shelter[]> => asList(await getJson<unknown>('/api/v1/shelters')).map((r) => mapShelter(r)),
  reports: async (): Promise<CitizenReport[]> => asList(await getJson<unknown>('/api/v1/reports')).map((r) => mapReport(r)),
};
