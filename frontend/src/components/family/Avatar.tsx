import { Zap } from 'lucide-react';
import { initials, type FamilyMember } from '../../lib/family';

const SIZE = { sm: 'h-8 w-8 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-16 w-16 text-lg' } as const;

/** Initials on the member's colour. No photos: the demo family is made up, so a face would imply a real person. */
export function Avatar({ member, size = 'md', ring }: { member: Pick<FamilyMember, 'name' | 'colors' | 'isYou'>; size?: keyof typeof SIZE; ring?: 'sos' | 'flooded' | 'near' }) {
  const ringCls = ring === 'sos' || ring === 'flooded' ? 'ring-[3px] ring-red-500' : ring === 'near' ? 'ring-[3px] ring-amber-400' : 'ring-2 ring-white';
  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-heading font-bold text-white shadow-md ${SIZE[size]} ${ringCls}`}
      style={{ background: `linear-gradient(135deg, ${member.colors[0]}, ${member.colors[1]})` }}
    >
      {member.isYou ? 'You' : initials(member.name)}
    </span>
  );
}

/** Battery chip, red under 20% because a dead phone is a safety problem in a flood. */
export function Battery({ pct, charging }: { pct: number; charging?: boolean }) {
  const v = Math.round(pct);
  const low = v < 20;
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums ${low ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>
      <span className="relative inline-block h-2.5 w-4 rounded-[3px] border border-current" aria-hidden="true">
        <span className="absolute inset-y-[1px] left-[1px] rounded-[1px] bg-current" style={{ width: `${Math.max(8, Math.min(100, v)) * 0.11}px` }} />
      </span>
      {charging ? <Zap className="-mx-0.5 h-3 w-3 fill-current" aria-hidden="true" /> : null}
      {v}%
      <span className="sr-only">battery{charging ? ', charging' : ''}{low ? ', low' : ''}</span>
    </span>
  );
}
