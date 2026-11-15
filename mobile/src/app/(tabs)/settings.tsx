import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { Card, Message, Page, PrimaryButton } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';

export default function SettingsScreen() {
  const { localMode, signOut } = useAuth();
  const router = useRouter();

  return <Page title="Ajustes" subtitle="Seguridad y preferencias de acceso.">
    <Card title="Sesión">
      <Text>{localMode ? 'Sesión de desarrollo local' : 'Sesión protegida con Cognito'}</Text>
      <PrimaryButton title="Cerrar sesión" onPress={() => { void signOut().then(() => router.replace('/login')); }} />
    </Card>
    <Card title="Autenticación multifactor">
      <Text>{localMode
        ? 'El acceso local de desarrollo no usa MFA.'
        : 'Las operaciones sensibles requieren que Cognito confirme MFA. Completa el segundo factor que solicite el proveedor.'}</Text>
      <Message>La huella, el rostro y las passkeys todavía no están integrados en la app. La API valida MFA cuando Cognito está configurado; el reconocimiento facial del alta es un proceso de identidad separado.</Message>
    </Card>
    <Card title="Verificación de identidad">
      <Text>Continúa el alta de tu cuenta y consulta los requisitos de verificación.</Text>
      <PrimaryButton title="Continuar alta" onPress={() => router.push('/onboarding')} />
    </Card>
  </Page>;
}
