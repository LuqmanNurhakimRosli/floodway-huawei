import { describe, expect, it } from 'vitest';
import { floodProneModel, floodProneScore, fuse, modelLevel } from '../lib/fusion';
import type { FactorStates } from '../lib/stormScenario';
import { fuseStates, STORM_DURATION_S, STORM_STEPS, stormStateAt } from '../lib/stormScenario';

// Same cases as backend/tests/test_fusion.py: the two copies of the rule must agree.
describe('fuse', () => {
  it('is NORMAL with no data', () => {
    expect(fuse({ iot: null, cctv: null, model: null, met: null })).toMatchObject({ level: 'NORMAL', reporting: 0 });
  });

  it('lets a live reading alone set the level', () => {
    expect(fuse({ cctv: 'WARNING' }).level).toBe('WARNING');
    expect(fuse({ iot: 'ADVISORY', cctv: 'NORMAL' }).level).toBe('ADVISORY');
  });

  it('caps context alone at ADVISORY', () => {
    expect(fuse({ model: 'WARNING', met: 'DANGER', cctv: 'NORMAL' })).toMatchObject({ level: 'ADVISORY', capped: true, escalated: false });
  });

  it('raises one step when another factor is at WARNING', () => {
    expect(fuse({ iot: 'WARNING', met: 'WARNING' })).toMatchObject({ level: 'DANGER', escalated: true });
    expect(fuse({ cctv: 'ADVISORY', model: 'WARNING' }).level).toBe('WARNING');
    expect(fuse({ iot: 'WARNING', cctv: 'WARNING' }).level).toBe('DANGER');
  });

  it('does not count the lead factor as agreeing with itself', () => {
    expect(fuse({ iot: 'WARNING', cctv: 'NORMAL', model: 'ADVISORY' })).toMatchObject({ level: 'WARNING', escalated: false });
  });

  it('keeps DANGER at DANGER', () => {
    const f = fuse({ iot: 'DANGER', cctv: 'DANGER', model: 'WARNING', met: 'WARNING' });
    expect(f.level).toBe('DANGER');
    expect(f.agreeing).toHaveLength(4);
  });

  it('bands the model score and never lets it reach DANGER alone', () => {
    expect([0.25, 0.44, 0.74, 0.99].map(modelLevel)).toEqual(['NORMAL', 'ADVISORY', 'WARNING', 'WARNING']);
  });
});

describe('floodProneScore', () => {
  it('matches scikit-learn on the exported reference inputs', () => {
    for (const ref of floodProneModel.reference) {
      expect(floodProneScore(ref.rain as [number, number, number])).toBeCloseTo(ref.score, 5);
    }
  });

  it('scores a held-out 2021 flood site, not a made-up one', () => {
    expect(floodProneModel.site).toMatchObject({ id: 'POS_13440', place: 'Jalan Dang Wangi', flood_date: '2021-12-18' });
  });
});

describe('storm scenario', () => {
  const idle: FactorStates = {
    model: { level: 'NORMAL', value: '0.25', detail: 'dry week', source: 'MODEL' },
    met: { level: null, value: '-', detail: 'no feed', source: 'SCRIPTED' },
    iot: { level: null, value: '-', detail: 'offline', source: 'REAL' },
    cctv: { level: 'NORMAL', value: '20%', detail: 'sample', source: 'SAMPLE' },
  };
  const levelsAt = (t: number) => fuseStates(stormStateAt(t, idle).factors);

  it('starts from the idle state and ends in DANGER with every factor agreeing', () => {
    expect(levelsAt(-1).level).toBe('NORMAL');
    const end = levelsAt(STORM_DURATION_S);
    expect(end.level).toBe('DANGER');
    expect(end.agreeing.sort()).toEqual(['cctv', 'iot', 'met', 'model']);
  });

  it('only watches (ADVISORY) while context alone is raised', () => {
    expect(levelsAt(20).level).toBe('ADVISORY');
  });

  it('warns on the first agreeing live reading and says leave before the camera sees it', () => {
    expect(levelsAt(24).level).toBe('WARNING');
    expect(levelsAt(32).level).toBe('DANGER');
    expect(stormStateAt(32, idle).factors.cctv.level).toBe('NORMAL');
  });

  it('labels every scripted value and emits notices in time order', () => {
    const { factors, notices } = stormStateAt(STORM_DURATION_S, idle);
    expect(factors.met.source).toBe('SCRIPTED');
    expect(factors.iot.source).toBe('SCRIPTED');
    expect(factors.model.source).toBe('MODEL');
    expect(notices.map((n) => n.title)).toEqual(STORM_STEPS.filter((s) => s.notice).map((s) => s.notice!.title));
    expect(notices.at(-1)?.level).toBe('DANGER');
  });
});
