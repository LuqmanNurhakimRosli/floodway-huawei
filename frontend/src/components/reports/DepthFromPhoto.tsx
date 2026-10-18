import { Ruler, Undo2, Users } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  depthToLevel, formatRange, landmarkRange, levelsInRange, MEASURE_REFS, measureDepth, REFERENCE_OBJECTS, type DepthRange,
} from '../../lib/depthFromPhoto';
import { Segmented } from '../live/shared/Segmented';
import { StatusChip } from '../live/shared/StatusChip';
import { focusRing, num } from '../../styles/tokens';

export interface DepthEstimate {
  range: DepthRange;
  method: 'landmark' | 'measure';
  label: string;
}

interface Props {
  imageUrl: string;
  onChange: (estimate: DepthEstimate | null) => void;
}

type Pt = { x: number; y: number }; // normalised 0..1 on the displayed photo

const STEP_LABEL = ['Tap the upper mark', 'Tap the lower mark', 'Tap where the water meets the object'];
const DOT = ['bg-[#0B5F60]', 'bg-violet-700', 'bg-sky-600'];

function Result({ range }: { range: DepthRange }) {
  const levels = levelsInRange(range);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 p-3" role="status">
      <span className="text-xs/4 font-semibold text-slate-700">Depth from your photo</span>
      <span className={`${num} text-lg/6 font-bold text-slate-900`}>{formatRange(range)}</span>
      <span className="flex flex-wrap gap-1">{levels.map((l) => <StatusChip key={l} level={l} />)}</span>
      <span className="basis-full text-xs/4 text-slate-600">
        A range, because object sizes and camera angles vary. For cars: {depthToLevel(range.hi) === 'DANGER' ? 'do not drive through.' : depthToLevel(range.hi) === 'WARNING' ? 'only high vehicles, slowly.' : 'passable with care.'}
      </span>
    </div>
  );
}

