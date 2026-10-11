import type { Calibration } from '../../types/vision';

export interface Thresholds {
  normal: number;
  warning: number;
  danger: number;
}

/** Same maths as the backend: express the drawn lines on a 0 (bed) .. 1 (danger line) bank-height scale. */
export function thresholdsFromCalibration(cal: Calibration): Thresholds {
  const bed = Math.max(...cal.roi.map((p) => p[1]));
  const span = Math.max(bed - cal.lines.danger, 0.02);
  const toRatio = (y: number) => Math.max(0, (bed - y) / span);
  return { normal: toRatio(cal.lines.normal), warning: toRatio(cal.lines.warning), danger: 0.97 };
}

export function linesAreValid(cal: Calibration): boolean {
  const bed = cal.roi.length ? Math.max(...cal.roi.map((p) => p[1])) : 0;
  return cal.roi.length >= 3 && cal.lines.danger < cal.lines.warning && cal.lines.warning < cal.lines.normal && cal.lines.normal < bed;
}
