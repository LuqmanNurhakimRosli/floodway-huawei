import { describe, expect, it } from 'vitest';
import { benchAlertFor, levelForWater, parseBenchLine } from '../lib/benchSensor';

describe('parseBenchLine (ESP32 bench node lines)', () => {
  it('reads the new "pct,STATUS,distance" line', () => {
    expect(parseBenchLine('57,WARNING,4.0')).toEqual({ distanceCm: 4, waterCm: 4, pct: 57, level: 'WARNING', deviceStatus: 'WARNING' });
  });

  it('works the distance back from the old "pct,STATUS" line', () => {
    const r = parseBenchLine('80,DANGER\r');
    expect(r?.distanceCm).toBe(2.4);
    expect(r?.level).toBe('DANGER');
  });

  it('accepts "dist: 3.5" and a bare number', () => {
    expect(parseBenchLine('dist: 3.5 cm')?.waterCm).toBe(4.5);
    expect(parseBenchLine('7.0')?.level).toBe('NORMAL');
  });

  it('ignores debug lines, boot noise and cut-off fragments instead of reading them as a full cup', () => {
    for (const line of ['# no echo', '', 'rst:0x1 (POWERON_RESET),boot:0x13 (SPI_FAST_FLASH_BOOT)', 'load:0x3fff0030,len:1344', '0', '.0', 'NING,4.0', '57,WARNING,']) {
      expect(parseBenchLine(line)).toBeNull();
    }
  });

  it('clamps to the cup', () => {
    expect(parseBenchLine('0,SAFE,9.3')).toMatchObject({ distanceCm: 8, waterCm: 0, pct: 0 });
  });
});

describe('levelForWater matches backend fw-bench-01 thresholds', () => {
  it.each([
    [1.0, 'NORMAL'],
    [2.25, 'ADVISORY'],
    [3.0, 'WARNING'],
    [5.0, 'DANGER'],
  ])('%s cm of water is %s', (cm, level) => {
    expect(levelForWater(cm)).toBe(level);
  });
});

describe('benchAlertFor (which level changes get a toast)', () => {
  it('alerts on rising into WARNING or DANGER and on getting back to NORMAL', () => {
    expect(benchAlertFor('NORMAL', 'WARNING')?.level).toBe('WARNING');
    expect(benchAlertFor('ADVISORY', 'DANGER')?.level).toBe('DANGER');
    expect(benchAlertFor('DANGER', 'NORMAL')?.title).toBe('Water back to normal');
  });

  it('stays quiet for ADVISORY flicker and for stepping down inside the alert levels', () => {
    expect(benchAlertFor('NORMAL', 'ADVISORY')).toBeNull();
    expect(benchAlertFor('ADVISORY', 'NORMAL')).toBeNull();
    expect(benchAlertFor('DANGER', 'WARNING')).toBeNull();
  });
});
