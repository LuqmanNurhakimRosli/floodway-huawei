import { describe, expect, it } from 'vitest';
import { LEVELS, LEVEL_META, LEVEL_PALETTE } from '../lib/vision/levels';

// WCAG 2.x relative luminance and contrast ratio.
const lum = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string): number => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('risk colour scale (WCAG)', () => {
  for (const level of LEVELS) {
    const p = LEVEL_PALETTE[level];
    it(`${level}: text on tint is at least 4.5:1`, () => expect(contrast(p.text, p.tint)).toBeGreaterThanOrEqual(4.5));
    it(`${level}: white text on the solid fill is at least 4.5:1`, () => expect(contrast('#FFFFFF', p.solid)).toBeGreaterThanOrEqual(4.5));
    it(`${level}: the marker colour is at least 3:1 against white (non-text UI)`, () => expect(contrast(p.marker, '#FFFFFF')).toBeGreaterThanOrEqual(3));
    it(`${level}: LEVEL_META.hex is the palette marker`, () => expect(LEVEL_META[level].hex).toBe(p.marker));
  }

  it('the four levels are visibly different from each other', () => {
    const markers = LEVELS.map((l) => LEVEL_PALETTE[l].marker);
    expect(new Set(markers).size).toBe(4);
  });

  it('documents the values that must not carry white text', () => {
    // These fail 4.5:1 with white text, which is why the solid fills above are darker than the markers.
    for (const level of ['NORMAL', 'ADVISORY', 'WARNING'] as const) {
      expect(contrast('#FFFFFF', LEVEL_PALETTE[level].marker)).toBeLessThan(4.5);
    }
  });
});
