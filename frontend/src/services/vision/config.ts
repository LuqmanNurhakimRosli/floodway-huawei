const env = ((import.meta as any).env ?? {}) as Record<string, string | undefined>;

/** Backend origin. Leave VITE_API_BASE unset in dev to use http://localhost:8080. */
export const API_BASE = (env.VITE_API_BASE ?? 'http://localhost:8080').replace(/\/$/, '');
export const VISION_API = `${API_BASE}/api/v1/vision`;
export const VISION_WS = `${VISION_API.replace(/^http/, 'ws')}/ws`;
/** Set VITE_VISION_MOCK=1 to skip the backend and run on built-in sample data. */
export const FORCE_MOCK = env.VITE_VISION_MOCK === '1';
