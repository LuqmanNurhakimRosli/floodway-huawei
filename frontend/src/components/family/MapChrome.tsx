import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { Bell, Check, ChevronDown, Crosshair, Layers, LocateFixed, Settings, Siren, Users } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { ORIGINS } from '../../data/klDemo';
import { familyActions } from '../../hooks/useFamily';
import type { Circle } from '../../lib/family';
import type { FamilyState } from '../../services/family/familyStore';
import { SCENARIO_COLOR, type Scenario } from '../map/FloodProneLayer';
import { LegendList } from '../map/MapLegend';
import { Modal } from './FamilyDialogs';

export const roundBtn =
  'flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0958D9] shadow-[0_8px_24px_-10px_rgba(7,20,38,0.45)] ring-1 ring-slate-200/70 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]';

const SCENARIOS: { id: Scenario; label: string; sub: string }[] = [
  { id: 'normal', label: 'Normal', sub: 'Dry' },
  { id: 'warning', label: 'Warning', sub: 'Rising' },
  { id: 'danger', label: 'Danger', sub: 'Peak' },
];

interface TopProps {
  circles: Circle[];
  circleId: string;
  unread: number;
  onSettings: () => void;
  onActivity: () => void;
  onLayers: () => void;
}

/** The floating top row over the map: settings, the circle switcher and activity, like a family-locator app. */
export function MapTopBar({ circles, circleId, unread, onSettings, onActivity, onLayers }: TopProps) {
  const { floodScenario } = useApp();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const current = circles.find((c) => c.id === circleId) ?? circles[0];

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !menu.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[700] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-4 md:pt-4">
      <div className="flex items-start gap-2.5">
        <button type="button" onClick={onSettings} aria-label="Location sharing settings" className={`${roundBtn} pointer-events-auto shrink-0`}>
          <Settings className="h-6 w-6" aria-hidden="true" />
        </button>

        <div ref={menu} className="pointer-events-auto relative mx-auto w-full max-w-[300px] min-w-0">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="flex h-12 w-full items-center justify-between gap-2 rounded-full bg-white px-5 shadow-[0_8px_24px_-10px_rgba(7,20,38,0.45)] ring-1 ring-slate-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]"
          >
            <span className="truncate font-heading text-lg font-bold text-slate-900">{current.name}</span>
            <ChevronDown className={`h-5 w-5 shrink-0 text-[#0958D9] transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {open && (
            <ul role="listbox" aria-label="Circles" className="absolute inset-x-0 top-14 overflow-hidden rounded-3xl bg-white py-2 shadow-2xl ring-1 ring-slate-200">
              {circles.map((c) => (
                <li key={c.id} role="option" aria-selected={c.id === circleId}>
                  <button
                    type="button"
                    onClick={() => {
                      familyActions.setCircle(c.id);
                      setOpen(false);
                    }}
                    className="flex min-h-12 w-full items-center gap-3 px-4 text-left hover:bg-slate-50 focus:outline-none focus-visible:bg-blue-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-[#0958D9]">
                      <Users className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-slate-900">{c.name}</span>
                      <span className="block text-xs text-slate-600">{c.memberIds.length} people · demo circle</span>
                    </span>
                    {c.id === circleId && <Check className="h-5 w-5 text-[#0958D9]" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={onLayers}
            className="mx-auto mt-2 flex min-h-11 w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-white/95 px-3 text-xs font-bold text-slate-800 shadow-md ring-1 ring-slate-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SCENARIO_COLOR[floodScenario] }} aria-hidden="true" />
            {SCENARIOS.find((s) => s.id === floodScenario)?.label} · simulated
          </button>
        </div>

        <div className="pointer-events-auto flex shrink-0 flex-col gap-2.5">
          <button type="button" onClick={onActivity} aria-label={unread ? `Activity, ${unread} new` : 'Activity'} className={`${roundBtn} relative`}>
            <Bell className="h-6 w-6" aria-hidden="true" />
            {unread > 0 && <span className="absolute right-2 top-2 h-3 w-3 rounded-full bg-red-600 ring-2 ring-white" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </div>
  );
}

interface SideProps {
  bottom: number;
  onLocate: () => void;
  onLayers: () => void;
}

/** Right-hand column: above the sheet on phones, under the activity button on wider screens (clear of the pills). */
export function MapSideButtons({ bottom, onLocate, onLayers }: SideProps) {
  return (
    <div className="absolute right-3 z-[650] flex flex-col gap-2.5 max-md:bottom-[var(--side-bottom)] md:right-4 md:top-[5.5rem]" style={{ '--side-bottom': `${bottom + 12}px` } as React.CSSProperties}>
      <button type="button" onClick={onLocate} aria-label="Centre on me" className={roundBtn}>
        <Crosshair className="h-6 w-6" aria-hidden="true" />
      </button>
      <button type="button" onClick={onLayers} aria-label="Map layers and flood scenario" className={roundBtn}>
        <Layers className="h-6 w-6" aria-hidden="true" />
      </button>
    </div>
  );
}

const pillBtn =
  'flex h-12 items-center gap-2 rounded-full px-5 font-heading text-base font-bold shadow-[0_8px_24px_-10px_rgba(7,20,38,0.45)] ring-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]';

/** "Check in" and "SOS", floating above the sheet. */
export function MapActionPills({ bottom, sosOn, onCheckIn, onSos }: { bottom: number; sosOn: boolean; onCheckIn: () => void; onSos: () => void }) {
  return (
    <div className="absolute left-3 z-[650] flex gap-2.5 max-md:bottom-[var(--pill-bottom)] md:bottom-8 md:left-4" style={{ '--pill-bottom': `${bottom + 12}px` } as React.CSSProperties}>
      <button type="button" onClick={onCheckIn} className={`${pillBtn} bg-white text-[#0958D9] ring-slate-200/70`}>
        <LocateFixed className="h-5 w-5" aria-hidden="true" /> Check in
      </button>
      <button type="button" onClick={onSos} className={`${pillBtn} ${sosOn ? 'bg-red-600 text-white ring-red-600' : 'bg-white text-red-700 ring-slate-200/70'}`}>
        <Siren className={`h-5 w-5 ${sosOn ? 'animate-pulse motion-reduce:animate-none' : ''}`} aria-hidden="true" /> {sosOn ? 'SOS on' : 'SOS'}
      </button>
    </div>
  );
}

/** Your location sharing: share with the circle, use the phone's location, or a demo position. */
export function SharingDialog({ state, onClose }: { state: FamilyState; onClose: () => void }) {
  const { selectedLocation, setSelectedLocation } = useApp();
  const gpsOn = state.gps === 'on' || state.gps === 'asking';
  const gpsNote: Record<FamilyState['gps'], string> = {
    off: 'Off. The map uses the demo position below.',
    asking: 'Waiting for your phone…',
    on: `On${state.gpsAccuracyM ? `, accurate to about ${state.gpsAccuracyM} m` : ''}. Your position stays in this browser.`,
    denied: 'Location permission was refused. Allow it in your browser settings to use it.',
    unavailable: 'This browser could not get a location.',
  };
  const toggle = 'relative h-7 w-12 shrink-0 rounded-full bg-slate-300 transition-colors peer-checked:bg-[#0958D9] peer-focus-visible:ring-2 peer-focus-visible:ring-[#1677FF] peer-focus-visible:ring-offset-2 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5 motion-reduce:transition-none motion-reduce:after:transition-none';
  return (
    <Modal title="Location sharing" onClose={onClose}>
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-3.5">
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-slate-900">Share my location with my circles</span>
            <span className="block text-xs/5 text-slate-600">{state.sharing ? 'Your circles see where you are.' : 'Paused. Your circles see your last check-in only.'}</span>
          </span>
          <input type="checkbox" className="peer sr-only" checked={state.sharing} onChange={(e) => familyActions.setSharing(e.target.checked)} />
          <span className={toggle} aria-hidden="true" />
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-3.5">
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-slate-900">Use my phone's location</span>
            <span role="status" className="block text-xs/5 text-slate-600">{gpsNote[state.gps]}</span>
          </span>
          <input type="checkbox" className="peer sr-only" checked={gpsOn} onChange={(e) => (e.target.checked ? familyActions.startGps() : familyActions.stopGps())} />
          <span className={toggle} aria-hidden="true" />
        </label>
        <div className={`rounded-2xl border border-slate-200 p-3.5 ${state.gps === 'on' ? 'opacity-50' : ''}`}>
          <label htmlFor="demo-position" className="block font-bold text-slate-900">Demo position</label>
          <span className="block text-xs/5 text-slate-600">Used while phone location is off. Flood data covers Kuala Lumpur only.</span>
          <select
            id="demo-position"
            disabled={state.gps === 'on'}
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]"
          >
            {ORIGINS.map((o) => (
              <option key={o.id} value={o.location}>{o.label}</option>
            ))}
          </select>
        </div>
        <p className="text-xs/5 text-slate-600">
          In this demo only you are a real person. The other members, their positions and their replies are simulated, and nothing about your position is uploaded.
        </p>
      </div>
    </Modal>
  );
}

