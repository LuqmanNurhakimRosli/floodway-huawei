// Emergency contacts, kept on this phone only.
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Contact {
  id: string;
  name: string;
  phone: string;
}
const KEY = 'floodway.contacts';

/** Digits, spaces, dashes, brackets and a leading +, 6 to 20 characters. */
export const validPhone = (p: string) => /^\+?[\d\s\-()]{6,20}$/.test(p.trim()) && /\d{6,}/.test(p.replace(/\D/g, ''));

export async function loadContacts(): Promise<Contact[]> {
  try {
    const v = JSON.parse((await AsyncStorage.getItem(KEY)) || '[]');
    return Array.isArray(v) ? v.filter((c) => typeof c?.name === 'string' && typeof c?.phone === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveContacts(list: Contact[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}
