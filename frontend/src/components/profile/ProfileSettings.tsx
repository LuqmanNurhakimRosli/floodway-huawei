import React, { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronRight, KeyRound, LogOut, MapPinned, Phone, Plus, Save, Send, Trash2, User, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { sendTelegramMessage } from '../../services/telegramService';
import { hasWriteToken, setWriteToken } from '../../services/auth';
import { circleMembers, familyActions, useFamily } from '../../hooks/useFamily';
import { Avatar } from '../family/Avatar';
import { card } from '../../styles/tokens';

const field = 'min-h-12 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 focus:border-[#1677FF] focus:outline-none focus:ring-2 focus:ring-[#1677FF]/25';
const primary = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#0958D9] px-4 text-sm font-bold text-white hover:bg-[#003EB3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF] focus-visible:ring-offset-2';
const secondary = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1677FF]';

/** One row of the settings list. Opens in place (a native disclosure, so keyboard and screen readers just work). */
function Row({ icon: Icon, title, sub, children }: { icon: typeof User; title: string; sub: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <details open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)} className="group border-b border-slate-100 last:border-b-0">
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3.5 px-4 py-3 focus:outline-none focus-visible:bg-blue-50 [&::-webkit-details-marker]:hidden">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0958D9]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold text-slate-900">{title}</span>
          <span className="block truncate text-xs text-slate-600">{sub}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
      </summary>
      {open && <div className="space-y-3 px-4 pb-4">{children}</div>}
    </details>
  );
}

