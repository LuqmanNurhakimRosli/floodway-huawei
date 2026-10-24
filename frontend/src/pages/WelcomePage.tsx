import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bell, Navigation, ShieldCheck, Users } from 'lucide-react';
import { LogoLoop } from '../components/brand/LogoLoop';
import { useAuth } from '../contexts/AuthContext';

const POINTS = [
  { icon: Bell, title: 'Flood alerts', text: 'before the road floods, not after' },
  { icon: Navigation, title: 'Safe routes', text: 'around flooded roads and closed underpasses' },
  { icon: Users, title: 'Family circle', text: 'see who is safe and who needs help' },
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

  const input = 'block min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 placeholder:text-slate-500 focus:border-[#1677FF] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/30';
  const secondary = 'flex min-h-12 w-full items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] motion-reduce:transition-none';

  return (
    <div className="flex min-h-dvh flex-col bg-[#071426] md:grid md:grid-cols-[1.25fr_1fr] md:bg-[#F4F7FB]">
      {/* Stage: the animated mark on deep blue. Top of the screen on phones, the left panel on wider screens. */}
      <div className="relative flex min-h-[52dvh] flex-1 flex-col overflow-hidden bg-[radial-gradient(120%_90%_at_50%_38%,#1677FF_0%,#0958D9_38%,#003EB3_62%,#071426_100%)] px-6 pb-14 pt-[max(1.25rem,env(safe-area-inset-top))] md:min-h-dvh md:px-12 md:pb-12 md:pt-10">
        <div className="fw-stage-in flex flex-1 flex-col items-center justify-center">
          <LogoLoop className="w-[min(72vw,340px)] md:w-[min(34vw,460px)]" />
          <p className="mt-8 font-heading text-[44px]/none font-extrabold tracking-[-0.03em] text-white md:mt-10 md:text-[64px]">FloodWay</p>
          <p className="mt-3 text-sm font-medium text-blue-100/90 md:text-base">Safer communities, smarter response</p>
        </div>
        <ul className="relative hidden gap-6 text-sm text-blue-100 md:flex">
          {POINTS.map((p) => (
            <li key={p.title} className="flex max-w-[15rem] items-start gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/15"><p.icon className="h-4.5 w-4.5" aria-hidden="true" /></span>
              <span className="pt-0.5"><b className="font-bold text-white">{p.title}</b> {p.text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions: a sheet rising over the stage on phones, the right panel on wider screens */}
      <main className="fw-rise-in relative -mt-8 rounded-t-[32px] bg-[#F4F7FB] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-7 md:mt-0 md:flex md:flex-col md:justify-center md:rounded-none md:px-14 md:py-12">
        <div className="mx-auto w-full max-w-sm">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-blue-100/70 px-3 py-1 text-xs font-semibold text-[#0958D9]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Huawei ICT Competition 2026–2027 demo
          </p>
          <h1 className="mt-3 font-heading text-[32px]/[38px] font-extrabold tracking-tight text-slate-900 md:text-[42px]/[48px]">Know before the water rises</h1>
          <p className="mt-2 text-base/6 text-slate-600">Flood alerts, safe routes and your family close, in one app.</p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleDemo}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#0958D9] px-6 font-heading text-base font-bold text-white shadow-lg shadow-blue-900/25 transition-[background-color,transform] duration-150 hover:bg-[#003EB3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transition-none"
            >
              Continue as demo user <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>

            {signIn ? (
              <form onSubmit={handleCustomLogin} className="space-y-2.5">
                <label className="sr-only" htmlFor="welcome-name">Your name</label>
                <input id="welcome-name" type="text" required autoFocus autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
                <label className="sr-only" htmlFor="welcome-email">Email</label>
                <input id="welcome-email" type="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
                <button type="submit" className={secondary}>Sign in</button>
              </form>
            ) : (
              <button type="button" onClick={() => setSignIn(true)} className={secondary}>
                Sign in with name and email
              </button>
            )}
          </div>

          <p className="mt-8 text-xs/5 text-slate-500">© 2026 FloodWay team. A demo on simulated data; for real flood warnings follow official sources.</p>
        </div>
      </main>
    </div>
  );
}
