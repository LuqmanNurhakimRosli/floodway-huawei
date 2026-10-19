import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { color } from '../../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
// the tab bar passes a ColorValue; on Android it is always a colour string
const icon = (name: IconName) => ({ color: c, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={String(c)} size={size} />;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.blueDark,
        tabBarInactiveTintColor: color.faint,
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
        tabBarStyle: { minHeight: 64, paddingTop: 6 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="map" options={{ title: 'Map', tabBarIcon: icon('map') }} />
      <Tabs.Screen name="family" options={{ title: 'Family', tabBarIcon: icon('people') }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts', tabBarIcon: icon('notifications') }} />
      <Tabs.Screen name="guide" options={{ title: 'Guide', tabBarIcon: icon('book') }} />
    </Tabs>
  );
}
