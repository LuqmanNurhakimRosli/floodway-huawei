import type { ReactNode } from 'react';
import { Bell, Building2, Briefcase, CheckCircle2, GraduationCap, History, Home, HousePlus, MapPin, MessageCircleQuestion, Navigation, Route, Send, ShieldAlert, Siren, Trash2, Users } from 'lucide-react';
import { agoText, fmtDistance, nearestOpenCentre, placeAt, riskAt, sinceText, sortMembers, summarise, whereText, type CircleEvent, type FamilyMember, type Place, type PlaceKind, type Risk } from '../../lib/family';
import type { Zone } from '../../lib/routing';
import type { Shelter } from '../../types';
import { familyActions } from '../../hooks/useFamily';
import { Avatar, Battery } from './Avatar';

export type FamilyTab = 'people' | 'safety' | 'places' | 'route' | 'activity';

const TABS: { id: Exclude<FamilyTab, 'activity'>; label: string; Icon: typeof Users }[] = [
  { id: 'people', label: 'People', Icon: Users },
  { id: 'safety', label: 'Safety', Icon: ShieldAlert },
  { id: 'places', label: 'Places', Icon: MapPin },
  { id: 'route', label: 'Route', Icon: Route },
];

const RISK_BADGE: Record<Risk | 'sos', { text: string; cls: string }> = {
  sos: { text: 'SOS', cls: 'bg-red-600 text-white' },
  flooded: { text: 'In flood area', cls: 'bg-red-100 text-red-800' },
  near: { text: 'Near flooding', cls: 'bg-amber-100 text-amber-900' },
  clear: { text: 'Clear', cls: 'bg-emerald-100 text-emerald-800' },
};

const PLACE_ICON: Record<PlaceKind, typeof Home> = { home: Home, school: GraduationCap, work: Briefcase, family: HousePlus };

