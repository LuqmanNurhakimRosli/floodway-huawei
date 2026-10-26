import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Camera, Info, MapPin, Send, ShieldCheck, Sparkles, UploadCloud, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { FLOOD_PRONE, originForLocation } from '../../data/klDemo';
import { useNearbySensors } from '../../hooks/useNearbySensors';
import { compareAi, compareSensor, formatRange, midpoint, summarise } from '../../lib/depthFromPhoto';
import { analyzeFloodImage } from '../../services/geminiVisionService';
import { dispatchFloodIncidentReportAlert } from '../../services/telegramService';
import type { AiVerificationResult } from '../../types';
import { btnPrimary, btnSecondary, focusRing } from '../../styles/tokens';
import { DepthFromPhoto, type DepthEstimate } from './DepthFromPhoto';
import { EvidenceCheck } from './EvidenceCheck';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Sample photos to try the flow without a camera. Not linked to any agency.
const SAMPLES = [
  { src: '/banjir_drain.jpg', name: 'Drain overflow', title: 'Monsoon drain overflowing into a residential road', location: 'Seksyen 13, Shah Alam' },
  { src: '/banjir_underpass.jpg', name: 'Underpass', title: 'Water collecting in an underpass', location: 'Sungai Rasau, Klang' },
  { src: '/banjir2.jpg', name: 'Road spillover', title: 'Water spilling onto Jalan Raja Muda Musa', location: 'Kampung Baru, Kuala Lumpur' },
  { src: '/banjir3.jfif', name: 'Submerged road', title: 'Road and drain under water', location: 'Taman Sri Muda, Seksyen 25' },
];

const MAX_BYTES = 10 * 1024 * 1024;
const input = `block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-500 ${focusRing}`;

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`step-${n}`} className="space-y-2.5">
      <div>
        <h3 id={`step-${n}`} className="flex items-center gap-2 font-heading text-base/6 font-bold text-slate-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{n}</span>
          {title}
        </h3>
        {hint && <p className="mt-0.5 pl-8 text-xs/4 text-slate-600">{hint}</p>}
      </div>
      <div className="pl-0 sm:pl-8">{children}</div>
    </section>
  );
}

/** A report posted in this session lands at a random flood-prone spot in Kuala Lumpur, so the crowd area is easy to find on the map. */
const CROWD_RADIUS_M = 2000;
const OPERATOR_DELAY_MS = 3000;
function randomSpot() {
  const a = FLOOD_PRONE[Math.floor(Math.random() * FLOOD_PRONE.length)];
  return { name: a.name, lat: a.lat + (Math.random() - 0.5) * 0.004, lon: a.lon + (Math.random() - 0.5) * 0.004 };
}

