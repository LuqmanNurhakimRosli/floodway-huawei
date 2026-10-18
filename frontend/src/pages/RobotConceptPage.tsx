import { Battery, Boxes, Cpu, Layers, Leaf, Recycle, RotateCcw, Sun, Wrench } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BottomNav } from '../components/layout/BottomNav';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Header } from '../components/layout/Header';
import { Segmented } from '../components/live/shared/Segmented';
import { PenyuScene } from '../components/robot/PenyuScene';
import { MODES, PARTS, TARGETS, type PartId, type RobotMode } from '../components/robot/robotSpec';
import { btnSecondary, card, cardPad, cardTitle, pageTitle } from '../styles/tokens';

const GREEN = [
  { icon: Sun, title: 'Runs on sunlight', text: 'A solar skin on the shell and a panel on the dock charge it between storms. Daily patrols need no grid power.' },
  { icon: Recycle, title: 'Made from what blocks drains', text: 'The hull is moulded from plastic recovered by river trash booms, and the plastic its rake collects goes back to that recycler.' },
  { icon: Wrench, title: 'Built to be repaired', text: 'Swappable LiFePO4 battery, bolt-on wheel-legs and a sealed sensor head that unplugs. A council workshop can service it.' },
  { icon: Boxes, title: 'Uses what the city has', text: 'Docks on existing street lamp posts above flood height, and talks over low-power LoRa instead of needing a new tower.' },
];