/** Two ways to get a depth from a photo: pick where the water reaches on a known object, or measure on the photo. */
export function DepthFromPhoto({ imageUrl, onChange }: Props) {
  const [method, setMethod] = useState<'landmark' | 'measure'>('landmark');
  const [objectId, setObjectId] = useState('car');
  const [landmarkId, setLandmarkId] = useState('sill');
  const [refId, setRefId] = useState('door');
  const [upperCm, setUpperCm] = useState(210);
  const [lowerCm, setLowerCm] = useState(100);
  const [points, setPoints] = useState<Pt[]>([]);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const ref = MEASURE_REFS.find((r) => r.id === refId)!;
  const obj = REFERENCE_OBJECTS.find((o) => o.id === objectId)!;

  // A new photo invalidates any taps on the old one.
  useEffect(() => setPoints([]), [imageUrl]);
  useEffect(() => {
    setUpperCm(ref.upper.cm);
    setLowerCm(ref.lower.cm);
    setPoints([]);
  }, [ref]);

  const measured = useMemo(() => {
    if (points.length < 3 || !natural.h) return null;
    return measureDepth({
      upperY: points[0].y * natural.h, lowerY: points[1].y * natural.h, waterY: points[2].y * natural.h,
      upperCm, lowerCm, upperTolCm: ref.upper.tolCm, lowerTolCm: ref.lower.tolCm,
      tapErrPx: Math.max(4, natural.h / 120), // a fingertip is a bigger share of a small photo
    });
  }, [points, natural.h, upperCm, lowerCm, ref]);

  const landmark = landmarkRange(objectId, landmarkId);

  useEffect(() => {
    if (method === 'landmark') {
      const l = obj.landmarks.find((x) => x.id === landmarkId);
      onChange(landmark && l ? { range: landmark, method, label: `Water at the ${l.label.toLowerCase()} of a ${obj.label.toLowerCase()}` } : null);
    } else {
      onChange(measured?.ok ? { range: measured.range, method, label: `Measured on the photo against a ${ref.label.toLowerCase()}` } : null);
    }
    // onChange is a setter from the parent; re-running on its identity would loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, landmark, measured, obj, landmarkId, ref]);

  const tap = (e: React.PointerEvent<HTMLDivElement>) => {
    if (points.length >= 3) return;
    const r = e.currentTarget.getBoundingClientRect();
    setPoints([...points, { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }]);
  };

  return (
    <div>
      <Segmented
        label="How to measure the depth"
        options={[{ id: 'landmark', label: 'Pick a landmark' }, { id: 'measure', label: 'Measure on photo' }]}
        value={method}
        onChange={(id) => setMethod(id as 'landmark' | 'measure')}
      />

      {method === 'landmark' ? (
        <div className="mt-3 space-y-3">
          <fieldset>
            <legend className="mb-1.5 flex items-center gap-1.5 text-xs/4 font-semibold text-slate-700">
              <Users className="h-3.5 w-3.5" aria-hidden="true" /> What is in the water in your photo?
            </legend>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {REFERENCE_OBJECTS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={objectId === o.id}
                  onClick={() => { setObjectId(o.id); setLandmarkId(o.landmarks[Math.min(1, o.landmarks.length - 1)].id); }}
                  className={`min-h-11 rounded-xl border px-2 text-sm font-semibold ${focusRing} ${objectId === o.id ? 'border-[#0B5F60] bg-teal-50 text-[#0B5F60]' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs/4 text-slate-600">{obj.hint}</p>
          </fieldset>
          <fieldset>
            <legend className="mb-1.5 text-xs/4 font-semibold text-slate-700">Where does the water reach?</legend>
            <div className="space-y-1.5">
              {obj.landmarks.map((l) => (
                <label key={l.id} className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 text-sm ${landmarkId === l.id ? 'border-[#0B5F60] bg-teal-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <span className="flex items-center gap-2.5">
                    <input type="radio" name="landmark" value={l.id} checked={landmarkId === l.id} onChange={() => setLandmarkId(l.id)} className="h-4 w-4 accent-[#0B5F60]" />
                    <span className="font-medium text-slate-900">{l.label}</span>
                  </span>
                  <span className={`${num} text-xs text-slate-600`}>{formatRange(l.range)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {landmark && <Result range={landmark} />}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="text-xs/4 font-semibold text-slate-700">
              Reference with two marks above the water
              <select value={refId} onChange={(e) => setRefId(e.target.value)} className={`mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 ${focusRing}`}>
                {MEASURE_REFS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
              </select>
            </label>
            <label className="text-xs/4 font-semibold text-slate-700">
              {ref.upper.label} (cm)
              <input type="number" inputMode="numeric" min={1} max={500} value={upperCm} onChange={(e) => { setUpperCm(Number(e.target.value)); setPoints([]); }} className={`${num} mt-1 block min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm sm:w-28 ${focusRing}`} />
            </label>
            <label className="text-xs/4 font-semibold text-slate-700">
              {ref.lower.label} (cm)
              <input type="number" inputMode="numeric" min={1} max={500} value={lowerCm} onChange={(e) => { setLowerCm(Number(e.target.value)); setPoints([]); }} className={`${num} mt-1 block min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm sm:w-28 ${focusRing}`} />
            </label>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-sm/5 font-semibold text-slate-900" aria-live="polite">
              <Ruler className="h-4 w-4 text-[#0B5F60]" aria-hidden="true" />
              {points.length < 3 ? `${points.length + 1} of 3. ${STEP_LABEL[points.length]}${points.length === 0 ? ` (${ref.upper.label.toLowerCase()})` : points.length === 1 ? ` (${ref.lower.label.toLowerCase()})` : ''}.` : 'Done. Undo a point to adjust it.'}
            </p>
            <button type="button" disabled={points.length === 0} onClick={() => setPoints(points.slice(0, -1))} className={`inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 disabled:opacity-40 ${focusRing}`}>
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" /> Undo
            </button>
          </div>

          <div className="relative mx-auto w-fit max-w-full touch-none select-none overflow-hidden rounded-xl border border-slate-200 bg-slate-900" onPointerDown={tap}>
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Your flood photo. Tap the two marks, then the waterline."
              className="block max-h-[52vh] w-auto max-w-full"
              draggable={false}
              onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            />
            {points.map((p, i) => (
              <span key={i} className="pointer-events-none absolute" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>
                <span className={`absolute -left-[60px] -top-px h-0.5 w-[120px] ${DOT[i]} opacity-80`} aria-hidden="true" />
                <span className={`absolute -left-3 -top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow ${DOT[i]}`}>{i + 1}</span>
              </span>
            ))}
          </div>
          <p className="text-xs/4 text-slate-600">Tap all three points on the same object, straight above each other. Marks must both be above the water.</p>
          {measured && 'reason' in measured && <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-sm/5 font-medium text-amber-900">{measured.reason}</p>}
          {measured?.ok && <Result range={measured.range} />}
        </div>
      )}
    </div>
  );
}
