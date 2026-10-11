import { Smartphone } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { CameraDraft } from '../../../types/vision';
import { focusRing } from '../shared/ui';

export interface SourceForm {
  name: string;
  source_type: CameraDraft['source_type'];
  source_url: string;
  username: string;
  password: string;
  lat: string;
  lon: string;
  feed_refresh_s: number;
}

interface Props {
  form: SourceForm;
  onChange: (next: SourceForm) => void;
  error: string | null;
  onUseMyLocation: (() => void) | null;
}

const input = `min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 ${focusRing}`;
const label = 'mb-1 block text-sm font-semibold text-slate-800';

export function StepSource({ form, onChange, error, onUseMyLocation }: Props) {
  const errorRef = useRef<HTMLParagraphElement>(null);
  // The error sits under the form; bring it into view so the user sees why nothing happened.
  useEffect(() => { if (error) errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [error]);
  const set = <K extends keyof SourceForm>(key: K, value: SourceForm[K]) => onChange({ ...form, [key]: value });
  const types: { id: CameraDraft['source_type'] | 'phone'; text: string; disabled?: boolean }[] = [
    { id: 'stream', text: 'Stream URL (RTSP / HLS)' },
    { id: 'snapshot', text: 'Snapshot URL' },
    { id: 'phone', text: 'Phone camera (soon)', disabled: true },
  ];

  return (
    <div className="space-y-4">
      <div>
        <span className={label} id="src-type">Camera source</span>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-labelledby="src-type">
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={form.source_type === t.id}
              disabled={t.disabled}
              onClick={() => t.id !== 'phone' && set('source_type', t.id)}
              className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl border-2 px-3 text-sm font-bold ${focusRing} ${
                form.source_type === t.id ? 'border-[#1677FF] bg-blue-50 text-[#0958D9]' : 'border-slate-200 text-slate-700 hover:border-slate-300'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {t.id === 'phone' && <Smartphone className="h-4 w-4" aria-hidden="true" />}
              {t.text}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="cam-name" className={label}>Camera name</label>
        <input id="cam-name" className={input} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Kampung Baru Drain" maxLength={80} autoComplete="off" />
      </div>

      <div>
        <label htmlFor="cam-url" className={label}>{form.source_type === 'stream' ? 'Stream URL' : 'Snapshot image URL'}</label>
        <input id="cam-url" className={input} value={form.source_url} onChange={(e) => set('source_url', e.target.value)} placeholder={form.source_type === 'stream' ? 'rtsp://camera.example.com/stream1' : 'https://camera.example.com/snapshot.jpg'} inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="cam-user" className={label}>Username <span className="font-normal text-slate-600">(optional)</span></label>
          <input id="cam-user" className={input} value={form.username} onChange={(e) => set('username', e.target.value)} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="cam-pass" className={label}>Password <span className="font-normal text-slate-600">(optional)</span></label>
          <input id="cam-pass" type="password" className={input} value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" />
        </div>
      </div>
      <p className="-mt-2 text-xs text-slate-600">Credentials are sent to the FloodWay server over HTTPS and are never stored in your browser or saved to disk.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="cam-lat" className={label}>Latitude</label>
          <input id="cam-lat" className={`${input} font-mono`} value={form.lat} onChange={(e) => set('lat', e.target.value)} inputMode="decimal" />
        </div>
        <div>
          <label htmlFor="cam-lon" className={label}>Longitude</label>
          <input id="cam-lon" className={`${input} font-mono`} value={form.lon} onChange={(e) => set('lon', e.target.value)} inputMode="decimal" />
        </div>
      </div>
      {onUseMyLocation && (
        <button type="button" onClick={onUseMyLocation} className={`-mt-1 min-h-10 rounded-lg px-2 text-sm font-bold text-[#0958D9] hover:bg-blue-50 ${focusRing}`}>
          Use my current location
        </button>
      )}

      <div>
        <label htmlFor="cam-refresh" className={label}>How often does the source refresh?</label>
        <select id="cam-refresh" className={input} value={form.feed_refresh_s} onChange={(e) => set('feed_refresh_s', Number(e.target.value))}>
          <option value={0}>Continuous (live stream or fast snapshot)</option>
          <option value={60}>Every minute</option>
          <option value={300}>Every 5 minutes</option>
          <option value={900}>Every 15 minutes</option>
        </select>
        <p className="mt-1 text-xs text-slate-600">Slow public feeds can only be analysed as often as they update. We flag them as stale if they stop.</p>
      </div>

      {error && (
        <p ref={errorRef} role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm/5 font-semibold text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
