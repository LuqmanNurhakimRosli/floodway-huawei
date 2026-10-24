// Server address, saved data and what is real in this app.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import Constants from 'expo-constants';
import { Body, Button, Card, H2, Screen, Small } from '../components/ui';
import { useData } from '../lib/data';
import { DEFAULT_SERVER, loadServerUrl, saveServerUrl } from '../lib/settings';
import { color, TOUCH } from '../theme';

export default function Settings() {
  const { refresh } = useData();
  const [url, setUrl] = useState('');
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    loadServerUrl().then(setUrl);
  }, []);

  const save = async () => {
    const ok = await saveServerUrl(url);
    setNote(ok ? 'Saved. Loading from the new server…' : 'Enter a full address starting with http:// or https://');
    if (ok) await refresh();
  };
  const clear = async () => {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('floodway.cache.'));
    await AsyncStorage.multiRemove(keys);
    setNote(`Removed ${keys.length} saved data sets. Contacts and the checklist are kept.`);
  };

  return (
    <Screen>
      <Card>
        <H2>FloodWay server</H2>
        <Small>Default for this build: {DEFAULT_SERVER}</Small>
        <TextInput style={st.input} value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" accessibilityLabel="Server address" />
        <Button label="Save and reload" onPress={save} />
        {note && <Text style={st.note} accessibilityLiveRegion="polite">{note}</Text>}
      </Card>
      <Card>
        <H2>Saved data</H2>
        <Body muted>The app keeps the last camera readings, alerts, relief centres and reports so you can see them offline, always marked with their age.</Body>
        <Button label="Remove saved data" kind="secondary" onPress={clear} />
      </Card>
      <Card tone="info">
        <H2>About this version</H2>
        <Body>The cameras in the demo are sample scenes. The relief centres are a demo list. The forecast on the web app is a rule-based estimate. None of this is an official warning.</Body>
        <Small>FloodWay {Constants.expoConfig?.version ?? ''} · Demo for the Huawei ICT Competition 2026–2027</Small>
      </Card>
    </Screen>
  );
}

const st = StyleSheet.create({
  input: { minHeight: TOUCH, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 14, paddingHorizontal: 14, fontSize: 16, backgroundColor: '#fff', color: color.ink },
  note: { fontSize: 15, color: color.ink },
});
