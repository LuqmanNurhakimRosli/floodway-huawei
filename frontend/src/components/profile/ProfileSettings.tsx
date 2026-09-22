import React, { useState } from 'react';
import { User, Phone, Users, Send, ShieldCheck, CheckCircle2, Save, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sendTelegramMessage } from '../../services/telegramService';

export function ProfileSettings() {
  const { user } = useAuth();
  const [tgToken, setTgToken] = useState(() => localStorage.getItem('floodway_tg_token') || '');
  const [tgChatId, setTgChatId] = useState(() => localStorage.getItem('floodway_tg_chat_id') || '@FloodWaySafetyAlerts');
  const [testSent, setTestSent] = useState(false);

  const [contacts, setContacts] = useState([
    { id: 'c1', name: 'Nurul Huda (Mother)', phone: '+60 12-987 6543' },
    { id: 'c2', name: 'Farhan Rosli (Brother)', phone: '+60 19-321 0987' },
  ]);

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const handleSaveTelegram = () => {
    localStorage.setItem('floodway_tg_token', tgToken);
    localStorage.setItem('floodway_tg_chat_id', tgChatId);
    alert('Telegram Bot Settings Saved!');
  };

  const handleTestTelegram = async () => {
    const ok = await sendTelegramMessage('🔔 Test alert from FloodWay 2.0. Bot connectivity verified!', tgToken, tgChatId);
    if (ok) setTestSent(true);
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    setContacts([...contacts, { id: `c-${Date.now()}`, name: newName, phone: newPhone }]);
    setNewName('');
    setNewPhone('');
  };

  const removeContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Profile Overview */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1677FF] to-[#0958D9] text-white font-heading font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          {user?.name ? user.name.slice(0, 2).toUpperCase() : 'LN'}
        </div>
        <div>
          <h2 className="font-heading font-extrabold text-xl text-slate-900">{user?.name || 'Luqman Nurhakim'}</h2>
          <p className="text-xs text-slate-500">{user?.email || 'luqman@floodway.my'} · {user?.phone || '+60 12-345 6789'}</p>
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-[#1677FF] text-[10px] font-bold border border-blue-200">
            Registered Citizen Responder
          </span>
        </div>
      </div>

      {/* Telegram Family SOS Gateway */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Send className="w-5 h-5 text-[#1677FF]" />
          <h3 className="font-heading font-bold text-lg text-slate-900">Telegram Bot Family SOS Gateway</h3>
        </div>

        <p className="text-xs text-slate-600">
          Configure your Telegram Bot token and channel/chat ID to receive instant automated evacuation alerts and geofence shelter arrival check-ins.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telegram Bot Token</label>
            <input
              type="text"
              placeholder="e.g. 8192398492:AAH-xX9023..."
              value={tgToken}
              onChange={(e) => setTgToken(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#1677FF]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telegram Chat / Channel ID</label>
            <input
              type="text"
              placeholder="e.g. @MyFamilyFloodGroup or -10012345678"
              value={tgChatId}
              onChange={(e) => setTgChatId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:border-[#1677FF]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleSaveTelegram}
            className="px-4 py-2 rounded-xl bg-[#1677FF] hover:bg-[#0958D9] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
          <button
            onClick={handleTestTelegram}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
          >
            Send Test Alert
          </button>
          {testSent && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Dispatched!
            </span>
          )}
        </div>
      </div>

      {/* Emergency Contacts Circle */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Users className="w-5 h-5 text-emerald-600" />
          <h3 className="font-heading font-bold text-lg text-slate-900">Family Emergency Circle</h3>
        </div>

        <div className="space-y-2">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-800 block">{c.name}</span>
                <span className="text-slate-500">{c.phone}</span>
              </div>
              <button
                onClick={() => removeContact(c.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={addContact} className="flex flex-col sm:flex-row gap-2 pt-2">
          <input
            type="text"
            placeholder="Name & Relationship (e.g. Uncle Hadi)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1677FF]"
          />
          <input
            type="text"
            placeholder="Phone (e.g. +60 17-555 1234)"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1677FF]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </form>
      </div>
    </div>
  );
}
