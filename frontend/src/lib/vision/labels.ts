/**
 * Spread label anchors (0..1, top to bottom, already sorted) so neighbours are at least `minGap` apart while staying
 * inside [lo, hi]. Used to keep the Danger / Warning / Normal tags readable when two lines sit close together.
 */
export function spreadLabels(positions: number[], minGap: number, lo = 0, hi = 1): number[] {
  const out = [...positions];
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + minGap);
  if (out.length) out[out.length - 1] = Math.min(out[out.length - 1], hi);
  for (let i = out.length - 2; i >= 0; i--) out[i] = Math.min(out[i], out[i + 1] - minGap);
  return out.map((p) => Math.max(lo, p));
}