export function ReportModal({ isOpen, onClose }: Props) {
  const { addReport, approveReport, selectedLocation } = useApp();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(SAMPLES[0].title);
  const [location, setLocation] = useState(SAMPLES[0].location);
  const [image, setImage] = useState(SAMPLES[0].src);
  const [fileName, setFileName] = useState<string>('Sample: drain overflow');
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [estimate, setEstimate] = useState<DepthEstimate | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [ai, setAi] = useState<AiVerificationResult | null>(null);

  // The report is placed at the demo position chosen in the header; the free-text location is what people read.
  const position = originForLocation(selectedLocation);
  const sensors = useNearbySensors(position.lat, position.lon);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pickFile = (file: File) => {
    if (!file.type.startsWith('image/')) return setFileError('That file is not a photo. Choose a JPG, PNG or WebP image.');
    if (file.size > MAX_BYTES) return setFileError('That photo is larger than 10 MB. Choose a smaller one.');
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result !== 'string') return;
      setImage(e.target.result);
      setFileName(file.name);
      setFileError(null);
      setAi(null);
    };
    reader.readAsDataURL(file);
  };

  const runAi = async () => {
    setAnalyzing(true);
    setAi(await analyzeFloodImage({ imageUrl: image, userDescription: title, reportedDepthCm: estimate ? midpoint(estimate.range) : undefined }));
    setAnalyzing(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estimate) return;
    const aiAssessed = Boolean(ai?.ran && ai.verified);
    const depth = midpoint(estimate.range);
    const summary = summarise([
      compareSensor(estimate.range, sensors.camera),
      compareSensor(estimate.range, sensors.node),
      compareAi(estimate.range, ai?.ran ? ai.estimatedDepthCm : null),
    ]).text;
    const author = user?.name || 'Citizen Responder';
    const id = `rep-${Date.now()}`;
    const spot = randomSpot();
    // An AI check that ran and found no flooding stops here. Otherwise the operator desk approves it a moment later
    // (simulated in this demo), and a 2 km crowd area appears on the map until the page is refreshed.
    const aiRejected = Boolean(ai?.ran && !ai.verified);
    if (!aiRejected) {
      setTimeout(() => approveReport(id, 'FloodWay operator desk (demo auto-approval)', 'Operator', 'Demo: approved automatically so the crowd-sourced area can be shown. No agency was involved.'), OPERATOR_DELAY_MS);
    }
    addReport({
      id,
      title: title || 'Water rising on the road',
      location: `${spot.name} (${location})`,
      lat: spot.lat,
      lon: spot.lon,
      crowdRadiusM: CROWD_RADIUS_M,
      waterDepthCm: depth,
      depthRangeCm: estimate.range,
      depthMethod: estimate.label,
      evidenceSummary: summary.replace(' A person still reviews this report.', ''),
      status: aiAssessed ? 'AI_VERIFIED' : 'UNDER_REVIEW',
      verifiedBy: aiAssessed ? 'AI assessment (not an official verification)' : 'Not yet reviewed',
      timestampStr: 'Just now',
      createdAt: Date.now(),
      author,
      upvotes: 1,
      imageUrl: image,
      description: `Depth from the photo: ${formatRange(estimate.range)} (${estimate.label.toLowerCase()}).${aiAssessed ? ' An AI assessment judged the photo to show flooding.' : ' No AI check was completed.'}`,
      aiVerification: ai ?? undefined,
    });
    dispatchFloodIncidentReportAlert({ title: title || 'Water rising on the road', location, waterDepthCm: depth, author, hasPhotoEvidence: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-950/70 backdrop-blur-sm md:items-center md:p-6" role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="flex h-dvh w-full flex-col overflow-hidden bg-white md:h-auto md:max-h-[92vh] md:max-w-2xl md:rounded-3xl md:shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6 md:pt-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <Camera className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="report-title" className="truncate font-heading text-lg/6 font-bold text-slate-900">Report a flood</h2>
              <p className="truncate text-xs/4 text-slate-600">Photo, depth and a check against nearby sensors</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 ${focusRing}`}>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 py-5 md:px-6">
          <Step n={1} title="Your photo" hint="Include something of known size in the water: a person, a car, a kerb or a door.">
            <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files?.[0]) pickFile(e.dataTransfer.files[0]); }}
              className={`flex w-full items-center gap-3 rounded-2xl border-2 border-dashed p-3 text-left ${focusRing} ${dragging ? 'border-[#0958D9] bg-blue-50' : 'border-slate-300 hover:border-[#0958D9] hover:bg-slate-50'}`}
            >
              <img src={image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              <span className="min-w-0">
                <span className="block truncate text-sm/5 font-semibold text-slate-900">{fileName}</span>
                <span className="mt-1 inline-flex items-center gap-1.5 text-sm/5 font-semibold text-[#0958D9]">
                  <UploadCloud className="h-4 w-4" aria-hidden="true" /> Take or choose a photo
                </span>
                <span className="block text-xs/4 text-slate-600">or drop one here · JPG, PNG, WebP up to 10 MB</span>
              </span>
            </button>
            {fileError && <p role="alert" className="mt-2 text-sm/5 font-medium text-red-700">{fileError}</p>}
            <div className="mt-2">
              <p className="mb-1.5 text-xs/4 font-semibold text-slate-600">Or try a sample photo</p>
              <div className="grid grid-cols-4 gap-1.5">
                {SAMPLES.map((s) => (
                  <button
                    key={s.src}
                    type="button"
                    aria-pressed={image === s.src}
                    aria-label={`Sample photo: ${s.name}`}
                    onClick={() => { setImage(s.src); setFileName(`Sample: ${s.name.toLowerCase()}`); setTitle(s.title); setLocation(s.location); setAi(null); setFileError(null); }}
                    className={`overflow-hidden rounded-xl border-2 ${focusRing} ${image === s.src ? 'border-[#0958D9]' : 'border-transparent'}`}
                  >
                    <img src={s.src} alt="" className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </Step>

          <Step n={2} title="How deep is it?" hint="Use what is in the photo. You get a depth range, because sizes and camera angles vary.">
            <DepthFromPhoto imageUrl={image} onChange={setEstimate} />
          </Step>

          <Step n={3} title="Where and what">
            <div className="grid gap-3">
              <label className="text-xs/4 font-semibold text-slate-700">
                Short description
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Drain overflowing onto the road" className={`${input} mt-1`} />
              </label>
              <label className="text-xs/4 font-semibold text-slate-700">
                Place
                <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} className={`${input} mt-1`} />
              </label>
              <p className="flex items-center gap-1.5 text-xs/4 text-slate-600">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> Once approved, a 2 km area appears on the map for everyone until you refresh (demo: placed at a random flood-prone spot).
              </p>
            </div>
          </Step>

          <Step n={4} title="AI photo check (optional)" hint="A multimodal model gives its opinion of the photo. It is one input, not the verdict.">
            <button type="button" onClick={() => void runAi()} disabled={analyzing} className={`${btnSecondary} w-full`}>
              {analyzing ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 motion-reduce:animate-none" aria-hidden="true" /> Asking the model…</>
              ) : (
                <><Sparkles className="h-4 w-4 text-[#0958D9]" aria-hidden="true" /> Ask the AI about this photo</>
              )}
            </button>
            {ai && (
              <div role="status" className={`mt-2 rounded-xl border p-3 text-sm/5 ${ai.ran ? 'border-sky-200 bg-sky-50 text-sky-950' : 'border-slate-200 bg-slate-50 text-slate-800'}`}>
                {ai.ran ? (
                  <>
                    <p className="flex items-start gap-1.5 font-semibold">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {ai.verified ? 'The model thinks this shows flooding' : 'The model could not confirm flooding'}, about {ai.estimatedDepthCm} cm deep ({Math.round(ai.confidenceScore * 100)}% of its own certainty).
                    </p>
                    <p className="mt-1 text-xs/4 text-slate-700">
                      Photo looks {ai.appearsAuthentic === true ? 'genuine' : ai.appearsAuthentic === false ? 'suspicious' : 'hard to judge'} to the model. {ai.detectedHazards.length > 0 && `Hazards: ${ai.detectedHazards.join(', ')}. `}
                      “{ai.notes}”
                    </p>
                    <p className="mt-1 text-right text-xs/4 text-slate-600">{ai.engine}</p>
                  </>
                ) : (
                  <p className="flex items-start gap-1.5 font-medium"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> The AI check did not run. {ai.notes}</p>
                )}
              </div>
            )}
          </Step>

          <Step n={5} title="Evidence check" hint="Your measurement next to the sensors near you. This helps the reviewer; it does not decide.">
            <EvidenceCheck range={estimate?.range ?? null} method={estimate?.label ?? null} ai={ai} camera={sensors.camera} node={sensors.node} positionLabel={position.label} />
          </Step>

          <p className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs/4 text-slate-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0958D9]" aria-hidden="true" />
            Your report is saved as unverified. It shows as AI assessed only if you ran the AI check and the model judged it flooding. No agency reviews reports in this demo.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:px-6">
          <span className="min-w-0 truncate text-sm/5 text-slate-700">
            {estimate ? <>Depth <span className="font-bold text-slate-900">{formatRange(estimate.range)}</span></> : 'Measure the depth to send'}
          </span>
          <div className="flex shrink-0 gap-2">
            <span className="hidden sm:block"><button type="button" onClick={onClose} className={btnSecondary}>Cancel</button></span>
            <button type="submit" disabled={!estimate} className={btnPrimary}>
              <Send className="h-4 w-4" aria-hidden="true" /> Send report
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
