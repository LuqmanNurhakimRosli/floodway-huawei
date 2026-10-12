import { describe, expect, it } from 'vitest';
import { photoProblem } from '../components/live/onboarding/StepSource';

const file = (type: string, bytes = 10) => new File([new Uint8Array(bytes)], 'river', { type });

describe('photoProblem', () => {
  it('asks for a photo when none is chosen', () => expect(photoProblem(null)).toMatch(/choose a photo/i));
  it('accepts JPEG and PNG', () => {
    expect(photoProblem(file('image/jpeg'))).toBeNull();
    expect(photoProblem(file('image/png'))).toBeNull();
  });
  it('rejects other types', () => {
    expect(photoProblem(file('image/gif'))).toMatch(/jpeg or png/i);
    expect(photoProblem(file('text/plain'))).toMatch(/jpeg or png/i);
  });
  it('rejects anything over 5 MB and accepts exactly 5 MB', () => {
    expect(photoProblem(file('image/jpeg', 5 * 1024 * 1024 + 1))).toMatch(/5 MB/);
    expect(photoProblem(file('image/jpeg', 5 * 1024 * 1024))).toBeNull();
  });
});
