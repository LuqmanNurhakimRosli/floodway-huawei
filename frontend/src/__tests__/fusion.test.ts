import { describe, expect, it } from 'vitest';
import { floodProneModel, floodProneScore, fuse, modelLevel } from '../lib/fusion';
import type { FactorStates } from '../lib/stormScenario';
import { cameraFactor, fuseStates, idleIot, idleMet, STORM_DURATION_S, STORM_STEPS, stormCameraRatio, stormStateAt } from '../lib/stormScenario';

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
    model: { level: 'NORMAL', value: '0.25', detail: 'dry week' },
    met: idleMet(),
    iot: idleIot(),
    cctv: cameraFactor(0.17),
  };
  const at = (frac: number) => stormStateAt(frac * STORM_DURATION_S, idle);
  const fused = (frac: number) => fuseStates(at(frac).factors);

  it('runs for 15 seconds, set by one constant', () => {
    expect(STORM_DURATION_S).toBe(15);
    expect(STORM_STEPS.every((s) => s.at >= 0 && s.at <= 1)).toBe(true);
  });

  it('starts calm, and ends in DANGER with every factor agreeing', () => {
    expect(fuseStates(idle).level).toBe('NORMAL');
    const end = fused(1);
    expect(end.level).toBe('DANGER');
    expect(end.agreeing.sort()).toEqual(['cctv', 'iot', 'met', 'model']);
  });

  it('only watches (ADVISORY) while context alone is raised', () => {
    expect(fused(0.3).level).toBe('ADVISORY');
  });

  it('says leave (DANGER) on the sensor warning, before the camera reaches warning', () => {
    expect(fused(0.53).level).toBe('DANGER');
    expect(at(0.53).factors.cctv.level).toBe('ADVISORY');
  });

  it('raises the Kampung Baru camera slowly from calm to the danger line', () => {
    const calm = 0.17;
    expect(stormCameraRatio(0, calm)).toBeCloseTo(calm, 5);
    const ratios = [0, 0.35, 0.5, 0.65, 0.8, 0.9, 1].map((f) => stormCameraRatio(f * STORM_DURATION_S, calm));
    expect(ratios).toEqual([...ratios].sort((a, b) => a - b));
    expect(ratios[ratios.length - 1]).toBeGreaterThanOrEqual(0.97);
    expect(at(1).factors.cctv.level).toBe('DANGER');
  });

  it('emits notices in time order, the last one at DANGER', () => {
    const { notices } = at(1);
    expect(notices.map((n) => n.title)).toEqual(STORM_STEPS.filter((s) => s.notice).map((s) => s.notice!.title));
    expect(notices.at(-1)?.level).toBe('DANGER');
  });
});
