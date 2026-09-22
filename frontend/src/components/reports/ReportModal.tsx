import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle2, ShieldCheck, Camera } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { verifyFloodImageWithModelArts } from '../../services/huaweiModelArts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ isOpen, onClose }: Props) {
  const { addReport } = useApp();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('Jalan Raja Muda Musa, Kampung Baru');
  const [depthCm, setDepthCm] = useState(30);
  const [analyzing, setAnalyzing] = useState(false);
  const [verifiedResult, setVerifiedResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleSimulatedUpload = async () => {
    setAnalyzing(true);
    const result = await verifyFloodImageWithModelArts('simulated_img');
    setVerifiedResult(result);
    setAnalyzing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addReport({
      id: `rep-${Date.now()}`,
      title: title || 'Water Rising Rapidly on Roadside',
      location,
      lat: 3.1630,
      lon: 101.7020,
      waterDepthCm: depthCm,
      status: 'VERIFIED',
      verifiedBy: 'Huawei ModelArts PanGu-CV (97.4% confidence)',
      timestampStr: 'Just now',
      author: user?.name || 'Citizen Evaluator',
      upvotes: 1,
      imageUrl: '/banjir2.jpg'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-[#071426] to-[#0B1E38] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Camera className="w-5 h-5 text-[#1677FF]" />
            <h3 className="font-heading font-bold text-lg">Submit Community Flood Report</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-800 text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Incident Headline</label>
            <input
              type="text"
              required
              placeholder="e.g. Water Overflowing Curbside into Alley"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1677FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Location Details</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1677FF]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estimated Depth ({depthCm} cm)</label>
            <input
              type="range"
              min="5"
              max="120"
              value={depthCm}
              onChange={(e) => setDepthCm(Number(e.target.value))}
              className="w-full accent-[#1677FF]"
            />
          </div>

          {/* ModelArts Image AI Verification Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#1677FF]" />
                Huawei ModelArts CV Verification
              </span>
              <button
                type="button"
                onClick={handleSimulatedUpload}
                disabled={analyzing}
                className="px-3 py-1 rounded-lg bg-[#1677FF] text-white text-xs font-semibold hover:bg-[#0958D9]"
              >
                {analyzing ? 'Analyzing PanGu-CV...' : 'Attach & Verify Photo'}
              </button>
            </div>

            {verifiedResult && (
              <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ModelArts Confidence: 97.4% · Flood Verified
                </span>
                <p className="text-slate-600">{verifiedResult.analysisDetails}</p>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#1677FF] hover:bg-[#0958D9] text-white text-xs font-bold shadow-md shadow-blue-500/25"
            >
              Publish Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