const BUILD = [
  { stage: 'v0 · Bench', status: 'Built', tone: 'bg-emerald-100 text-emerald-800', text: 'ESP32 ultrasonic depth node and ESP32 servo barrier, both in firmware/, driving the real FloodWay barrier loop.' },
  { stage: 'v1 · Road rover', status: 'Next', tone: 'bg-amber-100 text-amber-900', text: 'A wheeled rover with the depth probe and camera head, posting as a depth node. Dry-road patrols and grate photos.' },
  { stage: 'v2 · Amphibious hull', status: 'Planned', tone: 'bg-slate-200 text-slate-800', text: 'Recycled-HDPE hull with the foam ring and wheel-legs, then a supervised wading trial at one underpass.' },
];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** PENYU: a concept field robot for flooded underpasses. CONCEPT DESIGN, NOT BUILT. Route: /robot */
export default function RobotConceptPage() {
  const [mode, setMode] = useState<RobotMode>('patrol');
  const [exploded, setExploded] = useState(false);
  const [selected, setSelected] = useState<PartId | null>('shell');
  const reduced = usePrefersReducedMotion();
  const part = PARTS.find((p) => p.id === selected) ?? null;
  const modeInfo = MODES.find((m) => m.id === mode)!;

  const choosePart = (id: PartId) => {
    setSelected(id);
    if (id === 'dock') setMode('dock');
  };

  return (
    <div className="flex min-h-dvh bg-[#F8FAFC]">
      <DashboardSidebar />
      <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden pb-[var(--nav-h)] md:pb-0">
        <Header />
        <main className="@container/main flex-1 overflow-y-auto overscroll-contain" aria-label="Robot concept">
          <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 @min-[640px]/main:p-6 @min-[1280px]/main:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs/4 font-bold uppercase tracking-wider text-[#0958D9]">Field robot concept</p>
                <h1 className={pageTitle}>PENYU, the underpass sentinel</h1>
                <p className="mt-1 max-w-2xl text-sm/5 text-slate-600">
                  An amphibious robot that keeps watch where flash floods trap cars: it clears the drain grates before a storm,
                  measures the water at the underpass while it rises, and checks the road is safe before the barrier opens again.
                  <span className="font-semibold text-slate-800"> Penyu</span> is Malay for turtle: it works on land and in water, and carries its shelter on its back.
                </p>
              </div>
              <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-extrabold tracking-wide text-amber-900">CONCEPT · NOT BUILT</span>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 @min-[1100px]/main:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)] @min-[1100px]/main:gap-5">
              {/* The model */}
              <section className={`${card} overflow-hidden`} aria-label="3D model of the PENYU concept robot">
                <div className="relative h-[360px] @min-[640px]/main:h-[460px] @min-[1100px]/main:h-[520px]">
                  <PenyuScene mode={mode} exploded={exploded} selected={selected} onSelect={choosePart} reducedMotion={reduced} />
                  <p className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-white/85 px-2 py-1 text-xs/4 font-semibold text-slate-700 shadow-sm backdrop-blur">
                    Drag to turn · pinch or scroll to zoom · tap a number
                  </p>
                </div>
                <div className="space-y-3 border-t border-slate-200 p-3 @min-[640px]/main:p-4">
                  <Segmented label="What the robot is doing" options={MODES.map((m) => ({ id: m.id, label: m.label }))} value={mode} onChange={(id) => setMode(id as RobotMode)} />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="min-w-0 text-sm/5 text-slate-700" aria-live="polite">
                      <span className="font-bold text-slate-900">{modeInfo.when}.</span> {modeInfo.does}
                    </p>
                    <div className="flex gap-2">
                      <button type="button" className={`${btnSecondary} min-h-10 text-xs`} aria-pressed={exploded} onClick={() => setExploded(!exploded)}>
                        <Layers className="h-4 w-4" aria-hidden="true" /> {exploded ? 'Assemble' : 'Explode parts'}
                      </button>
                      <button type="button" className={`${btnSecondary} min-h-10 text-xs`} onClick={() => { setMode('patrol'); setExploded(false); setSelected('shell'); }}>
                        <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* The selected part, and the list of all of them */}
              <aside className="min-w-0 space-y-4" aria-label="Parts">
                <div className={`${card} ${cardPad}`} aria-live="polite">
                  {part ? (
                    <>
                      <p className="text-xs/4 font-bold uppercase tracking-wide text-slate-600">Part {PARTS.findIndex((p) => p.id === part.id) + 1}</p>
                      <h2 className={`${cardTitle} text-lg/7`}>{part.name}</h2>
                      <p className="mt-1 text-sm/6 text-slate-700">{part.detail}</p>
                      {part.green && (
                        <p className="mt-2 flex items-start gap-2 rounded-xl bg-emerald-50 p-2.5 text-sm/5 font-medium text-emerald-900">
                          <Leaf className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {part.green}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm/5 text-slate-600">Tap a numbered part on the model or in the list.</p>
                  )}
                </div>
                <ol className={`${card} divide-y divide-slate-100 p-1`}>
                  {PARTS.map((p, i) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        aria-pressed={selected === p.id}
                        onClick={() => choosePart(p.id)}
                        className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] ${
                          selected === p.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${selected === p.id ? 'bg-[#0958D9] text-white' : 'bg-slate-100 text-slate-800'}`}>{i + 1}</span>
                        <span className="min-w-0">
                          <span className="block text-sm/5 font-semibold text-slate-900">{p.name}</span>
                          <span className="block text-xs/4 text-slate-600">{p.short}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>

            {/* Where it fits */}
            <section className={`${card} ${cardPad}`} aria-labelledby="fit-title">
              <h2 id="fit-title" className={cardTitle}>Where it fits the FloodWay loop</h2>
              <p className="mt-1 max-w-3xl text-sm/5 text-slate-600">
                The control room already closes an underpass barrier when a camera or depth node reaches DANGER. PENYU adds the two
                things a fixed sensor cannot do: it moves to where the water is, and it can check the road with its own eyes before
                anyone drives back in.
              </p>
              <ol className="mt-4 grid gap-3 @min-[760px]/main:grid-cols-4">
                {MODES.map((m, i) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setMode(m.id)}
                      aria-pressed={mode === m.id}
                      className={`h-full w-full rounded-2xl border p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] ${mode === m.id ? 'border-[#1677FF] bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <span className="text-xs/4 font-bold uppercase tracking-wide text-slate-600">{i + 1}. {m.when}</span>
                      <span className="mt-0.5 block text-sm/5 font-bold text-slate-900">{m.label}</span>
                      <span className="mt-1 block text-xs/5 text-slate-700">{m.does}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm/5 text-slate-700">
                <span className="font-bold text-slate-900">Two-key reopen (proposed).</span> Today a barrier reopens when its sensor falls back
                to Advisory. With PENYU, it would reopen only when the sensor <em>and</em> the robot&apos;s own check both read clear, so one
                fooled sensor cannot send cars back into water. <Link to="/control" className="font-semibold text-[#0958D9] underline underline-offset-2">See the barriers</Link>
              </p>
            </section>

            {/* Sustainability */}
            <section aria-labelledby="green-title">
              <h2 id="green-title" className="font-heading text-lg/7 font-bold text-slate-900">Sustainable by design</h2>
              <div className="mt-3 grid gap-3 @min-[640px]/main:grid-cols-2 @min-[1100px]/main:grid-cols-4">
                {GREEN.map((g) => (
                  <div key={g.title} className={`${card} p-4`}>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <g.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-2 text-sm/5 font-bold text-slate-900">{g.title}</h3>
                    <p className="mt-1 text-sm/5 text-slate-600">{g.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-4 @min-[1000px]/main:grid-cols-2">
              <section className={`${card} ${cardPad}`} aria-labelledby="spec-title">
                <h2 id="spec-title" className={`${cardTitle} flex items-center gap-2`}>
                  <Cpu className="h-5 w-5 text-slate-600" aria-hidden="true" /> Design targets
                </h2>
                <p className="mt-0.5 text-xs/4 font-semibold text-amber-900">Targets for a first build, not measurements. Nothing here has been tested.</p>
                <dl className="mt-3 divide-y divide-slate-100">
                  {TARGETS.map((t) => (
                    <div key={t.label} className="flex justify-between gap-4 py-2 text-sm/5">
                      <dt className="text-slate-600">{t.label}</dt>
                      <dd className="text-right font-semibold text-slate-900">{t.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className={`${card} ${cardPad}`} aria-labelledby="build-title">
                <h2 id="build-title" className={`${cardTitle} flex items-center gap-2`}>
                  <Battery className="h-5 w-5 text-slate-600" aria-hidden="true" /> Build path
                </h2>
                <ol className="mt-3 space-y-3">
                  {BUILD.map((b) => (
                    <li key={b.stage} className="rounded-xl border border-slate-200 p-3">
                      <p className="flex items-center justify-between gap-2">
                        <span className="text-sm/5 font-bold text-slate-900">{b.stage}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${b.tone}`}>{b.status}</span>
                      </p>
                      <p className="mt-1 text-sm/5 text-slate-600">{b.text}</p>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-xs/4 text-slate-600">
                  Why a sensor and not a rescuer: quadruped and amphibious rescue robots are reaching drills in China and Japan, but our
                  research found no independent report of one rescuing people in a real flood. PENYU stays with what is buildable:
                  measuring, clearing grates and confirming the road.
                </p>
              </section>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
