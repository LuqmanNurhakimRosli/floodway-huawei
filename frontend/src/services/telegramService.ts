// Telegram alerts. The browser NEVER holds a bot token: every message goes to the FloodWay backend
// (POST /api/v1/alerts/telegram), which sends it with a server-side token. Do not add VITE_ secrets here.
import { API_BASE } from './vision/config';
import { authHeaders } from './auth';

export const TELEGRAM_CONFIG = {
  BOT_USERNAME: (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME || 'floodway_bot',
  BOT_URL: 'https://t.me/floodway_bot',
  STORAGE_CHAT_KEY: 'floodway_tg_chat_id',
};

export type TelegramResult = { success: boolean; simulated?: boolean; error?: string };

/**
 * Sends a message through the backend. `success` is true only when Telegram actually delivered it.
 * When Telegram is not configured on the server the result is `simulated: true` and nothing was sent.
 */
export async function sendTelegramMessage(text: string, customChatId?: string): Promise<TelegramResult> {
  const chatId = (customChatId || localStorage.getItem(TELEGRAM_CONFIG.STORAGE_CHAT_KEY) || '').trim();
  try {
    const res = await fetch(`${API_BASE}/api/v1/alerts/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(chatId ? { text, chat_id: chatId } : { text }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.status === 429) return { success: false, error: 'Too many alerts in a short time. Try again in a minute.' };
    if (res.status === 401) return { success: false, error: 'Alerts are protected on this server. Enter the operator token under Profile.' };
    if (res.status === 422) return { success: false, error: 'The chat ID is not valid. Use @channelname or a numeric chat ID.' };
    if (!res.ok) return { success: false, error: `The server answered ${res.status}.` };
    const body = (await res.json()) as { sent: boolean; simulated: boolean; detail: string };
    return body.sent ? { success: true } : { success: false, simulated: true, error: body.detail };
  } catch {
    return { success: false, error: 'Could not reach the FloodWay server.' };
  }
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Message templates state only what the app knows. No invented actions ("electrical cut-off confirmed"),
// no claimed registrations, no claimed verification.

/** Emergency SOS, sent when the user taps 1-tap SOS in the demo. */
export async function dispatchEmergencySosAlert(payload: {
  userName: string;
  phone: string;
  lat: number;
  lon: number;
  waterDepthCm: number;
  shelterName: string;
}): Promise<TelegramResult> {
  const mapLink = `https://maps.google.com/?q=${payload.lat.toFixed(5)},${payload.lon.toFixed(5)}`;
  const message =
    `🚨 <b>FLOODWAY DEMO · FLOOD ALERT</b>\n\n` +
    `<b>Status:</b> citizen-reported flooding\n` +
    `👤 <b>Citizen:</b> ${escapeHtml(payload.userName)} (${escapeHtml(payload.phone)})\n` +
    `🌊 <b>Water depth:</b> ${payload.waterDepthCm} cm (as reported by the user)\n` +
    `🏛 <b>Designated refuge:</b> ${escapeHtml(payload.shelterName)}\n` +
    `📍 <b>Position:</b> <a href="${mapLink}">${payload.lat.toFixed(4)}, ${payload.lon.toFixed(4)}</a>\n\n` +
    `<i>Demo message sent by the FloodWay app. An arrival confirmation follows when the user reaches the shelter on the map.</i>`;
  return sendTelegramMessage(message);
}

/** Shelter arrival check-in, sent when the user reaches the shelter on the demo map. */
export async function dispatchArrivalCheckin(payload: {
  userName: string;
  shelterName: string;
  dateStr?: string;
  timeStr?: string;
}): Promise<TelegramResult> {
  const dateText =
    payload.dateStr || new Date().toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeText = payload.timeStr || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const message =
    `✅ <b>FLOODWAY DEMO · SHELTER ARRIVAL</b>\n\n` +
    `👤 <b>Evacuee:</b> ${escapeHtml(payload.userName)}\n` +
    `🏛 <b>Destination:</b> <b>${escapeHtml(payload.shelterName)}</b>\n` +
    `📅 <b>Date:</b> ${escapeHtml(dateText)}\n` +
    `🕒 <b>Time:</b> ${escapeHtml(timeText)}\n` +
    `🛡 <b>Check-in:</b> reached the shelter on the demo map (simulated position).\n\n` +
    `<i>Demo message. This is not a registration with any relief agency.</i>`;
  return sendTelegramMessage(message);
}

/** Citizen flood report. Sent as unverified: the app does not verify reports. */
export async function dispatchFloodIncidentReportAlert(payload: {
  title: string;
  location: string;
  waterDepthCm: number;
  author: string;
  dateStr?: string;
  hasPhotoEvidence: boolean;
}): Promise<TelegramResult> {
  const dateText = payload.dateStr || new Date().toLocaleString('en-MY', { dateStyle: 'medium', timeStyle: 'short' });
  const message =
    `📢 <b>FLOODWAY DEMO · CITIZEN FLOOD REPORT</b>\n\n` +
    `⚠️ <b>Incident:</b> ${escapeHtml(payload.title)}\n` +
    `📍 <b>Location:</b> ${escapeHtml(payload.location)}\n` +
    `🌊 <b>Reported depth:</b> ${payload.waterDepthCm} cm\n` +
    `📸 <b>Photo:</b> ${payload.hasPhotoEvidence ? 'attached (not independently verified)' : 'none'}\n` +
    `👤 <b>Reported by:</b> ${escapeHtml(payload.author)} on ${escapeHtml(dateText)}\n\n` +
    `<i>Unverified citizen report from the FloodWay demo.</i>`;
  return sendTelegramMessage(message);
}
