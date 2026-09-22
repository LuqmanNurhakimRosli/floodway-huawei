import React, { useState } from 'react';
import { ShieldAlert, Send, X, CheckCircle2, MapPin, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { dispatchEmergencySosAlert } from '../../services/telegramService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  depthCm: number;
  onProceedToNavigation: () => void;
}

export function FamilySosModal({ isOpen, onClose, depthCm, onProceedToNavigation }: Props) {
  const { user } = useAuth();
  const { shelters, setFamilySafetyStatus } = useApp();
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const targetShelter = shelters[0]?.name || 'SK Seksyen 24 Shah Alam';

  const handleBroadcast = async () => {
    setSending(true);
    await dispatchEmergencySosAlert({
      userName: user?.name || 'Luqman Nurhakim',
      phone: user?.phone || '+60 12-345 6789',
      lat: 3.1610,
      lon: 101.7010,
      waterDepthCm: depthCm,
      shelterName: targetShelter
    });

    setFamilySafetyStatus('SOS_ACTIVE');
    setSending(false);
    setSentSuccess(true);

    setTimeout(() => {
      onClose();
      onProceedToNavigation();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-4">
      <div className="w-full max-w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-red-200 uppercase tracking-wider block">Life-Safety Protocol</span>
              <h3 className="font-heading font-extrabold text-base text-white">Family SOS Broadcast</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5">
          <p className="text-xs text-slate-600 leading-relaxed">
            Immediately alerts your registered family contacts via <b>Telegram Bot API</b> with live GPS, flood depth, and target shelter route.
          </p>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Evacuee:</span>
              <span className="font-bold text-slate-900">{user?.name || 'Luqman Nurhakim'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Water Depth at Home:</span>
              <span className="font-bold text-red-600">{depthCm} cm (Breaching porch)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Designated Refuge:</span>
              <span className="font-bold text-emerald-700">{targetShelter}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Channels:</span>
              <span className="font-semibold text-slate-800">Telegram Bot Gateway + Huawei IoTDA</span>
            </div>
          </div>

          {sentSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-sm block">SOS Alert Successfully Broadcasted!</span>
                <span className="text-xs">Transitioning to live turn-by-turn evacuation navigation...</span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleBroadcast}
              disabled={sending}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition-transform active:scale-98 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Broadcasting Alert...' : 'Broadcast to Telegram & Start Evacuation ➔'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
