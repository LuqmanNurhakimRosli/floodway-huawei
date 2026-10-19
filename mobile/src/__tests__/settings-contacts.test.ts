import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadContacts, validPhone } from '../lib/contacts';
import { normaliseServerUrl } from '../lib/settings';

describe('normaliseServerUrl', () => {
  it('accepts http and https URLs and drops a trailing slash', () => {
    expect(normaliseServerUrl(' http://192.168.1.5:8080/ ')).toBe('http://192.168.1.5:8080');
    expect(normaliseServerUrl('https://api.example.org')).toBe('https://api.example.org');
  });
  it('rejects anything else', () => {
    expect(normaliseServerUrl('192.168.1.5:8080')).toBeNull();
    expect(normaliseServerUrl('ftp://x')).toBeNull();
    expect(normaliseServerUrl('http://a b')).toBeNull();
    expect(normaliseServerUrl('')).toBeNull();
  });
});

describe('contacts', () => {
  it('validates phone numbers', () => {
    expect(validPhone('+60 12-345 6789')).toBe(true);
    expect(validPhone('999')).toBe(false);
    expect(validPhone('call me')).toBe(false);
  });
  it('drops malformed saved entries', async () => {
    await AsyncStorage.setItem('floodway.contacts', JSON.stringify([{ id: '1', name: 'Mum', phone: '0123456789' }, { id: 2 }, null]));
    expect(await loadContacts()).toEqual([{ id: '1', name: 'Mum', phone: '0123456789' }]);
  });
});
