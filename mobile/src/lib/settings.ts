import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'floodway.serverUrl';
/** The build-time default (EXPO_PUBLIC_API_BASE), else the Android emulator's address for a backend on this computer. */
export const DEFAULT_SERVER = (process.env.EXPO_PUBLIC_API_BASE || 'http://10.0.2.2:8080').replace(/\/$/, '');

let current = DEFAULT_SERVER;
export const serverUrl = () => current;

/** A full http(s) URL without a trailing slash, or null. */
export function normaliseServerUrl(input: string): string | null {
  const v = input.trim().replace(/\/+$/, '');
  return /^https?:\/\/[^\s/]+(:\d+)?(\/[^\s]*)?$/i.test(v) ? v : null;
}

export async function loadServerUrl(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (saved && normaliseServerUrl(saved)) current = saved;
  } catch {
    // storage unavailable: keep the default
  }
  return current;
}

export async function saveServerUrl(url: string): Promise<boolean> {
  const v = normaliseServerUrl(url);
  if (!v) return false;
  current = v;
  await AsyncStorage.setItem(KEY, v);
  return true;
}
