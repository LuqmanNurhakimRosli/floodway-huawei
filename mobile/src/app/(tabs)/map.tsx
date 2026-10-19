// The flood map: you, relief centres, camera flood zones, verified-report areas and the demo flood-prone areas.
// Tap a centre for distance and directions. The map opens offline (saved roads) and says when it is offline.
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type RefAttributes } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView as AnyWebView, type WebViewMessageEvent } from 'react-native-webview';
import type { AndroidWebViewProps } from 'react-native-webview/lib/WebViewTypes';
import { Button, Pill, Small } from '../../components/ui';
import { dataAgeText } from '../../lib/cache';
import { useData } from '../../lib/data';
import { useMyLocation } from '../../lib/location';
import { demoAreas, floodZones } from '../../lib/zones';
import { mapHtml, type MapPayload } from '../../map/mapHtml';
import { fmtDistance, nearestOpenCentre, type Shelter } from '../../shared';
import { color, TOUCH } from '../../theme';

const KL: [number, number] = [3.155, 101.69];

// The package types WebView with the iOS, Android and Windows props intersected, which collapses to `never` under
// strict TypeScript. This app ships for Android only, so it uses the Android props.
type MapHandle = { injectJavaScript(script: string): void };
const WebView = AnyWebView as unknown as ComponentType<AndroidWebViewProps & RefAttributes<MapHandle>>;

export default function MapScreen() {
  const { cameras, shelters, reports } = useData();
  const { loc } = useMyLocation();
  const web = useRef<MapHandle>(null);
  // counts 'ready' messages: the WebView can reload (Android may restart it), and each new page needs the data again
  const [ready, setReady] = useState(0);
  const [basemap, setBasemap] = useState<'loading' | 'street' | 'offline'>('loading');
  const [picked, setPicked] = useState<Shelter | null>(null);
  const [showDemo, setShowDemo] = useState(true);
  const html = useMemo(mapHtml, []);

  const here = loc.lat !== null && loc.lon !== null ? { lat: loc.lat, lon: loc.lon } : null;
  const centres = shelters.data ?? [];
  const payload = useMemo<MapPayload>(() => {
    const zones = [...floodZones(cameras.data ?? [], reports.data ?? []), ...(showDemo ? demoAreas() : [])];
    const fit: [number, number][] = here ? [[here.lat, here.lon]] : [KL];
    const near = here ? nearestOpenCentre([here.lat, here.lon], centres) : null;
    if (near) fit.push([near.centre.lat, near.centre.lon]);
    return { you: here, zones, fit, shelters: centres.map((s) => ({ id: s.id, name: s.name, lat: s.lat, lon: s.lon, status: s.status })) };
  }, [cameras.data, reports.data, centres, here?.lat, here?.lon, showDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ready) web.current?.injectJavaScript(`window.fw && window.fw.setData(${JSON.stringify(payload)}); true;`);
  }, [ready, payload]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const m = JSON.parse(e.nativeEvent.data) as { type: string; mode?: 'street' | 'offline'; id?: string };
        if (m.type === 'ready') setReady((n) => n + 1);
        else if (m.type === 'basemap' && m.mode) setBasemap(m.mode);
        else if (m.type === 'shelter') setPicked(centres.find((s) => s.id === m.id) ?? null);
      } catch {
        // ignore anything that is not ours
      }
    },
    [centres],
  );

  const dist = picked && here ? nearestOpenCentre([here.lat, here.lon], [{ ...picked, status: 'OPEN' }])?.distanceM : null;

  return (
    <SafeAreaView style={st.wrap} edges={['top', 'left', 'right']}>
      <View style={st.top}>
        <Text style={st.title} accessibilityRole="header">Flood map</Text>
        <View style={st.row}>
          {basemap === 'offline' && <Pill text="Offline map: saved roads only" tone="stale" />}
          {!cameras.live && cameras.at !== null && <Pill text={`Cameras: ${dataAgeText(cameras)}`} tone="stale" />}
          <Pressable accessibilityRole="switch" accessibilityState={{ checked: showDemo }} onPress={() => setShowDemo((v) => !v)} style={st.toggle}>
            <Text style={st.toggleText}>{showDemo ? 'Hide' : 'Show'} demo areas</Text>
          </Pressable>
        </View>
      </View>

      <WebView
        ref={web}
        source={{ html }}
        originWhitelist={['*']}
        onMessage={onMessage}
        javaScriptEnabled
        style={st.map}
        accessibilityLabel="Flood map. Relief centres are the coloured dots; tap one for details."
        onError={() => setBasemap('offline')}
      />

      <View style={st.legend}>
        <Small>Red or amber circles: camera zones and verified reports. Dashed blue: demo flood-prone areas (illustrative). Dots: relief centres (green open, amber full, red closed).</Small>
      </View>

      {picked && (
        <View style={st.sheet} accessibilityLiveRegion="polite">
          <Text style={st.sheetTitle}>{picked.name.replace('Demo relief centre: ', '')}</Text>
          <Small>
            {picked.status}
            {dist != null ? ` · ${fmtDistance(dist)} in a straight line` : ''}
            {` · ${picked.currentCapacity}/${picked.maxCapacity} people`}
          </Small>
          <Small>Demo relief centre list, not an official register.</Small>
          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Button
                label="Directions in my maps app"
                onPress={() => Linking.openURL(`geo:${picked.lat},${picked.lon}?q=${picked.lat},${picked.lon}(${encodeURIComponent(picked.name)})`)}
                accessibilityHint="Your maps app does not know where the floods are. Avoid the circles on this map."
              />
            </View>
            <Button label="Close" kind="secondary" onPress={() => setPicked(null)} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: color.page },
  top: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, gap: 6 },
  title: { fontSize: 24, fontWeight: '800', color: color.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  toggle: { minHeight: TOUCH, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: color.line, backgroundColor: '#fff' },
  toggleText: { fontSize: 14, fontWeight: '700', color: color.blueDark },
  map: { flex: 1 },
  legend: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff', borderTopWidth: 1, borderColor: color.line },
  sheet: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 8, elevation: 8, borderWidth: 1, borderColor: color.line },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: color.ink },
});
