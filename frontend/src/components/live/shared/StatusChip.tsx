import { LEVEL_META } from '../../../lib/vision/levels';
import type { Level } from '../../../types/vision';

interface Props {
  level: Level;
  className?: string;
}

/** Status is never colour alone: colour + icon + word. */
export function StatusChip({ level, className = '' }: Props) {
  const meta = LEVEL_META[level];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold tracking-wide ${meta.chip} ${className}`}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {meta.label.toUpperCase()}
    </span>
  );
}

export function OfflineChip({ className = '' }: { className?: string }) {
  return <span className={`inline-flex items-center rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-bold tracking-wide text-slate-600 ${className}`}>OFFLINE</span>;
}
