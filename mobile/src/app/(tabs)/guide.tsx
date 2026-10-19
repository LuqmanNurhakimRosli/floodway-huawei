// What to do before, during and after a flood, with a go-bag checklist. Built into the app: it works offline.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Body, Card, H2, Screen, Small, Title } from '../../components/ui';
import { EMERGENCY_NUMBERS, GO_BAG, GUIDE } from '../../data/guide';
import { color, TOUCH } from '../../theme';

const KEY = 'floodway.gobag';

export default function Guide() {
  const [checked, setChecked] = useState<string[]>([]);
  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => v && setChecked(JSON.parse(v))).catch(() => {});
  }, []);
  const toggle = (item: string) => {
    const next = checked.includes(item) ? checked.filter((i) => i !== item) : [...checked, item];
    setChecked(next);
    AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
  };

  return (
    <Screen>
      <Title>What to do</Title>
      <Small>Works without internet. General advice: follow instructions from the authorities in your area.</Small>

      <Card tone="danger">
        <H2>Emergency numbers</H2>
        {EMERGENCY_NUMBERS.map((n) => (
          <Pressable key={n.number} accessibilityRole="button" accessibilityLabel={`Call ${n.number}, ${n.label}`} onPress={() => Linking.openURL(`tel:${n.number}`)} style={st.call}>
            <Text style={st.callNum}>{n.number}</Text>
            <Text style={st.callLabel}>{n.label}</Text>
          </Pressable>
        ))}
      </Card>

      {GUIDE.map((g) => (
        <Card key={g.id}>
          <H2>{g.title}</H2>
          <Small>{g.when}</Small>
          {g.steps.map((s, i) => (
            <View key={i} style={st.step}>
              <Text style={st.num}>{i + 1}</Text>
              <View style={{ flex: 1 }}><Body>{s}</Body></View>
            </View>
          ))}
        </Card>
      ))}

      <Card>
        <H2>Go-bag checklist</H2>
        <Small>{checked.length} of {GO_BAG.length} packed. Saved on this phone.</Small>
        {GO_BAG.map((item) => {
          const on = checked.includes(item);
          return (
            <Pressable key={item} accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => toggle(item)} style={st.check}>
              <View style={[st.box, on && st.boxOn]}>{on && <Text style={st.tick}>✓</Text>}</View>
              <View style={{ flex: 1 }}><Body>{item}</Body></View>
            </Pressable>
          );
        })}
      </Card>
    </Screen>
  );
}

const st = StyleSheet.create({
  call: { minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  callNum: { fontSize: 26, fontWeight: '900', color: color.red, minWidth: 64 },
  callLabel: { flex: 1, fontSize: 16, color: color.ink },
  step: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: color.blueSoft, color: color.blueDark, textAlign: 'center', lineHeight: 26, fontWeight: '800', overflow: 'hidden' },
  check: { minHeight: TOUCH, flexDirection: 'row', alignItems: 'center', gap: 12 },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: '#94A3B8', alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: color.blueDark, borderColor: color.blueDark },
  tick: { color: '#fff', fontWeight: '900', fontSize: 16 },
});
