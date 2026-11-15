import { useEffect, useState } from 'react';
import { RefreshControl, Text } from 'react-native';
import { Card, colors, ListRow, LoadingState, Message, Page, PrimaryButton } from '@/components/ui';
import { useBankingData } from '@/hooks/useBankingData';
import { requestDeviceNotifications, scheduleDeviceNotificationCheck } from '@/services/deviceNotifications';

export default function NotificationsScreen() {
  const { data, loading, error, refresh } = useBankingData();
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [localTestScheduled, setLocalTestScheduled] = useState(false);

  useEffect(() => {
    let mounted = true;
    let received: { remove: () => void } | undefined;
    let response: { remove: () => void } | undefined;

    void import('expo-notifications').then(Notifications => {
      if (!mounted) return;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });

      return Notifications.getPermissionsAsync().then(permission => {
        if (!mounted) return;
        setPermissionGranted(permission.granted);
        received = Notifications.addNotificationReceivedListener(() => {
          if (mounted) {
            setPermissionError(null);
            void refresh();
          }
        });
        response = Notifications.addNotificationResponseReceivedListener(() => {
          if (mounted) void refresh();
        });
      });
    }).catch(() => {
      if (mounted) {
        setPermissionGranted(false);
        setPermissionError('Las notificaciones del dispositivo no están disponibles en este entorno.');
      }
    });

    return () => {
      mounted = false;
      received?.remove();
      response?.remove();
    };
  }, [refresh]);

  const enableAndCheck = async () => {
    setChecking(true);
    setPermissionError(null);
    setLocalTestScheduled(false);
    try {
      const granted = await requestDeviceNotifications();
      setPermissionGranted(granted);
      if (!granted) {
        setPermissionError('El permiso está desactivado. Puedes habilitarlo en los ajustes del teléfono.');
        return;
      }
      await scheduleDeviceNotificationCheck();
      setLocalTestScheduled(true);
    } catch (cause) {
      if (__DEV__) console.error('Device notification setup failed:', cause);
      const details = cause instanceof Error ? cause.message : 'Error desconocido.';
      setPermissionError(__DEV__
        ? `No se pudieron activar las notificaciones en este dispositivo: ${details}`
        : 'No se pudieron activar las notificaciones en este dispositivo.');
    } finally {
      setChecking(false);
    }
  };

  return <Page title="Avisos" subtitle="Notificaciones de tu cuenta."
    refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={colors.blue} />}>
    {error ? <Message tone="error">{error}</Message> : null}
    {loading && !data ? <LoadingState /> : null}
    <Card title="Notificaciones en el teléfono">
      <Text style={{ color: colors.ink, lineHeight: 21 }}>
        Estado del permiso: {permissionGranted === null ? 'consultando' : permissionGranted ? 'activado' : 'desactivado'}.
      </Text>
      <Text style={{ color: colors.muted, lineHeight: 20 }}>
        Los avisos remotos de transferencias requieren configurar el servicio de notificaciones del banco. Este botón comprueba la entrega local del sistema operativo.
      </Text>
      {permissionError ? <Message tone="error">{permissionError}</Message> : null}
      {localTestScheduled ? <Message tone="success">Se programó un aviso local. Las notificaciones remotas todavía requieren configuración del banco.</Message> : null}
      <PrimaryButton title="Permitir y probar aviso" onPress={() => void enableAndCheck()} loading={checking} />
    </Card>
    {data ? <Card title="Actividad de cuenta">
      {data.notifications.map(item => <ListRow key={item.id} title={item.title} detail={`${item.message} · ${new Date(item.createdAt).toLocaleString('es-EC')}`} status={item.isRead ? 'Leída' : 'Nueva'} />)}
      {data.notifications.length === 0 ? <Text style={{ color: colors.muted }}>No tienes avisos por ahora.</Text> : null}
    </Card> : null}
  </Page>;
}
