import { useEffect, useState } from 'react';
import { API_BASE } from '../services/vision/config';

export type BackendStatus = 'checking' | 'up' | 'down';

/** Polls the backend's /healthz. A real signal, unlike the old hard-coded "systems online" text. */
export function useBackendHealth(intervalMs = 15000): { status: BackendStatus; checkedAt: number | null } {
  const [state, setState] = useState<{ status: BackendStatus; checkedAt: number | null }>({ status: 'checking', checkedAt: null });
  useEffect(() => {
    let alive = true;
    const check = async () => {
      let status: BackendStatus = 'down';
      try {
        const res = await fetch(`${API_BASE}/healthz`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) status = 'up';
      } catch {
        /* unreachable */
      }
      if (alive) setState({ status, checkedAt: Date.now() });
    };
    void check();
    const t = setInterval(check, intervalMs);
    return () => { alive = false; clearInterval(t); };
  }, [intervalMs]);
  return state;
}
