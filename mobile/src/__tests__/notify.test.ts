import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { newAlerts, notifyNewAlerts } from '../lib/notify';
import type { AlertEvent } from '../shared';

const alert = (id: string, level: AlertEvent['level'], t: string): AlertEvent => ({
  id, camera_id: 'c', camera_name: 'Sample camera', level, water_ratio: 0.5, timestamp: t, message: 'm',
});

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.mocked(Notifications.scheduleNotificationAsync).mockClear();
});

it('newAlerts keeps unseen WARNING and DANGER, oldest first', () => {
  const list = [alert('b', 'DANGER', '2026-10-19T02:00:00Z'), alert('a', 'WARNING', '2026-10-19T01:00:00Z'), alert('n', 'NORMAL', '2026-10-19T03:00:00Z'), alert('s', 'DANGER', '2026-10-19T00:00:00Z')];
  expect(newAlerts(list, new Set(['s'])).map((a) => a.id)).toEqual(['a', 'b']);
});

it('the first run only records, later runs notify new alerts once', async () => {
  const old = alert('old', 'DANGER', '2026-10-19T01:00:00Z');
  expect(await notifyNewAlerts([old])).toBe(0);
  await AsyncStorage.setItem('floodway.alerts.notify', '1');
  const fresh = alert('new', 'WARNING', '2026-10-19T02:00:00Z');
  expect(await notifyNewAlerts([old, fresh])).toBe(1);
  expect(await notifyNewAlerts([old, fresh])).toBe(0);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
});

it('does not notify when the user has not turned notifications on', async () => {
  await notifyNewAlerts([]);
  expect(await notifyNewAlerts([alert('x', 'DANGER', '2026-10-19T01:00:00Z')])).toBe(0);
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});
