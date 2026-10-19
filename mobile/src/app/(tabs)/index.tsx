// Home: where you are, the flood level around you and how fresh it is, your own risk, the nearest open relief centre,
// and the actions that matter. Nothing here is made up: with no server and no saved data, it says there is no data.
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, router } from 'expo-router';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Button, Card, H2, LevelBadge, Loading, Pill, Row, Screen, Small, Title } from '../../components/ui';
import { dataAgeText } from '../../lib/cache';
import { useData } from '../../lib/data';
import { useMyLocation } from '../../lib/location';
import { floodZones, myRisk } from '../../lib/zones';
import { allSampleCameras, fmtDistance, freshness, highestRisk, nearestOpenCentre, newestReadingAt, overallLevel } from '../../shared';
import { color, TOUCH } from '../../theme';

export default function Home() {
  const { cameras, shelters, reports, loading, refresh } = useData();
  const { loc, request } = useMyLocation();
  const cams = cameras.data ?? [];
  const level = cams.length ? overallLevel(cams) : null;
  const top = highestRisk(cams);
  const fresh = freshness(newestReadingAt(cams));
  const sample = cams.length > 0 && allSampleCameras(cams);
  const here = loc.lat !== null && loc.lon !== null ? { lat: loc.lat, lon: loc.lon } : null;
  const zones = floodZones(cams, reports.data ?? []);
  const risk = myRisk(here, zones);
  const centre = here ? nearestOpenCentre([here.lat, here.lon], shelters.data ?? []) : null;

  return (
    <Screen refreshing={loading} onRefresh={refresh}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Title>FloodWay</Title>
        <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push('/settings')} style={st.iconBtn}>
          <Ionicons name="settings-outline" size={24} color={color.ink} />
        </Pressable>
      </Row>

      {/* where you are */}
      <Card>
        <H2>Your location</H2>
        {here ? (
          <Body>
            Found, accurate to about {Math.round(loc.accuracyM ?? 0)} m{loc.at ? `, at ${new Date(loc.at).toLocaleTimeString()}` : ''}.
          </Body>
        ) : loc.status === 'denied' ? (
          <Body muted>Location is off for FloodWay. You can still see the map and the guide. To use it, allow location for FloodWay in your phone settings.</Body>
        ) : (
          <>
            <Body muted>FloodWay can use your location while it is open to show flood areas and relief centres near you. It stays on this phone.</Body>
            <Button label={loc.status === 'asking' ? 'Waiting…' : 'Use my location'} onPress={request} disabled={loc.status === 'asking'} />
          </>
        )}
      </Card>

      {/* the flood level */}
      <Card tone={level === 'DANGER' ? 'danger' : level === 'WARNING' ? 'warning' : undefined}>
        <Row style={{ justifyContent: 'space-between' }}>
          <H2>Flood level near the cameras</H2>
          {sample && <Pill text="Sample cameras" tone="demo" />}
        </Row>
        {cameras.data === null && loading ? (
          <Loading label="Checking the cameras…" />
        ) : cameras.data === null ? (
          <Body muted>No camera data. {cameras.error ?? ''} Pull down to try again.</Body>
        ) : (
          <>
            <LevelBadge level={level} big />
            {top?.reading && (
              <Body>
                Highest at {top.name}: water at {Math.round(top.reading.water_ratio * 100)}% of the bank.
              </Body>
            )}
            <Row>
              <Pill text={dataAgeText(cameras)} tone={cameras.live ? 'live' : 'stale'} />
              {cameras.live && fresh.state === 'stale' && <Pill text="Readings are old" tone="stale" />}
            </Row>
            {sample && <Small>These are sample camera scenes for the demo, not real camera footage.</Small>}
          </>
        )}
      </Card>

      {/* your own risk */}
      {risk && (
        <Card tone={risk.risk === 'flooded' ? 'danger' : risk.risk === 'near' ? 'warning' : 'info'}>
          <H2>{risk.risk === 'flooded' ? 'You are inside a flood area' : risk.risk === 'near' ? 'A flood area is close' : 'No flood area near you'}</H2>
          <Body>
            {risk.risk === 'flooded'
              ? 'Move to higher ground or a relief centre. Do not drive or walk through water.'
              : risk.risk === 'near'
                ? `The nearest flood area is about ${fmtDistance(risk.edgeM ?? 0)} away. Get ready to leave.`
                : 'Based on the cameras and verified reports FloodWay has. Keep checking during heavy rain.'}
          </Body>
          <Small>Not an official warning. Follow instructions from the authorities.</Small>
        </Card>
      )}

      {/* nearest centre */}
      <Card>
        <H2>Nearest open relief centre</H2>
        {!here ? (
          <Body muted>Turn on your location to find the nearest one, or open the map.</Body>
        ) : centre ? (
          <>
            <Body>
              {centre.centre.name.replace('Demo relief centre: ', '')}, {fmtDistance(centre.distanceM)} in a straight line.
            </Body>
            {!shelters.live && <Pill text={dataAgeText(shelters)} tone="stale" />}
            <Button
              label="Directions in my maps app"
              kind="secondary"
              onPress={() => Linking.openURL(`geo:${centre.centre.lat},${centre.centre.lon}?q=${centre.centre.lat},${centre.centre.lon}(${encodeURIComponent(centre.centre.name)})`)}
              accessibilityHint="Opens your maps app. Its route does not know where the floods are, so check the FloodWay map first."
            />
          </>
        ) : (
          <Body muted>{shelters.data ? 'No open relief centre in the list.' : 'No relief centre list yet. Pull down to try again.'}</Body>
        )}
      </Card>

      <View style={st.grid}>
        <Link href="/map" asChild><Pressable style={st.tile} accessibilityRole="button"><Text style={st.tileText}>Flood map</Text></Pressable></Link>
        <Link href="/guide" asChild><Pressable style={st.tile} accessibilityRole="button"><Text style={st.tileText}>What to do</Text></Pressable></Link>
        <Pressable style={[st.tile, { backgroundColor: color.red }]} accessibilityRole="button" accessibilityLabel="Call 999" onPress={() => Linking.openURL('tel:999')}>
          <Text style={[st.tileText, { color: '#fff' }]}>Call 999</Text>
        </Pressable>
        <Link href="/family" asChild><Pressable style={st.tile} accessibilityRole="button"><Text style={st.tileText}>Family and contacts</Text></Pressable></Link>
      </View>
      <Small>FloodWay helps you prepare and decide. It does not replace emergency services or official warnings.</Small>
    </Screen>
  );
}

const st = StyleSheet.create({
  iconBtn: { minWidth: TOUCH, minHeight: TOUCH, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { flexBasis: '47%', flexGrow: 1, minHeight: 72, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: color.line, alignItems: 'center', justifyContent: 'center', padding: 12 },
  tileText: { fontSize: 17, fontWeight: '800', color: color.ink, textAlign: 'center' },
});
