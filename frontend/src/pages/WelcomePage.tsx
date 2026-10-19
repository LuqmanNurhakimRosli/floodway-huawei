import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, Navigation, ShieldCheck, Users } from 'lucide-react';
import { AboutDemo } from '../components/common/AboutDemo';
import { EvacuationLoop } from '../components/brand/EvacuationLoop';
import { FloodWayLogo } from '../components/brand/FloodWayLogo';
import { useAuth } from '../contexts/AuthContext';

const POINTS = [
  { icon: Bell, title: 'Flood alerts', text: 'Before the road floods, not after' },
  { icon: Navigation, title: 'Safe routes', text: 'Around flooded roads and closed underpasses' },
  { icon: Users, title: 'Family circle', text: 'See where your family is and who needs help' },
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

  const input = 'block min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#1677FF] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/30';

  return (
    <div className="min-h-dvh bg-[#F4F7FB] md:grid md:grid-cols-[1.1fr_1fr]">
      {/* Animation: top of the screen on phones, a full-height blue panel on wider screens */}
      <div className="relative overflow-hidden px-5 pt-[max(1.25rem,env(safe-area-inset-top))] md:flex md:flex-col md:justify-between md:bg-gradient-to-br md:from-[#1677FF] md:via-[#0958D9] md:to-[#071426] md:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 hidden h-80 w-80 rounded-full bg-white/10 md:block" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 hidden h-96 w-96 rounded-full bg-white/5 md:block" aria-hidden="true" />

        <div className="relative flex items-center gap-2.5">
          <FloodWayLogo tile className="h-11 w-11" />
          <div>
            <span className="block font-heading text-2xl/7 font-extrabold tracking-tight text-[#0958D9] md:text-white">FloodWay</span>
            <span className="block text-xs font-semibold text-slate-600 md:text-blue-100">Safer communities · Smarter response</span>
          </div>
        </div>

        <EvacuationLoop className="relative mx-auto mt-5 aspect-[6/5] w-full max-w-[420px] rounded-[28px] shadow-[0_24px_60px_-28px_rgba(7,20,38,0.55)] ring-1 ring-blue-100 md:mt-8 md:max-w-[520px] md:ring-white/20" />

        <ul className="relative mt-8 hidden space-y-3 md:block">
          {POINTS.map((p) => (
            <li key={p.title} className="flex items-center gap-3 text-sm text-blue-50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15"><p.icon className="h-5 w-5" aria-hidden="true" /></span>
              <span><b className="font-bold text-white">{p.title}.</b> {p.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Copy and actions */}
      <main className="mx-auto flex w-full max-w-md flex-col justify-center px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 md:py-12">
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-100/70 px-3 py-1 text-xs font-semibold text-[#0958D9]">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Demo for the Huawei ICT Competition 2026
        </p>
        <h1 className="mt-3 font-heading text-[34px]/[40px] font-extrabold tracking-tight text-slate-900 md:text-[44px]/[50px]">
          Know before the <span className="text-[#1677FF]">water</span> rises
        </h1>
        <p className="mt-2 text-base/6 text-slate-600">Flood alerts, safe routes and your loved ones close, in one app.</p>

        <ul className="mt-5 grid grid-cols-3 gap-2 md:hidden">
          {POINTS.map((p) => (
            <li key={p.title} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-3 text-center shadow-[0_10px_28px_-22px_rgba(7,20,38,0.5)] ring-1 ring-slate-200/70">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-[#0958D9]"><p.icon className="h-5 w-5" aria-hidden="true" /></span>
              <span className="text-xs font-bold text-slate-900">{p.title}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={handleDemo}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#0958D9] px-6 font-heading text-base font-bold text-white shadow-lg shadow-blue-900/25 hover:bg-[#003EB3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2"
          >
            Continue as demo user <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>

          {signIn ? (
            <form onSubmit={handleCustomLogin} className="space-y-2.5">
              <label className="sr-only" htmlFor="welcome-name">Your name</label>
              <input id="welcome-name" type="text" required autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
              <label className="sr-only" htmlFor="welcome-email">Email</label>
              <input id="welcome-email" type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
              <button type="submit" className="flex min-h-12 w-full items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-bold text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]">
                Sign in
              </button>
            </form>
          ) : (
            <button type="button" onClick={() => setSignIn(true)} className="flex min-h-12 w-full items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-bold text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]">
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
