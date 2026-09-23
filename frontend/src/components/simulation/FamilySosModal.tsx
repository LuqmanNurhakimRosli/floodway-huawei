import React, { useState, useEffect } from 'react';
import { ShieldAlert, Send, X, CheckCircle2, MessageSquare, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import {
  dispatchEmergencySosAlert,
  syncTelegramChatId,
  TELEGRAM_CONFIG
} from '../../services/telegramService';

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
  const [syncing, setSyncing] = useState(false);
  const [tgChatId, setTgChatId] = useState<string>(() => localStorage.getItem(TELEGRAM_CONFIG.STORAGE_CHAT_KEY) || '');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen && !tgChatId) {
      // Background auto-sync on open
      handleSyncChat();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const targetShelter = shelters[0]?.name || 'Dewan Sultan Sulaiman, Kampung Baru';

  const handleSyncChat = async () => {
    setSyncing(true);
    setSyncStatusMsg('');
    const res = await syncTelegramChatId();
    setSyncing(false);
    if (res.success && res.chatId) {
      setTgChatId(res.chatId);
      setSyncStatusMsg(`Linked to chat (${res.senderName || res.chatId})`);
    } else {
      setSyncStatusMsg(res.message || 'No messages received yet. Send /start to bot.');
    }
  };

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
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-4 pointer-events-auto">
      <div className="w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-red-200 uppercase tracking-wider block">Life-Safety Protocol</span>
              <h3 className="font-heading font-extrabold text-base text-white">Family SOS Broadcast</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4.5 space-y-3.5">
          <p className="text-xs text-slate-600 leading-relaxed">
            Immediately alerts registered emergency contacts via <b>Telegram Bot API</b> with live GPS, critical water breach depth, and target shelter route.
          </p>

          {/* Telegram Bot Link & Status Banner */}
          <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span className="text-xs font-bold text-sky-900">
                  Telegram Bot: <span className="font-mono text-sky-700">@{TELEGRAM_CONFIG.BOT_USERNAME}</span>
                </span>
              </div>
              <a
                href={TELEGRAM_CONFIG.BOT_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1 underline underline-offset-2 cursor-pointer"
              >
                <span>Open Bot</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-sky-200/60">
              <span className="truncate">
                {tgChatId ? `Connected Chat ID: ${tgChatId}` : (syncStatusMsg || 'Ready to dispatch')}
              </span>
              <button
                type="button"
                onClick={handleSyncChat}
                disabled={syncing}
                className="text-[10px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* Evacuee & Situation Brief */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Evacuee:</span>
              <span className="font-bold text-slate-900">{user?.name || 'Luqman Nurhakim'}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Water Depth at Home:</span>
              <span className="font-bold text-red-600">{depthCm} cm (Breaching living area)</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Designated Refuge:</span>
              <span className="font-bold text-emerald-700">{targetShelter}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Gateway:</span>
              <span className="font-semibold text-slate-800">Telegram Bot API + Huawei Cloud IoT</span>
            </div>
          </div>

          {sentSuccess ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-sm block">SOS Broadcast Dispatched!</span>
                <span className="text-xs">Transitioning to turn-by-turn evacuation navigation...</span>
              </div>
            </div>
          ) : (
            <button
              onClick={handleBroadcast}
              disabled={sending}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/25 transition-transform active:scale-98 disabled:opacity-50 cursor-pointer"
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
