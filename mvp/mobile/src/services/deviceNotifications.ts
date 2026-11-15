export async function requestDeviceNotifications() {
  const Notifications = await import('expo-notifications');

  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  return permission.granted;
}

export async function scheduleDeviceNotificationCheck() {
  const Notifications = await import('expo-notifications');

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Avisos de cuenta',
      body: 'Las notificaciones de este dispositivo están activas.',
      data: { type: 'device-notification-check' },
    },
    trigger: null,
  });
}
