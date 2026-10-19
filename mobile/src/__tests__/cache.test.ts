import AsyncStorage from '@react-native-async-storage/async-storage';
import { dataAgeText, liveOrCached } from '../lib/cache';

beforeEach(() => AsyncStorage.clear());

describe('liveOrCached', () => {
  it('returns live data and saves it', async () => {
    const f = await liveOrCached('k', async () => [1, 2], () => 1000);
    expect(f).toEqual({ data: [1, 2], at: 1000, live: true, error: null });
  });

  it('falls back to the saved copy, marked not live, with the time it was saved', async () => {
    await liveOrCached('k', async () => 'old', () => 1000);
    const f = await liveOrCached<string>('k', async () => { throw new Error('offline'); }, () => 9000);
    expect(f).toEqual({ data: 'old', at: 1000, live: false, error: 'offline' });
  });

  it('returns no data when the server fails and nothing was saved', async () => {
    const f = await liveOrCached('none', async () => { throw new Error('down'); });
    expect(f).toEqual({ data: null, at: null, live: false, error: 'down' });
  });

  it('ignores a corrupt saved copy', async () => {
    await AsyncStorage.setItem('floodway.cache.bad', '{not json');
    const f = await liveOrCached('bad', async () => { throw new Error('x'); });
    expect(f.data).toBeNull();
  });
});

describe('dataAgeText', () => {
  const now = 10 * 3600_000;
  it('says live or saved, never both', () => {
    expect(dataAgeText({ at: now - 2 * 60_000, live: true }, now)).toBe('Live, updated 2 min ago');
    expect(dataAgeText({ at: now - 3 * 3600_000, live: false }, now)).toBe('Saved 3 h ago, not live');
    expect(dataAgeText({ at: now, live: true }, now)).toBe('Live, updated just now');
    expect(dataAgeText({ at: null, live: false }, now)).toBe('No data yet');
  });
});
