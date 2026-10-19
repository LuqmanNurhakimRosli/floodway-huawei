// Camera alerts from the server, newest first, and the notification setting. Notifications are local: the app checks
// for new alerts every minute while it is open. Alerts that reach a closed app need push credentials this build lacks.
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Button, Card, H2, LevelBadge, Loading, Pill, Row, Screen, Small, Title } from '../../components/ui';
import { dataAgeText } from '../../lib/cache';
import { useData } from '../../lib/data';
import { enableNotifications, notificationsOn, notifyPermission, turnOffNotifications, type NotifyPermission } from '../../lib/notify';
import { isSampleCamera } from '../../shared';
import { color } from '../../theme';

export default function Alerts() {
  const { alerts, cameras, loading, refresh } = useData();
  const [perm, setPerm] = useState<NotifyPermission>('undetermined');
  const [on, setOn] = useState(false);

  useEffect(() => {
    notifyPermission().then(setPerm);
    notificationsOn().then(setOn);
  }, []);

  const list = [...(alerts.data ?? [])].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const sampleIds = new Set((cameras.data ?? []).filter(isSampleCamera).map((c) => c.id));

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Title>Alerts</Title>

      <Card>
        <H2>Notify me</H2>
        <Body muted>While FloodWay is open, it checks every minute and notifies you of each new Warning or Danger.</Body>
        {perm === 'denied' ? (
          <Small>Notifications are blocked for FloodWay. Allow them in your phone settings to use this.</Small>
        ) : on ? (
          <Button label="Turn off notifications" kind="secondary" onPress={async () => { await turnOffNotifications(); setOn(false); }} />
        ) : (
          <Button label="Turn on notifications" onPress={async () => { const p = await enableNotifications(); setPerm(p); setOn(p === 'granted'); }} />
        )}
        <Small>Alerts when the app is closed need a push service that is not set up in this build.</Small>
      </Card>

      <Row>
        <Pill text={dataAgeText(alerts)} tone={alerts.live ? 'live' : 'stale'} />
      </Row>

      {alerts.data === null && loading ? (
        <Loading label="Loading alerts…" />
      ) : alerts.data === null ? (
        <Card><Body muted>No alert data. {alerts.error ?? ''} Pull down to try again.</Body></Card>
      ) : list.length === 0 ? (
        <Card><Body>No camera alerts right now.</Body></Card>
      ) : (
        list.map((a) => (
          <Card key={a.id} tone={a.level === 'DANGER' ? 'danger' : a.level === 'WARNING' ? 'warning' : undefined}>
            <Row style={{ justifyContent: 'space-between' }}>
              <LevelBadge level={a.level} />
              <Text style={st.time}>{new Date(a.timestamp).toLocaleString()}</Text>
            </Row>
            <Text style={st.cam}>{a.camera_name}</Text>
            <Body>{a.message}</Body>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {sampleIds.has(a.camera_id) && <Pill text="Sample camera" tone="demo" />}
              <Pill text={`Water at ${Math.round(a.water_ratio * 100)}% of bank`} />
            </View>
          </Card>
        ))
      )}
      <Small>Alerts come from FloodWay's camera readings. They are not official warnings.</Small>
    </Screen>
  );
}

const st = StyleSheet.create({
  time: { fontSize: 14, color: color.muted },
  cam: { fontSize: 17, fontWeight: '800', color: color.ink },
});
