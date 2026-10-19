import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DataProvider } from '../lib/data';
import { LocationProvider } from '../lib/location';
import { color } from '../theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <LocationProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerTintColor: color.blueDark, contentStyle: { backgroundColor: color.page } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
        </LocationProvider>
      </DataProvider>
    </SafeAreaProvider>
  );
}
