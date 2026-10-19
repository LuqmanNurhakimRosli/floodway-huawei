// Building blocks for every screen. Text sizes and touch targets follow the theme (48 dp minimum), and every block
// respects the phone's font size setting.
import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Level } from '../shared';
import { color, font, LEVEL_LABEL, levelColor, radius, space, TOUCH } from '../theme';

export function Screen({ children, refreshing, onRefresh }: { children: React.ReactNode; refreshing?: boolean; onRefresh?: () => void }) {
  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[color.blueDark]} /> : undefined}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style, tone }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tone?: 'danger' | 'warning' | 'info' }) {
  const bg = tone === 'danger' ? color.redSoft : tone === 'warning' ? color.amberSoft : tone === 'info' ? color.blueSoft : color.card;
  return <View style={[s.card, { backgroundColor: bg }, style]}>{children}</View>;
}

export const Title = ({ children }: { children: React.ReactNode }) => <Text style={s.title} accessibilityRole="header">{children}</Text>;
export const H2 = ({ children }: { children: React.ReactNode }) => <Text style={s.h2} accessibilityRole="header">{children}</Text>;
export const Body = ({ children, muted }: { children: React.ReactNode; muted?: boolean }) => <Text style={[s.body, muted && { color: color.muted }]}>{children}</Text>;
export const Small = ({ children }: { children: React.ReactNode }) => <Text style={s.small}>{children}</Text>;

export function Button({ label, onPress, kind = 'primary', disabled, accessibilityHint }: { label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; accessibilityHint?: string }) {
  const bg = kind === 'primary' ? color.blueDark : kind === 'danger' ? color.red : color.card;
  const fg = kind === 'secondary' ? color.ink : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [s.button, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }, kind === 'secondary' && s.buttonOutline]}
    >
      <Text style={[s.buttonText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Pill({ text, tone = 'neutral' }: { text: string; tone?: 'neutral' | 'live' | 'stale' | 'demo' }) {
  const map = { neutral: [color.muted, '#F1F5F9'], live: [color.green, color.greenSoft], stale: [color.amber, color.amberSoft], demo: [color.blueDeep, color.blueSoft] } as const;
  const [fg, bg] = map[tone];
  return (
    <View style={[s.pill, { backgroundColor: bg }]}>
      <Text style={[s.pillText, { color: fg }]}>{text}</Text>
    </View>
  );
}

/** A risk level shown with a word and a shape, never colour alone. */
export function LevelBadge({ level, big }: { level: Level | null; big?: boolean }) {
  const c = levelColor(level);
  const mark = level === 'DANGER' ? '▲▲' : level === 'WARNING' ? '▲' : level === 'ADVISORY' ? '●' : level === 'NORMAL' ? '✓' : '–';
  return (
    <View style={[s.badge, { backgroundColor: c.tint, borderColor: c.solid }, big && { paddingVertical: 10, paddingHorizontal: 16 }]} accessibilityLabel={`Flood level ${level ? LEVEL_LABEL[level] : 'unknown'}`}>
      <Text style={[s.badgeText, { color: c.text }, big && { fontSize: 22 }]}>
        {mark} {level ? LEVEL_LABEL[level] : 'No data'}
      </Text>
    </View>
  );
}

export const Loading = ({ label = 'Loading…' }: { label?: string }) => (
  <View style={s.loading} accessibilityLiveRegion="polite">
    <ActivityIndicator color={color.blueDark} />
    <Small>{label}</Small>
  </View>
);

export const Row = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => <View style={[s.row, style]}>{children}</View>;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.page },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xl * 2 },
  card: { borderRadius: radius.card, padding: space.lg, gap: space.sm, borderWidth: 1, borderColor: color.line },
  title: { fontSize: font.title, fontWeight: '800', color: color.ink },
  h2: { fontSize: font.h2, fontWeight: '800', color: color.ink },
  body: { fontSize: font.body, lineHeight: 23, color: color.ink },
  small: { fontSize: font.small, lineHeight: 20, color: color.muted },
  button: { minHeight: TOUCH, borderRadius: radius.button, paddingHorizontal: space.lg, alignItems: 'center', justifyContent: 'center' },
  buttonOutline: { borderWidth: 1.5, borderColor: '#CBD5E1' },
  buttonText: { fontSize: font.body, fontWeight: '700' },
  pill: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: font.tiny, fontWeight: '700' },
  badge: { alignSelf: 'flex-start', borderRadius: radius.pill, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: font.body, fontWeight: '800' },
  loading: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
});
