import { afterEach, describe, expect, it } from 'vitest';
import { authHeaders, hasWriteToken, setWriteToken } from '../services/auth';

afterEach(() => setWriteToken(''));

describe('operator write token (memory only)', () => {
  it('sends nothing until a token is set', () => {
    expect(authHeaders()).toEqual({});
    expect(hasWriteToken()).toBe(false);
  });
  it('sends a Bearer header once set, trimmed', () => {
    setWriteToken('  s3cret  ');
    expect(authHeaders()).toEqual({ Authorization: 'Bearer s3cret' });
    expect(hasWriteToken()).toBe(true);
  });
  it('can be cleared', () => {
    setWriteToken('x');
    setWriteToken('');
    expect(authHeaders()).toEqual({});
  });
  it('never touches web storage', () => {
    setWriteToken('should-not-be-stored');
    expect(JSON.stringify({ ...globalThis.localStorage })).not.toContain('should-not-be-stored');
  });
});
