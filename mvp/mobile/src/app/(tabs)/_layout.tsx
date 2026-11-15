import { Redirect, Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { colors } from '@/components/ui';

function TabIcon({ glyph }: { glyph: string }) { return <Text style={{ color: colors.blue, fontSize: 18, fontWeight: '700' }}>{glyph}</Text>; }

export default function TabsLayout() {
  const { ready, authenticated } = useAuth();
  if (!ready) return null;
  if (!authenticated) return <Redirect href="/login" />;
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.blue, tabBarInactiveTintColor: colors.muted, tabBarStyle: { height: 64, paddingTop: 6, paddingBottom: 8, borderTopColor: colors.line, backgroundColor: colors.white }, tabBarLabelStyle: { fontSize: 10, fontWeight: '600' } }}>
    <Tabs.Screen name="index" options={{ title: 'Resumen', tabBarIcon: () => <TabIcon glyph="⌂" /> }} />
    <Tabs.Screen name="movements" options={{ title: 'Movimientos', tabBarIcon: () => <TabIcon glyph="↕" /> }} />
    <Tabs.Screen name="transfers" options={{ title: 'Transferir', tabBarIcon: () => <TabIcon glyph="⇄" /> }} />
    <Tabs.Screen name="notifications" options={{ title: 'Avisos', tabBarIcon: () => <TabIcon glyph="♧" /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Ajustes', tabBarIcon: () => <TabIcon glyph="⚙" /> }} />
  </Tabs>;
}
