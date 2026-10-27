import { DANGER_WATER_CM, FULL_DISTANCE_CM, MOUNT_HEIGHT_CM, WARNING_WATER_CM } from '../../lib/benchSensor';
import { LEVEL_META } from '../../lib/vision/levels';
import type { Level } from '../../types/vision';

const DEPTH = MOUNT_HEIGHT_CM - FULL_DISTANCE_CM;
const mark = (waterCm: number) => `${(waterCm / DEPTH) * 100}%`;

/** The demo cup, filled to the live reading. Dashed lines mark the warning and danger heights. */
export function BenchCup({ pct, level }: { pct: number | null; level: Level | null }) {
  const color = level ? LEVEL_META[level].hex : '#CBD5E1';
  return (
    <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-b-2xl rounded-t-md border-2 border-t-0 border-slate-300 bg-slate-50" role="img" aria-label={pct == null ? 'No reading yet' : `Cup ${pct}% full`}>
      <div
        className="absolute inset-x-0 bottom-0 transition-[height,background-color] duration-500 ease-out motion-reduce:transition-none"
        style={{ height: `${pct ?? 0}%`, backgroundColor: color, opacity: 0.85 }}
      >
        {pct != null && pct > 0 && <div className="absolute inset-x-0 -top-1 h-2 rounded-[50%] bg-white/40 motion-safe:animate-pulse" />}
      </div>
      <div className="absolute inset-x-0 border-t border-dashed border-amber-600/70" style={{ bottom: mark(WARNING_WATER_CM) }} />
      <div className="absolute inset-x-0 border-t border-dashed border-red-600/70" style={{ bottom: mark(DANGER_WATER_CM) }} />
    </div>
  );
}
