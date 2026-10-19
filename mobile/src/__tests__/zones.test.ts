import { demoAreas, floodZones, myRisk } from '../lib/zones';
import { FLOOD_PRONE, type Camera } from '../shared';

const cam = (level: string, online = true) =>
  ({ id: `c-${level}`, name: `Cam ${level}`, lat: 3.15, lon: 101.7, online, reading: { level, water_ratio: 0.6 } }) as unknown as Camera;

describe('floodZones', () => {
  it('makes zones for online cameras at WARNING or DANGER only', () => {
    const z = floodZones([cam('DANGER'), cam('WARNING'), cam('NORMAL'), cam('DANGER', false)], []);
    expect(z.map((x) => x.id)).toEqual(['cam-c-DANGER', 'cam-c-WARNING']);
    expect(z.every((x) => x.kind === 'camera' && x.radiusM > 0)).toBe(true);
  });
});

describe('myRisk', () => {
  it('is null without a location', () => {
    expect(myRisk(null, floodZones([cam('DANGER')], []))).toBeNull();
  });
  it('counts a camera zone you stand in', () => {
    const r = myRisk({ lat: 3.15, lon: 101.7 }, floodZones([cam('DANGER')], []));
    expect(r?.risk).toBe('flooded');
  });
  it('never counts the demo flood-prone areas as flooding', () => {
    const a = FLOOD_PRONE[0];
    const inside = myRisk({ lat: a.lat, lon: a.lon }, demoAreas());
    const empty = myRisk({ lat: a.lat, lon: a.lon }, []);
    expect(inside).toEqual(empty);
    expect(inside?.risk).toBe('clear');
  });
});
