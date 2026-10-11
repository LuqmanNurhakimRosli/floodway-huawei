import type { Reading } from '../../types/vision';

/** Timestamp of the reading where the current level started, or null if the history never shows a change. */
export function levelSince(history: Reading[]): string | null {
  if (history.length < 2) return null;
  const current = history[history.length - 1].level;
  for (let i = history.length - 2; i >= 0; i--) {
    if (history[i].level !== current) return history[i + 1].timestamp;
  }
  return null;
}