/** Flood scenario and the legend. */
export function LayersDialog({ onClose }: { onClose: () => void }) {
  const { floodScenario, setFloodScenario } = useApp();
  return (
    <Modal title="Map layers" onClose={onClose}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Flood scenario (simulated)</p>
      <div role="group" aria-label="Flood scenario" className="mt-2 grid grid-cols-3 gap-2">
        {SCENARIOS.map((s) => {
          const on = floodScenario === s.id;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              onClick={() => setFloodScenario(s.id)}
              className={`flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] ${on ? 'text-white' : 'border-slate-200 bg-white text-slate-800'}`}
              style={on ? { background: SCENARIO_COLOR[s.id], borderColor: SCENARIO_COLOR[s.id] } : undefined}
            >
              {s.label}
              <span className="text-xs font-medium opacity-90">{s.sub}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs/5 text-slate-600">Changes which demo areas are flooded, for the routes and for everyone's safety status. Not an official flood map.</p>
      <p className="mt-5 text-xs font-bold uppercase tracking-wide text-slate-600">Legend</p>
      <div className="mt-2">
        <LegendList floodColor={SCENARIO_COLOR[floodScenario]} />
      </div>
      <p className="mt-3 text-xs/5 text-slate-500">Roads &copy; OpenStreetMap contributors.</p>
    </Modal>
  );
}
