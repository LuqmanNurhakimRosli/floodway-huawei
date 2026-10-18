import { ChevronRight, Siren } from 'lucide-react';
import { Link } from 'react-router-dom';
import { circleMembers, useFamily, useFloodZones } from '../../hooks/useFamily';
import { riskAt, summarise, whereText } from '../../lib/family';
import { card } from '../../styles/tokens';
import { Avatar } from '../family/Avatar';

const BADGE = {
  sos: 'bg-red-600 text-white',
  flooded: 'bg-red-100 text-red-800',
  near: 'bg-amber-100 text-amber-900',
  clear: 'bg-emerald-100 text-emerald-800',
} as const;
const LABEL = { sos: 'SOS', flooded: 'Flood area', near: 'Near flood', clear: 'Clear' } as const;

/** Home summary of the family circle: who is fine and who needs attention, one tap to the family map. */
export function FamilyCard() {
  const family = useFamily();
  const zones = useFloodZones();
  const members = circleMembers(family);
  const s = summarise(members, zones);
  const attention = s.total - s.safe;
  const circle = family.circles.find((c) => c.id === family.circleId) ?? family.circles[0];

  return (
    <section aria-labelledby="family-title" className={`${card} p-4 @min-[760px]/main:p-5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="family-title" className="font-heading text-lg/7 font-bold text-slate-900">Your {circle.name.toLowerCase()}</h2>
          <p className={`text-sm font-semibold ${s.sos ? 'text-red-700' : attention ? 'text-amber-800' : 'text-emerald-700'}`}>
            {s.sos ? `${s.sos} SOS. ` : ''}
            {attention ? `${attention} of ${s.total} need attention` : `All ${s.total} away from flooding`}
          </p>
        </div>
        <Link to="/map" className="flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-[#0958D9] px-4 text-sm font-bold text-white shadow-md shadow-blue-900/20 hover:bg-[#003EB3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2">
          Family map <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <ul className="-mx-1 mt-3 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {members.map((m) => {
          const k = m.status === 'sos' ? 'sos' : riskAt([m.lat, m.lon], zones).risk;
          return (
            <li key={m.id} className="relative flex w-[84px] shrink-0 flex-col items-center gap-1.5 text-center">
              <Avatar member={m} size="lg" ring={k === 'clear' ? undefined : k} />
              <span className="w-full truncate text-sm font-bold text-slate-900">{m.isYou ? 'You' : m.name.split(' ')[0]}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${BADGE[k]}`}>
                {k === 'sos' && <Siren className="-mt-0.5 mr-0.5 inline h-3 w-3" aria-hidden="true" />}
                {LABEL[k]}
              </span>
              <span className="sr-only">{whereText(m, family.places)}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-slate-600">Demo circle: everyone except you is simulated.</p>
    </section>
  );
}