const EVENT_ICON: Record<CircleEvent['kind'], { Icon: typeof Bell; cls: string }> = {
  arrived: { Icon: MapPin, cls: 'bg-blue-100 text-[#0958D9]' },
  left: { Icon: MapPin, cls: 'bg-slate-100 text-slate-600' },
  'check-in': { Icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  sos: { Icon: Siren, cls: 'bg-red-100 text-red-700' },
  safe: { Icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  flood: { Icon: ShieldAlert, cls: 'bg-amber-100 text-amber-800' },
  route: { Icon: Send, cls: 'bg-blue-100 text-[#0958D9]' },
  ask: { Icon: MessageCircleQuestion, cls: 'bg-slate-100 text-slate-700' },
};

const tabBtn = 'flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2 transition-colors motion-reduce:transition-none';
const action = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-1';

interface HeaderProps {
  circleName: string;
  members: FamilyMember[];
  zones: Zone[];
  tab: FamilyTab;
  onTab: (t: FamilyTab) => void;
}

/** Title, one-line circle summary and the tab row. Always visible, also when the phone sheet is collapsed. */
export function FamilyHeader({ circleName, members, zones, tab, onTab }: HeaderProps) {
  const s = summarise(members, zones);
  const attention = s.total - s.safe;
  return (
    <div>
      <div className="flex items-end justify-between gap-3 px-1">
        <h2 className="font-heading text-2xl/8 font-extrabold text-slate-900">{circleName}</h2>
        <p className={`pb-1 text-xs font-bold ${s.sos ? 'text-red-700' : attention ? 'text-amber-800' : 'text-emerald-700'}`}>
          {s.sos ? `${s.sos} SOS · ` : ''}
          {attention ? `${attention} of ${s.total} need attention` : `All ${s.total} clear`}
        </p>
      </div>
      <div role="tablist" aria-label="Family map views" className="mt-2.5 flex gap-2">
        {TABS.map(({ id, label, Icon }) => {
          const on = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onTab(id)}
              className={`${tabBtn} ${on ? 'bg-[#0958D9] text-white shadow-md shadow-blue-900/25' : 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50'}`}
            >
              <Icon className="h-5 w-5" aria-hidden="true" strokeWidth={on ? 2.4 : 2} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface BodyProps {
  tab: FamilyTab;
  members: FamilyMember[];
  places: Place[];
  events: CircleEvent[];
  zones: Zone[];
  shelters: Shelter[];
  allMembers: Record<string, FamilyMember>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPlanRoute: (memberId: string) => void;
  onFocusPlace: (p: Place) => void;
  now: number;
  route: ReactNode;
}

/** The content under the tabs. */
export function FamilyBody(p: BodyProps) {
  if (p.tab === 'route') return <>{p.route}</>;
  if (p.tab === 'places') return <PlacesList {...p} />;
  if (p.tab === 'activity') return <ActivityList events={p.events} members={p.allMembers} now={p.now} />;
  return <MemberList {...p} safety={p.tab === 'safety'} />;
}

function MemberList({ members, places, zones, shelters, selectedId, onSelect, onPlanRoute, now, safety }: BodyProps & { safety: boolean }) {
  const rows = safety ? sortMembers(members, zones) : members;
  const s = summarise(members, zones);
  return (
    <div className="space-y-3 p-4">
      {safety && (
        <p className={`rounded-2xl border p-3 text-sm/5 ${s.safe === s.total ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>
          {s.safe === s.total
            ? 'Nobody in this circle is in or near a flood area right now.'
            : `${s.total - s.safe} of ${s.total} ${s.total - s.safe === 1 ? 'person is' : 'people are'} in, or within ${300} m of, a flood area or sent an SOS. Send them the safe route or ask them to check in.`}
        </p>
      )}
      <ul className="space-y-2.5">
        {rows.map((m) => {
          const pos: [number, number] = [m.lat, m.lon];
          const r = riskAt(pos, zones);
          const badge = RISK_BADGE[m.status === 'sos' ? 'sos' : r.risk];
          const sel = m.id === selectedId;
          const centre = nearestOpenCentre(pos, shelters);
          const moving = (m.speedKmh ?? 0) > 3;
          return (
            <li key={m.id}>
              <div className={`rounded-[22px] border bg-white shadow-[0_10px_28px_-22px_rgba(7,20,38,0.5)] ${sel ? 'border-[#1677FF] ring-2 ring-[#1677FF]/20' : 'border-slate-200'}`}>
                <button type="button" onClick={() => onSelect(m.id)} aria-pressed={sel} className="flex w-full items-center gap-3.5 rounded-[22px] p-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]">
                  <span className="relative">
                    <Avatar member={m} size="lg" ring={m.status === 'sos' ? 'sos' : r.risk === 'clear' ? undefined : r.risk} />
                    {!m.isYou && (
                      <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 shadow-sm">
                        <Battery pct={m.battery} charging={m.charging} />
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-heading text-lg/6 font-bold text-slate-900">{m.isYou ? 'You' : m.name}</span>
                      {!m.isYou && <span className="shrink-0 text-xs font-semibold text-slate-500">{m.relation}</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-slate-700">{whereText(m, places)}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {moving ? `Updated ${agoText(m.updatedAt, now).toLowerCase()}` : m.since ? sinceText(m.since, now) : agoText(m.updatedAt, now)}
                      {m.source === 'gps' ? ' · phone GPS' : m.isYou ? ' · demo position' : ''}
                    </span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold ${badge.cls}`}>{badge.text}</span>
                </button>

                {sel && (
                  <div className="border-t border-slate-100 px-3.5 pb-3.5 pt-3">
                    <dl className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-xl bg-slate-50 p-2.5">
                        <dt className="font-semibold text-slate-500">Flood risk here</dt>
                        <dd className="mt-0.5 font-bold text-slate-900">
                          {r.risk === 'flooded' ? 'Inside a flood area' : r.risk === 'near' ? `${fmtDistance(r.edgeM ?? 0)} from one` : 'None nearby'}
                        </dd>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-2.5">
                        <dt className="font-semibold text-slate-500">Nearest open centre</dt>
                        <dd className="mt-0.5 truncate font-bold text-slate-900">
                          {centre ? `${fmtDistance(centre.distanceM)} · ${centre.centre.name.replace('Demo relief centre: ', '')}` : 'None open'}
                        </dd>
                      </div>
                    </dl>
                    {m.battery < 20 && !m.isYou && <p className="mt-2 text-xs font-semibold text-red-800">Low battery. Their location may stop updating soon.</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => onPlanRoute(m.id)} className={`${action} flex-1 bg-[#0958D9] text-white hover:bg-[#003EB3]`}>
                        <Navigation className="h-4 w-4" aria-hidden="true" /> {m.isYou ? 'My safe route' : 'Plan their route'}
                      </button>
                      {!m.isYou && centre && (
                        <button type="button" onClick={() => familyActions.sendRoute(m.id, centre.centre.name.replace('Demo relief centre: ', ''))} className={`${action} flex-1 border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`}>
                          <Send className="h-4 w-4" aria-hidden="true" /> Send route
                        </button>
                      )}
                      {!m.isYou && (
                        <button type="button" onClick={() => familyActions.askCheckIn(m.id)} className={`${action} flex-1 border border-slate-300 bg-white text-slate-800 hover:bg-slate-50`}>
                          <MessageCircleQuestion className="h-4 w-4" aria-hidden="true" /> Ask to check in
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs/5 text-slate-600">
        Demo circle: everyone except you is simulated, and so are their replies. Flood areas come from the simulated scenario and the sample cameras, not an official flood map.
      </p>
    </div>
  );
}

function PlacesList({ places, members, zones, onFocusPlace }: BodyProps) {
  return (
    <div className="space-y-3 p-4">
      <ul className="space-y-2.5">
        {places.map((pl) => {
          const Icon = PLACE_ICON[pl.kind];
          const here = members.filter((m) => placeAt([m.lat, m.lon], [pl])?.id === pl.id);
          const r = riskAt([pl.lat, pl.lon], zones);
          return (
            <li key={pl.id} className="flex items-center gap-3 rounded-[22px] border border-slate-200 bg-white p-3.5 shadow-[0_10px_28px_-22px_rgba(7,20,38,0.5)]">
              <button type="button" onClick={() => onFocusPlace(pl)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0958D9]">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-heading text-base/6 font-bold text-slate-900">{pl.name}</span>
                  <span className="block truncate text-xs text-slate-600">
                    {here.length ? `${here.map((m) => (m.isYou ? 'You' : m.name.split(' ')[0])).join(', ')} ${here.length === 1 && !here[0].isYou ? 'is' : 'are'} here` : 'Nobody here now'}
                  </span>
                  <span className={`mt-0.5 inline-block text-xs font-bold ${r.risk === 'flooded' ? 'text-red-700' : r.risk === 'near' ? 'text-amber-800' : 'text-emerald-700'}`}>
                    {r.risk === 'flooded' ? 'Inside a flood area' : r.risk === 'near' ? `Flood area ${fmtDistance(r.edgeM ?? 0)} away` : 'No flooding nearby'}
                  </span>
                </span>
              </button>
              <label className="flex shrink-0 cursor-pointer flex-col items-center gap-1 text-xs font-semibold text-slate-600">
                <input type="checkbox" className="peer sr-only" checked={pl.alerts} onChange={() => familyActions.togglePlaceAlerts(pl.id)} aria-label={`Arrival and leave alerts for ${pl.name}`} />
                <span className="relative h-7 w-12 rounded-full bg-slate-300 transition-colors peer-checked:bg-[#0958D9] peer-focus-visible:ring-2 peer-focus-visible:ring-[#1677FF] peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5 motion-reduce:transition-none motion-reduce:after:transition-none" aria-hidden="true" />
                Alerts
              </label>
            </li>
          );
        })}
      </ul>
      <p className="flex items-start gap-2 text-xs/5 text-slate-600">
        <Building2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> With alerts on, the circle sees when someone arrives at or leaves a place. Relief centres are on the Route tab.
      </p>
    </div>
  );
}

function ActivityList({ events, members, now }: { events: CircleEvent[]; members: Record<string, FamilyMember>; now: number }) {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-slate-900">
          <History className="h-5 w-5 text-[#0958D9]" aria-hidden="true" /> Activity
        </h3>
        {events.length > 0 && (
          <button type="button" onClick={familyActions.clearEvents} className={`${action} text-slate-600 hover:bg-slate-100`}>
            <Trash2 className="h-4 w-4" aria-hidden="true" /> Clear
          </button>
        )}
      </div>
      {events.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-600">No activity yet. Check-ins, SOS, arrivals and sent routes show here.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => {
            const ic = EVENT_ICON[e.kind];
            const m = members[e.memberId];
            return (
              <li key={e.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                {m ? <Avatar member={m} size="sm" /> : null}
                <span className="min-w-0 flex-1 text-sm/5 text-slate-800">{e.text}</span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${ic.cls}`}>
                  <ic.Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="w-16 shrink-0 text-right text-xs text-slate-500">{agoText(e.at, now)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
