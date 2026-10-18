import { Eye, Map as MapIcon, ShieldCheck, ShieldHalf, Waves } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarrierCard } from '../components/control/BarrierCard';
import { BarrierLog, LeadTimeLog, SensorHealth } from '../components/control/ControlLogs';
import { StormLab } from '../components/control/StormLab';
import { BottomNav } from '../components/layout/BottomNav';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { ConnectionChip } from '../components/live/shared/ConnectionStatus';
import { useVisionStore, visionActions } from '../hooks/vision/useVisionStore';
import { sensorHealth } from '../lib/vision/stormLab';
import { listLeadTimes } from '../services/vision/visionApi';
import { btnSecondary, card, pageTitle } from '../styles/tokens';
import type { LeadTimeEntry } from '../types/vision';

const LOOP = [
  { icon: Eye, title: 'Sense', text: 'Cameras and depth nodes read the water every few seconds.' },
  { icon: ShieldCheck, title: 'Check', text: 'Jumps faster than water can rise are held until confirmed.' },
  { icon: Waves, title: 'Decide', text: 'Two confirming readings move the level. Confident DANGER is immediate.' },
  { icon: ShieldHalf, title: 'Act', text: 'DANGER closes the underpass barrier and routing avoids it.' },
];

/** Control room: the act half of the loop. Underpass barriers, their log, the fault filter and warning timing. Route: /control */
export default function ControlRoomPage() {
  const state = useVisionStore();
  const [lead, setLead] = useState<LeadTimeEntry[]>([]);
  const live = state.status === 'ready' && !state.usingMock;

  useEffect(() => {
    if (!live) return;
    let on = true;
    const load = () => listLeadTimes(20).then((l) => on && setLead(l)).catch(() => undefined);
    void load();
    const t = setInterval(load, 10000);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, [live]);

  // The live page loads history only on demand; health needs a few readings per camera.
  const ids = state.cameras.map((c) => c.id).join(',');
  useEffect(() => {
    if (!live) return;
    ids.split(',').filter(Boolean).forEach((id) => void visionActions.loadHistory(id));
  }, [live, ids]);

  const health = useMemo(() => sensorHealth(state.cameras.filter((c) => c.online), state.history), [state.cameras, state.history]);
  const closed = state.barriers.filter((b) => b.state === 'CLOSED').length;
  const onlineCount = state.cameras.filter((c) => c.online).length;
  const loading = state.status === 'idle' || state.status === 'loading';

  return (
    <div className="flex min-h-dvh bg-[#F3F6F5]">
      <DashboardSidebar />
      <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden pb-[var(--nav-h)] md:pb-0">
        <Header />
        <main className="@container/main flex-1 overflow-y-auto overscroll-contain" aria-label="Control room">
          <div className="mx-auto w-full max-w-[1400px] space-y-4 p-4 @min-[640px]/main:space-y-5 @min-[640px]/main:p-6 @min-[1280px]/main:p-8">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <h1 className={`${pageTitle} flex items-center gap-2`}>
                  <ShieldHalf className="h-5 w-5 shrink-0 text-[#0E7C7B] @min-[640px]/main:h-6 @min-[640px]/main:w-6" aria-hidden="true" />
                  Control room
                </h1>
                <p className="mt-0.5 text-sm/5 text-slate-600">Underpass barriers, the sensor fault filter and how fast each warning goes out.</p>
              </div>
              {!loading && <ConnectionChip usingMock={state.usingMock} connected={state.connected} online={onlineCount} total={state.cameras.length} />}
            </div>

            {/* The loop, in four words: what this page adds to Live Vision */}
            <ol className="grid grid-cols-4 gap-2" aria-label="How the loop works">
              {LOOP.map((s, i) => (
                <li key={s.title} className={`${card} flex flex-col items-center gap-1.5 p-2 text-center @min-[760px]/main:flex-row @min-[760px]/main:items-start @min-[760px]/main:gap-3 @min-[760px]/main:p-3 @min-[760px]/main:text-left`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#0B5F60]">
                    <s.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm/5 font-bold text-slate-900"><span className="hidden text-slate-500 @min-[760px]/main:inline">{i + 1}. </span>{s.title}</p>
                    <p className="hidden text-xs/4 text-slate-600 @min-[760px]/main:block">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 @min-[1100px]/main:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] @min-[1100px]/main:gap-5">
              {/* LEFT: the barriers and what they did */}
              <div className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-heading text-lg/7 font-bold text-slate-900">
                    Underpass barriers{' '}
                    <span className={`ml-1 rounded-full px-2 py-0.5 align-middle text-xs font-bold ${closed ? 'bg-red-700 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                      {closed ? `${closed} closed` : 'all open'}
                    </span>
                  </h2>
                  <Link to="/map" className={`${btnSecondary} min-h-10 text-xs`}>
                    <MapIcon className="h-4 w-4" aria-hidden="true" /> See routing on the map
                  </Link>
                </div>
                {state.barriers.length === 0 ? (
                  <p className={`${card} p-4 text-sm/5 text-slate-600`}>{loading ? 'Loading barriers…' : 'This server has no barriers configured.'}</p>
                ) : (
                  state.barriers.map((b) => <BarrierCard key={b.id} barrier={b} onCommand={(a) => visionActions.commandBarrier(b.id, a)} />)
                )}
                <p className="text-xs/4 text-slate-600">
                  Barriers are simulated. No real road barrier is connected. A bench ESP32 with a servo can follow a barrier by polling
                  the server (firmware/floodway_barrier.ino). Precedents: Kuala Lumpur&apos;s SMART Tunnel closes to traffic from
                  station data, and Japan advises remote-controlled barriers at flood-prone underpasses.
                </p>
                <BarrierLog events={state.barrierEvents} />
              </div>

              {/* RIGHT: timing and sensor trust */}
              <div className="min-w-0 space-y-4">
                <StormLab serverAvailable={live} />
                <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 @min-[1400px]/main:grid-cols-2">
                  <LeadTimeLog entries={lead} available={live} />
                  <SensorHealth rows={health} />
                </div>
              </div>
            </div>

          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
