import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, MapPin, Phone, Siren, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { familyActions } from '../../hooks/useFamily';
import { fmtDistance, nearestOpenCentre, placeAt, whereText, type FamilyMember, type Place } from '../../lib/family';
import { dispatchFamilyCheckin, dispatchFamilySos, type TelegramResult } from '../../services/telegramService';
import type { Shelter } from '../../types';

/** Phone: a sheet from the bottom. Wider screens: a centred card. Escape and the close button dismiss it. */
export function Modal({ title, onClose, children, tone = 'default' }: { title: string; onClose: () => void; children: ReactNode; tone?: 'default' | 'danger' }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('[data-autofocus], button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-slate-950/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-[28px] ${tone === 'danger' ? 'border-t-4 border-red-500' : ''}`}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-extrabold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function telegramText(t: TelegramResult | null): { text: string; cls: string } {
  if (!t) return { text: 'Sending to Telegram…', cls: 'text-slate-600' };
  if (t.success) return { text: 'Also sent to your Telegram family group.', cls: 'text-emerald-700' };
  if (t.simulated) return { text: 'Telegram is not set up on the server, so nothing went to Telegram.', cls: 'text-amber-800' };
  return { text: t.error ?? 'Telegram could not be reached. Nothing went to Telegram.', cls: 'text-amber-800' };
}

const HOLD_MS = 2000;

/** Press and hold to send, so a pocket tap cannot raise an SOS. Keyboard: hold Enter or Space. */
export function SosDialog({ you, shelters, onClose }: { you: FamilyMember; shelters: Shelter[]; onClose: () => void }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [sent, setSent] = useState(you.status === 'sos');
  const [telegram, setTelegram] = useState<TelegramResult | null | 'none'>('none');
  const raf = useRef<number | null>(null);
  const startAt = useRef(0);
  const centre = nearestOpenCentre([you.lat, you.lon], shelters);

  const fire = () => {
    familyActions.startSos();
    setSent(true);
    setTelegram(null);
    dispatchFamilySos({
      userName: user?.name || 'FloodWay user',
      lat: you.lat,
      lon: you.lon,
      positionSource: you.source,
      nearestCentre: centre?.centre.name.replace('Demo relief centre: ', ''),
      nearestCentreM: centre?.distanceM,
    })
      .then(setTelegram)
      .catch(() => setTelegram({ success: false }));
  };

  const begin = () => {
    if (sent || raf.current !== null) return;
    startAt.current = performance.now();
    const step = () => {
      const p = Math.min(1, (performance.now() - startAt.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        raf.current = null;
        fire();
        return;
      }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  const end = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    if (!sent) setProgress(0);
  };
  useEffect(() => () => end(), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal title={sent ? 'SOS is on' : 'Send an SOS'} onClose={onClose} tone="danger">
      {!sent ? (
        <>
          <p className="text-sm/6 text-slate-700">Your circle sees your position and a red SOS on the map. If you are in immediate danger, call 999 first.</p>
          <div className="my-5 flex justify-center">
            <button
              type="button"
              data-autofocus
              onPointerDown={begin}
              onPointerUp={end}
              onPointerLeave={end}
              onPointerCancel={end}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !e.repeat && (e.preventDefault(), begin())}
              onKeyUp={(e) => (e.key === 'Enter' || e.key === ' ') && end()}
              onContextMenu={(e) => e.preventDefault()}
              aria-label="Hold to send SOS"
              className="relative flex h-40 w-40 touch-none select-none items-center justify-center rounded-full bg-red-600 text-white shadow-[0_18px_40px_-12px_rgba(220,38,38,0.7)] focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
            >
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="5" />
                <circle cx="50" cy="50" r="46" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${progress * 289} 289`} opacity={progress > 0 ? 1 : 0} />
              </svg>
              <span className="flex flex-col items-center">
                <Siren className="h-10 w-10" aria-hidden="true" />
                <span className="mt-1 font-heading text-lg font-extrabold">Hold</span>
                <span className="text-xs font-semibold opacity-90">for 2 seconds</span>
              </span>
            </button>
          </div>
          <a href="tel:999" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 font-bold text-red-800 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
            <Phone className="h-5 w-5" aria-hidden="true" /> Call 999
          </a>
        </>
      ) : (
        <>
          <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4">
            <Siren className="mt-0.5 h-6 w-6 shrink-0 text-red-700" aria-hidden="true" />
            <div className="text-sm/6 text-red-950">
              <p className="font-bold">Your circle can see your SOS and position.</p>
              <p>
                {you.source === 'gps' ? 'Position from your phone GPS.' : 'Position is your demo position (turn on phone location in Layers for a real one).'}
                {centre ? ` Nearest open centre: ${centre.centre.name.replace('Demo relief centre: ', '')}, ${fmtDistance(centre.distanceM)} in a straight line.` : ''}
              </p>
            </div>
          </div>
          {telegram !== 'none' && <p role="status" className={`mt-3 text-sm font-semibold ${telegramText(telegram).cls}`}>{telegramText(telegram).text}</p>}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <a href="tel:999" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-white font-bold text-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
              <Phone className="h-5 w-5" aria-hidden="true" /> Call 999
            </a>
            <button
              type="button"
              onClick={() => {
                familyActions.markSafe();
                onClose();
              }}
              className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-bold text-white hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
            >
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> I'm safe now
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

/** Tell the circle where you are and that you are fine. */
export function CheckInDialog({ you, places, onClose }: { you: FamilyMember; places: Place[]; onClose: () => void }) {
  const { user } = useAuth();
  const here = placeAt([you.lat, you.lon], places);
  const [choice, setChoice] = useState<string>(here?.id ?? 'current');
  const [telegram, setTelegram] = useState<TelegramResult | null | 'idle'>('idle');
  const label = choice === 'current' ? whereText(you, []).replace(/^Near /, 'near ') : (places.find((p) => p.id === choice)?.name ?? 'your position');

  const send = () => {
    familyActions.checkIn(label);
    setTelegram(null);
    dispatchFamilyCheckin({ userName: user?.name || 'FloodWay user', placeName: label, lat: you.lat, lon: you.lon })
      .then(setTelegram)
      .catch(() => setTelegram({ success: false }));
  };

  return (
    <Modal title={telegram === 'idle' ? 'Check in' : 'Checked in'} onClose={onClose}>
      {telegram === 'idle' ? (
        <>
          <p className="text-sm/6 text-slate-700">Let your circle know you are safe, and where.</p>
          <fieldset className="mt-3 space-y-2">
            <legend className="sr-only">Where are you</legend>
            {[{ id: 'current', name: `My position (${you.source === 'gps' ? 'phone GPS' : 'demo'})` }, ...places].map((p) => (
              <label key={p.id} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border px-3.5 text-sm font-semibold ${choice === p.id ? 'border-[#1677FF] bg-blue-50 text-slate-900' : 'border-slate-200 text-slate-800'}`}>
                <input type="radio" name="checkin-place" value={p.id} checked={choice === p.id} onChange={() => setChoice(p.id)} className="h-5 w-5 accent-[#0958D9]" />
                <MapPin className="h-4 w-4 text-[#0958D9]" aria-hidden="true" /> {p.name}
                {here?.id === p.id && <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">You are here</span>}
              </label>
            ))}
          </fieldset>
          <button type="button" onClick={send} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0958D9] font-heading font-bold text-white shadow-lg shadow-blue-900/25 hover:bg-[#003EB3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" /> Check in as safe
          </button>
        </>
      ) : (
        <>
          <p className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-4 text-sm/6 text-emerald-950">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" /> Your circle sees that you checked in at {label}.
          </p>
          <p role="status" className={`mt-3 text-sm font-semibold ${telegramText(telegram).cls}`}>{telegramText(telegram).text}</p>
          <button type="button" onClick={onClose} className="mt-4 flex min-h-12 w-full items-center justify-center rounded-2xl border border-slate-300 font-bold text-slate-900 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]">
            Done
          </button>
        </>
      )}
    </Modal>
  );
}
