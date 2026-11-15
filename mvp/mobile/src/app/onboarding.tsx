import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, colors, Message, Page, PrimaryButton } from '@/components/ui';
import { ApiError } from '@/services/bankingApi';
import { createFaceVerificationSession } from '@/services/onboardingApi';

export default function OnboardingScreen() {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      await createFaceVerificationSession(consent);
      setError('La respuesta del proveedor no contiene una sesión válida. Contacta al banco para continuar.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 503) {
        setError('La verificación facial todavía no está habilitada. No se tomó ni se envió una imagen.');
      } else {
        setError(cause instanceof Error ? cause.message : 'No se pudo iniciar la verificación.');
      }
    } finally {
      setLoading(false);
    }
  };

  return <Page title="Alta de cuenta" subtitle="Verifica tu identidad desde el celular.">
    <Card title="Verificación facial">
      <Text style={{ color: colors.ink, fontSize: 15, lineHeight: 22 }}>
        La verificación completa debe comprobar que estás presente y comparar tu rostro con un documento de identidad autorizado.
      </Text>
      <Message>
        La huella o el reconocimiento facial del teléfono solo desbloquean el dispositivo; no confirman tu identidad ante el banco. El proveedor de verificación aún no está conectado.
      </Message>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: consent }}
        onPress={() => setConsent(value => !value)}
        style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 }}>
        <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 1, borderColor: consent ? colors.blue : colors.muted, backgroundColor: consent ? colors.blue : colors.white, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.white, fontWeight: '800' }}>{consent ? '✓' : ''}</Text>
        </View>
        <Text style={{ flex: 1, color: colors.ink, fontSize: 14, lineHeight: 21 }}>
          Entiendo que la verificación puede tratar datos biométricos y acepto continuar cuando el servicio esté habilitado.
        </Text>
      </Pressable>
      {error ? <Message tone="error">{error}</Message> : null}
      <PrimaryButton title="Iniciar verificación" onPress={() => void startVerification()} disabled={!consent} loading={loading} />
      <PrimaryButton title="Volver a ajustes" onPress={() => router.back()} />
    </Card>
  </Page>;
}
