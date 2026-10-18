import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, Navigation, ShieldCheck, Waves } from 'lucide-react';
import { AboutDemo } from '../components/common/AboutDemo';
import { FloodWayLogo } from '../components/brand/FloodWayLogo';
import { useAuth } from '../contexts/AuthContext';

// Collage tiles: the sample cameras' AI-generated frames (labelled as sample imagery below), at different water heights.
const TILES = [
  { src: '/media/live/klang-r090.webp', cls: 'col-start-1 row-start-1 rounded-[999px_999px_36px_36px]' },
  { src: '/media/live/gombak-r060.webp', cls: 'col-start-2 row-start-2 rounded-[36px]' },
  { src: '/media/live/drain-r070.webp', cls: 'col-start-1 row-start-3 rounded-[36px_36px_999px_999px]' },
  { src: '/media/live/smart-r040.webp', cls: 'col-start-2 row-start-4 rounded-[999px]' },
];

const POINTS = [
  { icon: Waves, text: 'Cameras read the water level every few seconds' },
  { icon: Bell, text: 'An alert before the road floods, not after' },
  { icon: Navigation, text: 'A route that avoids flooded roads and closed underpasses' },
];

export function WelcomePage() {
  const navigate = useNavigate();
  const { loginDemo, login } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [signIn, setSignIn] = useState(false);

  const handleDemo = () => {
    loginDemo();
    navigate('/home');
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, name);
    navigate('/home');
  };

  const input = 'block min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#0E7C7B] focus:outline-none focus:ring-2 focus:ring-[#0E7C7B]/30';

  return (
    <div className="min-h-dvh bg-[#F3F6F5] md:grid md:grid-cols-2">
      {/* Collage: full-bleed teal panel on desktop, top of the screen on phones */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#E6F2F1] to-[#F3F6F5] px-6 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] md:flex md:flex-col md:justify-between md:bg-gradient-to-br md:from-[#0B5F60] md:to-[#062B2B] md:p-10">
        <div className="flex items-center gap-2.5">
          <FloodWayLogo tile className="h-10 w-10" />
          <span className="font-heading text-xl font-extrabold tracking-tight text-slate-900 md:text-white">FloodWay</span>
        </div>

        <div className="relative mx-auto mt-6 grid w-full max-w-[340px] grid-cols-2 grid-rows-[repeat(5,52px)] gap-3 md:mt-10 md:max-w-[400px] md:grid-rows-[repeat(5,104px)]" aria-hidden="true">
          {TILES.map((t) => (
            <div key={t.src} className={`row-span-2 overflow-hidden bg-teal-900/20 shadow-[0_16px_40px_-20px_rgba(6,43,43,0.6)] md:h-[100px] ${t.cls}`}>
              <img src={t.src} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
          <span className="absolute -left-1 top-2 h-3 w-3 rotate-45 rounded-sm bg-[#0E7C7B]" />
          <span className="absolute -right-2 bottom-10 h-4 w-4 rotate-45 rounded-sm bg-[#0E7C7B]" />
        </div>
        <p className="mt-3 text-center text-xs font-medium text-slate-600 md:text-teal-100/80">Sample imagery from the demo cameras (AI-generated, not real footage)</p>

        <ul className="mt-8 hidden space-y-3 md:block">
          {POINTS.map((p) => (
            <li key={p.text} className="flex items-center gap-3 text-sm font-medium text-teal-50">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10"><p.icon className="h-5 w-5" aria-hidden="true" /></span>
              {p.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Copy and actions */}
      <main className="mx-auto flex w-full max-w-md flex-col justify-center px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 md:py-12">
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-teal-100/70 px-3 py-1 text-xs font-semibold text-[#0B5F60]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Prototype for the Huawei ICT Competition 2026
        </p>
        <h1 className="mt-3 font-heading text-[32px]/10 font-bold text-slate-900 md:text-4xl/[44px]">
          Know before the <span className="text-[#0E7C7B]">water</span> rises
        </h1>
        <p className="mt-2 text-base/6 text-slate-600">One glance to know if your street is safe. One tap to reach a relief centre.</p>

        <div className="mt-7 space-y-3">
          <button
            type="button"
            onClick={handleDemo}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#0B5F60] px-6 font-heading text-base font-bold text-white shadow-lg shadow-teal-900/25 hover:bg-[#084647] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C7B] focus-visible:ring-offset-2"
          >
            Continue as demo user <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-3 py-1 text-xs font-medium text-slate-500" aria-hidden="true">
            <span className="h-px flex-1 bg-slate-200" /> or use your name <span className="h-px flex-1 bg-slate-200" />
          </div>

          {signIn ? (
            <form onSubmit={handleCustomLogin} className="space-y-2.5">
              <label className="sr-only" htmlFor="welcome-name">Your name</label>
              <input id="welcome-name" type="text" required autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
              <label className="sr-only" htmlFor="welcome-email">Email</label>
              <input id="welcome-email" type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
              <button type="submit" className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white text-sm font-bold text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C7B]">
                Sign in
              </button>
            </form>
          ) : (
            <button type="button" onClick={() => setSignIn(true)} className="flex min-h-12 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white text-sm font-bold text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0E7C7B]">
              Sign in with name and email
            </button>
          )}
        </div>

        <div className="mt-8 space-y-3">
          <AboutDemo />
          <p className="text-center text-xs text-slate-500">© 2026 FloodWay team · Designed for Huawei Cloud; this demo runs on simulated data and calls no Huawei service.</p>
        </div>
      </main>
    </div>
  );
}
