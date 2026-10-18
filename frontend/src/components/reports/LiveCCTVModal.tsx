import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// Sample cameras only. These are AI-generated base photographs with a synthetic water overlay (see
// backend/app/vision/sample_media/README.md), shown as stills. They are not live, not from any agency, and not CCTV.
const SAMPLES = [
  { id: 'sample-klang-jamek', name: 'Sg. Klang @ Masjid Jamek', src: '/media/live/klang-normal.webp' },
  { id: 'sample-gombak-tun-razak', name: 'Sg. Gombak @ Jln Tun Razak', src: '/media/live/gombak-normal.webp' },
];

export function LiveCCTVModal({ isOpen, onClose }: Props) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cctv-title">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-[#062B2B] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-sky-300" aria-hidden="true" />
            <h3 id="cctv-title" className="font-heading font-bold text-base">Sample cameras (simulated)</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2.5 rounded-full hover:bg-slate-800 text-slate-300">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLES.map((s) => (
            <figure key={s.id} className="rounded-2xl overflow-hidden border border-slate-200 bg-black relative">
              <img src={s.src} alt={`${s.name}, sample image`} className="w-full h-48 object-cover" />
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-xs font-bold">SAMPLE</span>
              <figcaption className="absolute bottom-0 inset-x-0 bg-black/65 px-3 py-1.5 text-xs text-white">{s.name}</figcaption>
            </figure>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
          <span>These are sample images, not live footage and not from any agency. AI-generated base photos with synthetic water.</span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => {
                onClose();
                navigate('/live');
              }}
              className="min-h-11 px-4 rounded-xl bg-[#0B5F60] text-white font-semibold text-xs"
            >
              Open Live Vision
            </button>
            <button onClick={onClose} className="min-h-11 px-4 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold text-xs">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
