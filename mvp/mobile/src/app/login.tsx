import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, colors, Message, Page, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';

const domain = process.env.EXPO_PUBLIC_COGNITO_DOMAIN?.replace(/\/$/, '');
const clientId = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID;
const requiredScope = process.env.EXPO_PUBLIC_COGNITO_SCOPE || 'bp/banking-api';
const redirectUri = AuthSession.makeRedirectUri({ scheme: 'bpdigital', path: 'oauth2redirect' });

export default function LoginScreen() {
  const router = useRouter();
  const { activateLocalMode, completeCognitoLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const discovery = useMemo(() => domain ? {
    issuer: domain,
    authorizationEndpoint: `${domain}/oauth2/authorize`,
    tokenEndpoint: `${domain}/oauth2/token`,
  } : null, []);
  const [request, response, promptAsync] = AuthSession.useAuthRequest({
    clientId: clientId ?? '',
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    scopes: ['openid', 'email', requiredScope],
  extraParams: { acr_values: 'urn:cognito:loa:3' },
  }, discovery);

  useEffect(() => {
    if (response?.type === 'error') setError('No se pudo iniciar sesión. Revisa la configuración de Cognito.');
    if (response?.type !== 'success' || !response.params.code || !request?.codeVerifier || !discovery || !clientId) return;
    AuthSession.exchangeCodeAsync({
      clientId,
      code: response.params.code,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier },
    }, discovery).then(async (tokens) => {
      if (!tokens.accessToken) throw new Error('Cognito no devolvió un token de acceso.');
      await completeCognitoLogin(tokens.accessToken, tokens.expiresIn ?? 3600);
      router.replace('/(tabs)');
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'No se pudo completar el inicio de sesión.'));
  }, [response, request, discovery, router, completeCognitoLogin]);

  const localEnabled = __DEV__ && process.env.EXPO_PUBLIC_LOCAL_AUTH === 'true';
  return <Page title="Inicia sesión" subtitle="Accede a tus cuentas y operaciones.">
    <Card title="Acceso seguro">
      {error ? <Message tone="error">{error}</Message> : null}
      <Text style={styles.copy}>La aplicación usa OAuth 2.0 Authorization Code con PKCE. Cuando Cognito esté configurado, el proveedor gestionará la contraseña y los desafíos MFA de la cuenta.</Text>
      {domain && clientId ? <PrimaryButton title="Continuar con BP" onPress={() => { setError(null); void promptAsync(); }} disabled={!request} /> : <Message>Configura el dominio y el cliente de Cognito en el archivo .env de esta app.</Message>}
      {localEnabled ? <Pressable style={styles.localButton} onPress={() => { activateLocalMode(); router.replace('/(tabs)'); }}><Text style={styles.localText}>Entrar en desarrollo local</Text></Pressable> : null}
    </Card>
    <Message>Cognito verifica la passkey. El teléfono puede pedir huella, rostro o PIN; esos datos no salen del autenticador. La verificación KYC del alta es un proceso separado.</Message>
  </Page>;
}

const styles = StyleSheet.create({ copy: { color: colors.muted, lineHeight: 21, fontSize: 14 }, localButton: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }, localText: { color: colors.blue, fontWeight: '700' }, });
