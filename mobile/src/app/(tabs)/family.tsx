// Family and contacts. Live location sharing between family phones needs user accounts on the FloodWay server, which
// do not exist yet, so this screen does not pretend: it shows no other people. What works today, on this phone:
// emergency contacts, one-tap calls, and sending your position yourself through any messaging app.
import { useEffect, useState } from 'react';
import { Linking, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Body, Button, Card, H2, Row, Screen, Small, Title } from '../../components/ui';
import { loadContacts, saveContacts, validPhone, type Contact } from '../../lib/contacts';
import { useMyLocation } from '../../lib/location';
import { color, TOUCH } from '../../theme';

export default function Family() {
  const { loc, request, refresh } = useMyLocation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);

  useEffect(() => {
    loadContacts().then(setContacts);
  }, []);

  const add = async () => {
    if (!name.trim()) return setError('Enter a name.');
    if (!validPhone(phone)) return setError('Enter a phone number with at least 6 digits.');
    const next = [...contacts, { id: `${Date.now()}`, name: name.trim(), phone: phone.trim() }];
    setContacts(next);
    await saveContacts(next);
    setName('');
    setPhone('');
    setError(null);
  };
  const remove = async (id: string) => {
    const next = contacts.filter((c) => c.id !== id);
    setContacts(next);
    await saveContacts(next);
  };

  const sharePosition = async () => {
    if (loc.lat === null || loc.lon === null) return;
    const age = loc.at ? Math.round((Date.now() - loc.at) / 60000) : 0;
    const text = `My location from FloodWay (${age < 1 ? 'just now' : `${age} min ago`}): https://maps.google.com/?q=${loc.lat.toFixed(5)},${loc.lon.toFixed(5)}`;
    try {
      const r = await Share.share({ message: text });
      // the share sheet only tells us an app was picked, not that the message was delivered
      setShareNote(r.action === Share.sharedAction ? 'Handed to the app you picked. Check it was sent.' : null);
    } catch {
      setShareNote('Could not open the share menu.');
    }
  };

  return (
    <Screen>
      <Title>Family and contacts</Title>

      <Card>
        <H2>Send your location</H2>
        <Body muted>Send your position to family through WhatsApp, SMS or any app. You choose who gets it, each time.</Body>
        {loc.lat === null ? (
          loc.status === 'denied' ? (
            <Small>Location is off for FloodWay. Allow it in your phone settings to send your position.</Small>
          ) : (
            <Button label={loc.status === 'asking' ? 'Waiting…' : 'Use my location'} onPress={request} disabled={loc.status === 'asking'} />
          )
        ) : (
          <>
            <Button label="Send my location" onPress={sharePosition} />
            <Button label="Update my location" kind="secondary" onPress={refresh} />
            {loc.at && <Small>Position from {new Date(loc.at).toLocaleTimeString()}, accurate to about {Math.round(loc.accuracyM ?? 0)} m.</Small>}
          </>
        )}
        {shareNote && <Small>{shareNote}</Small>}
      </Card>

      <Card>
        <H2>Emergency contacts</H2>
        <Small>Saved on this phone only.</Small>
        {contacts.length === 0 && <Body muted>No contacts yet. Add the people you would call first.</Body>}
        {contacts.map((c) => (
          <View key={c.id} style={st.contact}>
            <View style={{ flex: 1 }}>
              <Text style={st.cName}>{c.name}</Text>
              <Text style={st.cPhone} selectable>{c.phone}</Text>
            </View>
            <Button label="Call" onPress={() => Linking.openURL(`tel:${c.phone.replace(/[^\d+]/g, '')}`)} />
            <Button label="Remove" kind="secondary" onPress={() => remove(c.id)} />
          </View>
        ))}
        <TextInput style={st.input} placeholder="Name, for example Mum" value={name} onChangeText={setName} accessibilityLabel="Contact name" />
        <TextInput style={st.input} placeholder="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" accessibilityLabel="Contact phone number" />
        {error && <Text style={st.error} accessibilityLiveRegion="assertive">{error}</Text>}
        <Button label="Add contact" onPress={add} />
      </Card>

      <Card tone="info">
        <H2>Live family map</H2>
        <Body>Seeing your family on a map needs every phone signed in to a FloodWay account. That part of the server is not built yet, so this app shows nobody else.</Body>
        <Small>When it is built, sharing will be opt-in for each person, show when each position was taken, and can be stopped at any time. FloodWay does not track your location in the background.</Small>
      </Card>
    </Screen>
  );
}

const st = StyleSheet.create({
  contact: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderTopWidth: 1, borderColor: color.line, flexWrap: 'wrap' },
  cName: { fontSize: 17, fontWeight: '700', color: color.ink },
  cPhone: { fontSize: 15, color: color.muted },
  input: { minHeight: TOUCH, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 14, paddingHorizontal: 14, fontSize: 16, backgroundColor: '#fff', color: color.ink },
  error: { color: color.red, fontSize: 15, fontWeight: '600' },
});
