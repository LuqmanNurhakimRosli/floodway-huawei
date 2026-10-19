// Alert notifications while the app is open. The app checks the camera alerts every minute while it is in use and
// shows a local notification for each new WARNING or DANGER. Push notifications that reach a closed app need a push
// service (Firebase Cloud Messaging credentials) that this build does not have, and the app says so in Alerts.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { isAlertLevel, type AlertEvent } from '../shared';

const SEEN_KEY = 'floodway.alerts.seen';
const ON_KEY = 'floodway.alerts.notify';
export type NotifyPermission = 'granted' | 'denied' | 'undetermined';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function notifyPermission(): Promise<NotifyPermission> {
  try {
    const p = await Notifications.getPermissionsAsync();
    return p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
  } catch {
    return 'denied';
  }
}

/** Asks for permission (shows the system prompt) and creates the Android channel. */
export async function enableNotifications(): Promise<NotifyPermission> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('flood-alerts', { name: 'Flood alerts', importance: Notifications.AndroidImportance.HIGH });
  }
  const p = await Notifications.requestPermissionsAsync();
  const state: NotifyPermission = p.granted ? 'granted' : p.canAskAgain ? 'undetermined' : 'denied';
  await AsyncStorage.setItem(ON_KEY, state === 'granted' ? '1' : '0');
  return state;
}

export async function notificationsOn(): Promise<boolean> {
  return (await AsyncStorage.getItem(ON_KEY)) === '1' && (await notifyPermission()) === 'granted';
}

export async function turnOffNotifications() {
  await AsyncStorage.setItem(ON_KEY, '0');
}

/** Alerts not yet notified, WARNING or DANGER only, oldest first. Pure, for tests. */
export function newAlerts(alerts: AlertEvent[], seen: Set<string>): AlertEvent[] {
  return alerts.filter((a) => isAlertLevel(a.level) && !seen.has(a.id)).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

/** Shows a notification for each new alert and remembers what was shown. The first run only records, so opening the
 *  app does not replay old alerts. Returns how many notifications were handed to the system (not a delivery receipt). */
export async function notifyNewAlerts(alerts: AlertEvent[]): Promise<number> {
  const raw = await AsyncStorage.getItem(SEEN_KEY);
  const seen = new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  const fresh = raw ? newAlerts(alerts, seen) : [];
  alerts.forEach((a) => seen.add(a.id));
  await AsyncStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-300)));
  if (!fresh.length || !(await notificationsOn())) return 0;
  for (const a of fresh) {
    await Notifications.scheduleNotificationAsync({
      content: { title: `${a.level === 'DANGER' ? 'Danger' : 'Warning'}: ${a.camera_name}`, body: a.message, data: { url: 'floodway://alerts' } },
      trigger: null,
    });
  }
  return fresh.length;
}
