import { describe, expect, it } from 'vitest';
import { BASEMAPS } from '../config/mapConfig';

describe('basemap providers', () => {
  it('every provider can build a tile URL and credits its data', () => {
    expect(BASEMAPS.length).toBeGreaterThan(1);
    for (const p of BASEMAPS) {
      // Leaflet reads subdomains for every tile, even when the URL has no {s}: an empty list crashes the map
      expect(p.subdomains.length).toBeGreaterThan(0);
      expect(p.url).toMatch(/^https:\/\//);
      for (const part of ['{z}', '{x}', '{y}']) expect(p.url).toContain(part);
      expect(p.attribution).toContain('OpenStreetMap');
      expect(p.maxZoom).toBeGreaterThanOrEqual(18);
    }
  });

  it('needs no API key in the URL', () => {
    for (const p of BASEMAPS) expect(p.url).not.toMatch(/key=|token=|access_token/i);
  });

  it('skips hosts that serve an "API key required" image instead of failing', () => {
    for (const p of BASEMAPS) expect(p.url).not.toContain('cartocdn.com');
  });
});
