import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const colors = { navy: '#123a55', blue: '#1670b8', pale: '#eaf3fa', canvas: '#f4f7fa', ink: '#172b3d', muted: '#64798c', line: '#e0e8ef', green: '#168a72', white: '#ffffff', red: '#b42318' };

export function Page({ title, subtitle, children, refreshControl }: { title: string; subtitle?: string; children: ReactNode; refreshControl?: ReactNode }) {
  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" refreshControl={refreshControl as never}>
    <Text style={styles.eyebrow}>BP DIGITAL</Text><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}{children}
  </ScrollView></SafeAreaView>;
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return <View style={styles.card}>{title ? <Text style={styles.cardTitle}>{title}</Text> : null}{children}</View>;
}

export function Label({ children }: { children: ReactNode }) { return <Text style={styles.label}>{children}</Text>; }

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={styles.field}><Label>{label}</Label><TextInput placeholderTextColor={colors.muted} style={styles.input} {...props} /></View>;
}

export function PrimaryButton({ title, onPress, disabled, loading }: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled || loading} style={({ pressed }) => [styles.button, (disabled || loading) && styles.disabled, pressed && !disabled && styles.pressed]}>
    {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.buttonText}>{title}</Text>}
  </Pressable>;
}

export function Message({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' | 'success' }) {
  return <View style={[styles.message, tone === 'error' ? styles.error : tone === 'success' ? styles.success : null]}><Text style={styles.messageText}>{children}</Text></View>;
}

export function LoadingState({ label = 'Cargando información…' }: { label?: string }) {
  return <View style={styles.loading}><ActivityIndicator color={colors.blue} /><Text style={styles.muted}>{label}</Text></View>;
}

export function ListRow({ title, detail, amount, status }: { title: string; detail: string; amount?: string; status?: string }) {
  return <View style={styles.row}><View style={styles.rowIcon}><Text style={styles.rowIconText}>↗</Text></View><View style={styles.rowBody}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.muted}>{detail}</Text></View><View style={styles.rowRight}>{status ? <Text style={styles.status}>{status}</Text> : null}{amount ? <Text style={styles.rowAmount}>{amount}</Text> : null}</View></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas }, page: { padding: 20, paddingBottom: 36, gap: 14 },
  eyebrow: { color: colors.blue, fontWeight: '800', letterSpacing: 1.4, fontSize: 11, marginTop: 8 }, title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: '800' }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: -8, marginBottom: 6 },
  card: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 18, gap: 12, marginTop: 2 }, cardTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', marginBottom: 2 }, label: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  field: { gap: 7 }, input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, color: colors.ink, fontSize: 16, backgroundColor: colors.white },
  button: { minHeight: 50, backgroundColor: colors.blue, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }, buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' }, disabled: { opacity: 0.55 }, pressed: { opacity: 0.85 },
  message: { borderRadius: 12, padding: 14, backgroundColor: colors.pale }, error: { backgroundColor: '#fff0ee' }, success: { backgroundColor: '#eaf6f2' }, messageText: { color: colors.ink, fontSize: 14, lineHeight: 20 },
  loading: { padding: 28, alignItems: 'center', gap: 12 }, muted: { color: colors.muted, fontSize: 13 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }, rowIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }, rowIconText: { color: colors.blue, fontWeight: '800', fontSize: 18 }, rowBody: { flex: 1, gap: 3 }, rowTitle: { fontSize: 15, color: colors.ink, fontWeight: '700' }, rowRight: { alignItems: 'flex-end', gap: 5 }, status: { color: colors.green, fontSize: 11, fontWeight: '700' }, rowAmount: { color: colors.ink, fontWeight: '700', fontSize: 13 },
});

export const uiStyles = styles;
