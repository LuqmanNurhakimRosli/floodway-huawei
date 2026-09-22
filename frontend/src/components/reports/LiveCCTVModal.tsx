import React from 'react';
import { X, Video, ShieldCheck, Radio } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function LiveCCTVModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 bg-[#071426] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-[#1677FF]" />
            <h3 className="font-heading font-bold text-base">JPS River CCTV Feeds · Live Multi-Stream</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black relative">
            <img src="/cctv image.jpg" alt="Klang River CCTV" className="w-full h-48 object-cover opacity-90" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE · SMART Sluice Gate 04
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black relative">
            <img src="/banjir2.jpg" alt="Taman Sri Muda CCTV" className="w-full h-48 object-cover opacity-90" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              LIVE · Klang River South
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Verified JPS Stream via Huawei Cloud Media Services
          </span>
          <button onClick={onClose} className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
            Close Stream
          </button>
        </div>
      </div>
    </div>
  );
}
