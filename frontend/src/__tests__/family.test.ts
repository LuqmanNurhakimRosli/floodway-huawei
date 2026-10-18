import { describe, expect, it } from 'vitest';
import { agoText, fmtDistance, initials, nearestOpenCentre, nearestOriginId, pingPong, placeAt, placeChange, riskAt, sinceText, sortMembers, summarise, whereText, type FamilyMember, type Place } from '../lib/family';
import type { LatLon, Zone } from '../lib/routing';

const zone: Zone = { id: 'z', lat: 3.1112, lon: 101.6645, radiusM: 250 };
const member = (id: string, lat: number, lon: number, extra: Partial<FamilyMember> = {}): FamilyMember => ({
  id, name: id, relation: '', colors: ['#000', '#111'], lat, lon, source: 'demo', battery: 50, updatedAt: 0, since: 0, status: 'ok', ...extra,
});
const home: Place = { id: 'home', name: 'Home', kind: 'home', lat: 3.165, lon: 101.702, radiusM: 150, alerts: true };

describe('family helpers', () => {
  it('makes initials from one or two names', () => {
    expect(initials('Nurul Huda')).toBe('NH');
    expect(initials('Tok Wan')).toBe('TW');
    expect(initials('Aisyah')).toBe('AI');
    expect(initials('  ')).toBe('?');
  });

  it('tells flooded, near and clear apart', () => {
    expect(riskAt([3.1112, 101.6645], [zone]).risk).toBe('flooded');
    // about 400 m north of the centre: 150 m outside the 250 m edge
    expect(riskAt([3.1148, 101.6645], [zone])).toMatchObject({ risk: 'near' });
    expect(riskAt([3.16, 101.7], [zone]).risk).toBe('clear');
    expect(riskAt([3.16, 101.7], []).risk).toBe('clear');
  });

  it('finds the place a member is at, and arrivals and departures', () => {
    expect(placeAt([3.1651, 101.7019], [home])?.id).toBe('home');
    expect(placeAt([3.17, 101.71], [home])).toBeNull();
    const away: LatLon = [3.17, 101.71];
    expect(placeChange(away, [3.165, 101.702], [home]).arrived?.id).toBe('home');
    expect(placeChange([3.165, 101.702], away, [home]).left?.id).toBe('home');
    expect(placeChange(away, away, [home])).toEqual({ left: null, arrived: null });
  });

  it('skips full and closed centres', () => {
    const centres = [
      { id: 'a', lat: 3.165, lon: 101.702, status: 'FULL' },
      { id: 'b', lat: 3.18, lon: 101.69, status: 'OPEN' },
    ];
    expect(nearestOpenCentre([3.165, 101.702], centres)?.centre.id).toBe('b');
    expect(nearestOpenCentre([3.165, 101.702], [centres[0]])).toBeNull();
  });

  it('maps a position to the closest demo start point', () => {
    expect(nearestOriginId([3.1112, 101.6648])).toBe('pantai-dalam');
    expect(nearestOriginId([3.1642, 101.7031])).toBe('kampung-baru');
  });

  it('writes where and since lines', () => {
    expect(whereText(member('m', 3.1651, 101.7019), [home])).toBe('At Home');
    expect(whereText(member('m', 3.184, 101.693), [])).toBe('Near Sentul');
    expect(whereText(member('m', 1.35, 103.82), [])).toBe('Outside the Kuala Lumpur demo area');
    expect(whereText(member('m', 3.129, 101.679, { speedKmh: 30 }), [])).toBe('Driving near Bangsar, 30 km/h');
    const now = new Date(2026, 9, 18, 12, 0).getTime();
    expect(sinceText(now - 4 * 60000, now)).toBe('Here for 4 min');
    expect(sinceText(now - 10 * 1000, now)).toBe('Here for 1 min');
    expect(sinceText(new Date(2026, 9, 18, 9, 5).getTime(), now)).toBe('Since 09:05');
    expect(sinceText(new Date(2026, 9, 17, 19, 26).getTime(), now)).toBe('Since 19:26 yesterday');
    expect(agoText(now - 5000, now)).toBe('Just now');
    expect(agoText(now - 3 * 60000, now)).toBe('3 min ago');
    expect(fmtDistance(140)).toBe('140 m');
    expect(fmtDistance(1430)).toBe('1.4 km');
  });

  it('summarises and orders the circle: SOS, then flooded, near, others, you last', () => {
    const ms = [
      member('you', 3.16, 101.7, { isYou: true }),
      member('clear', 3.165, 101.702),
      member('near', 3.1148, 101.6645),
      member('flooded', 3.1112, 101.6645),
      member('sos', 3.16, 101.7, { status: 'sos' }),
    ];
    expect(summarise(ms, [zone])).toEqual({ total: 5, sos: 1, flooded: 1, near: 1, safe: 2 });
    expect(sortMembers(ms, [zone]).map((m) => m.id)).toEqual(['sos', 'flooded', 'near', 'clear', 'you']);
  });

  it('drives back and forth along a line', () => {
    const line: LatLon[] = [[3.1, 101.6], [3.1, 101.61]];
    expect(pingPong(line, 0, 100).pos).toEqual([3.1, 101.6]);
    const mid = pingPong(line, 25, 100);
    expect(mid.heading).toBe(1);
    expect(mid.pos[1]).toBeCloseTo(101.605, 3);
    expect(pingPong(line, 50, 100).pos[1]).toBeCloseTo(101.61, 4);
    expect(pingPong(line, 75, 100).heading).toBe(-1);
    expect(pingPong(line, 100, 100).pos).toEqual([3.1, 101.6]);
  });
});
