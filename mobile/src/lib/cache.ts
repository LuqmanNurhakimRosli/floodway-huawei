// Last-known data with the time it was saved. The UI must always say how old cached data is: an old reading shown as
// current is the most dangerous mistake a flood app can make.
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Cached<T> {
  data: T;
  savedAt: number;
}

export interface Fetched<T> {
  data: T | null;
  /** When the data was fetched (live) or saved (cached). */
  at: number | null;
  live: boolean;
  error: string | null;
}

const prefix = (key: string) => `floodway.cache.${key}`;

export async function saveCache<T>(key: string, data: T, now = Date.now()): Promise<void> {
  try {
    await AsyncStorage.setItem(prefix(key), JSON.stringify({ data, savedAt: now } satisfies Cached<T>));
  } catch {
    // storage full or unavailable: the live data still shows
  }
}

export async function loadCache<T>(key: string): Promise<Cached<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(prefix(key));
    if (!raw) return null;
    const v = JSON.parse(raw) as Cached<T>;
    return typeof v?.savedAt === 'number' && 'data' in v ? v : null;
  } catch {
    return null;
  }
}

/** Live data when the server answers (and it is saved), else the last saved copy marked as not live. */
export async function liveOrCached<T>(key: string, fetcher: () => Promise<T>, now = () => Date.now()): Promise<Fetched<T>> {
  try {
    const data = await fetcher();
    const at = now();
    await saveCache(key, data, at);
    return { data, at, live: true, error: null };
  } catch (e) {
    const cached = await loadCache<T>(key);
    const error = e instanceof Error ? e.message : 'Could not load data.';
    return cached ? { data: cached.data, at: cached.savedAt, live: false, error } : { data: null, at: null, live: false, error };
  }
}

/** "Live, 2 min ago" or "Saved 3 h ago, not live". */
export function dataAgeText(f: Pick<Fetched<unknown>, 'at' | 'live'>, now = Date.now()): string {
  if (f.at === null) return 'No data yet';
  const min = Math.max(0, Math.round((now - f.at) / 60000));
  const age = min < 1 ? 'just now' : min < 60 ? `${min} min ago` : min < 48 * 60 ? `${Math.round(min / 60)} h ago` : `${Math.round(min / 1440)} days ago`;
  return f.live ? `Live, updated ${age}` : `Saved ${age}, not live`;
}