export function ProfileSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const family = useFamily();
  const [tgChatId, setTgChatId] = useState(() => localStorage.getItem('floodway_tg_chat_id') || '');
  const [tgStatus, setTgStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [operatorToken, setOperatorToken] = useState('');
  const [operatorSet, setOperatorSet] = useState(hasWriteToken());

  const [contacts, setContacts] = useState([
    { id: 'c1', name: 'Emak (Mother)', phone: '+60 12-987 6543' },
    { id: 'c2', name: 'Abang Ali (Brother)', phone: '+60 19-321 0987' },
  ]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const saveTelegram = () => {
    try {
      localStorage.setItem('floodway_tg_chat_id', tgChatId.trim());
      setTgStatus({ ok: true, text: 'Saved in this browser.' });
    } catch {
      setTgStatus({ ok: false, text: 'This browser blocks storage, so the chat ID could not be saved.' });
    }
  };

  const testTelegram = async () => {
    setTgStatus({ ok: true, text: 'Sending…' });
    const res = await sendTelegramMessage('Test alert from the FloodWay demo.', tgChatId.trim() || undefined);
    setTgStatus({ ok: res.success, text: res.success ? 'Delivered by the FloodWay bot.' : res.error || 'Not delivered.' });
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    setContacts([...contacts, { id: `c-${Date.now()}`, name: newName.trim(), phone: newPhone.trim() }]);
    setNewName('');
    setNewPhone('');
  };

  const name = user?.name || 'Luqman Nurhakim';
  const members = circleMembers({ ...family, circleId: 'family' }).filter((m) => !m.isYou);

  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <div className="mx-auto w-full min-w-0 max-w-4xl space-y-5 p-4 md:p-6">
      <h1 className="font-heading text-[28px]/9 font-bold text-slate-900 md:text-3xl/10">Profile</h1>

      <div className="space-y-5 lg:grid lg:grid-cols-12 lg:items-start lg:gap-6 lg:space-y-0">
        <section className={`${card} flex flex-col items-center p-6 text-center lg:col-span-5 lg:sticky lg:top-20`} aria-label="Your account">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#4096FF] to-[#0958D9] font-heading text-3xl font-extrabold text-white shadow-lg shadow-blue-900/25 ring-4 ring-blue-100">
            {!avatarFailed ? (
              <img
                src="/media/avatars/avatar-you.jpg"
                alt={name}
                className="h-full w-full object-cover"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <span>{name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}</span>
            )}
          </div>
          <h2 className="mt-3 font-heading text-xl font-extrabold text-slate-900">{name}</h2>
          <p className="text-sm text-slate-600">{user?.email || 'luqman@floodway.my'}</p>
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#0958D9]">
            {user?.isDemo !== false ? 'Demo account' : 'Signed in on this device'}
          </span>
          <div className="mt-4 flex -space-x-3" aria-label={`${members.length} people in your family circle`}>
            {members.map((m) => (
              <Avatar key={m.id} member={m} size="md" />
            ))}
          </div>
        </section>

        <section className={`${card} overflow-hidden lg:col-span-7`} aria-label="Settings">
        <Row icon={User} title="Personal information" sub={`${name} · ${user?.phone || '+60 12-345 6789'}`}>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-semibold text-slate-500">Name</dt><dd className="font-bold text-slate-900">{name}</dd></div>
            <div className="rounded-xl bg-slate-50 p-3"><dt className="text-xs font-semibold text-slate-500">Phone</dt><dd className="font-bold text-slate-900">{user?.phone || '+60 12-345 6789'}</dd></div>
            <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2"><dt className="text-xs font-semibold text-slate-500">Email</dt><dd className="break-all font-bold text-slate-900">{user?.email || 'luqman@floodway.my'}</dd></div>
          </dl>
          <p className="text-xs text-slate-600">Kept in this browser only. The demo has no account server.</p>
        </Row>

        <Row icon={MapPinned} title="Family circle and location" sub={family.sharing ? `Sharing with ${family.circles.length} circles` : 'Sharing paused'}>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-3.5">
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-slate-900">Share my location with my circles</span>
              <span className="block text-xs text-slate-600">{family.sharing ? 'Your circles see where you are on the map.' : 'Paused. They see your last check-in only.'}</span>
            </span>
            <input type="checkbox" className="h-6 w-6 accent-[#0958D9]" checked={family.sharing} onChange={(e) => familyActions.setSharing(e.target.checked)} />
          </label>
          <ul className="space-y-1.5">
            {family.circles.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm">
                <span className="font-bold text-slate-900">{c.name}</span>
                <span className="text-xs text-slate-600">{c.memberIds.length} people · demo</span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => navigate('/map')} className={primary}>
            <Users className="h-4 w-4" aria-hidden="true" /> Open the family map
          </button>
        </Row>

        <Row icon={Phone} title="Emergency contacts" sub={`${contacts.length} contacts`}>
          <ul className="space-y-2">
            {contacts.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-bold text-slate-900">{c.name}</span>
                  <span className="text-slate-600">{c.phone}</span>
                </span>
                <button type="button" onClick={() => setContacts(contacts.filter((x) => x.id !== c.id))} aria-label={`Remove ${c.name}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400">
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={addContact} className="flex flex-col gap-2 sm:flex-row">
            <input type="text" placeholder="Name and relation" aria-label="Contact name and relation" value={newName} onChange={(e) => setNewName(e.target.value)} className={field} />
            <input type="tel" placeholder="Phone" aria-label="Contact phone number" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className={field} />
            <button type="submit" className={`${primary} shrink-0`}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add
            </button>
          </form>
        </Row>

        <Row icon={Send} title="Telegram alerts" sub={tgChatId ? `Chat ${tgChatId}` : 'SOS and check-ins to a family group'}>
          <p className="text-sm/5 text-slate-700">The chat or channel that gets SOS and check-in messages. The bot token stays on the FloodWay server and never reaches your browser.</p>
          <label htmlFor="tg-chat" className="sr-only">Telegram chat or channel ID</label>
          <input id="tg-chat" type="text" placeholder="@your_channel or -10012345678 (optional)" value={tgChatId} onChange={(e) => setTgChatId(e.target.value)} className={`${field} font-mono`} />
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={saveTelegram} className={primary}>
              <Save className="h-4 w-4" aria-hidden="true" /> Save
            </button>
            <button type="button" onClick={testTelegram} className={secondary}>Send a test</button>
          </div>
          {tgStatus && (
            <p role="status" className={`flex items-center gap-1.5 text-sm font-semibold ${tgStatus.ok ? 'text-emerald-700' : 'text-amber-800'}`}>
              {tgStatus.ok && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />} {tgStatus.text}
            </p>
          )}
        </Row>

        <Row icon={KeyRound} title="Operator access" sub={operatorSet ? 'A token is set for this tab' : 'Only for protected servers'}>
          <p className="text-sm/5 text-slate-700">
            Needed only if this server protects changes (cameras, barriers, Telegram alerts, the AI photo check). The token is kept in this tab's memory and is cleared on reload. It is only sent to this server.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="operator-token">Operator token</label>
            <input id="operator-token" type="password" autoComplete="off" placeholder="Operator token" value={operatorToken} onChange={(e) => setOperatorToken(e.target.value)} className={`${field} font-mono`} />
            <button type="button" onClick={() => { setWriteToken(operatorToken); setOperatorSet(hasWriteToken()); setOperatorToken(''); }} className={`${primary} shrink-0`}>Use token</button>
            <button type="button" onClick={() => { setWriteToken(''); setOperatorSet(false); setOperatorToken(''); }} className={`${secondary} shrink-0`}>Clear</button>
          </div>
          <p role="status" className="text-sm font-semibold text-slate-800">{operatorSet ? 'A token is set for this tab.' : 'No token set.'}</p>
        </Row>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="flex min-h-16 w-full items-center gap-3.5 px-4 text-left focus:outline-none focus-visible:bg-red-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-700">
            <LogOut className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="font-bold text-red-700">Log out</span>
        </button>
      </section>
      </div>
    </div>
  );
}
