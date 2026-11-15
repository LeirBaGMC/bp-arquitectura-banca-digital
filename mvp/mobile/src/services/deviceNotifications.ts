import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export async function requestDeviceNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('account-activity', {
      name: 'Actividad de cuenta',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 200],
      lightColor: '#1670b8',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission = current.granted ? current : await Notifications.requestPermissionsAsync();
  return permission.granted;
}

export async function scheduleDeviceNotificationCheck() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Avisos de cuenta',
      body: 'Las notificaciones de este dispositivo están activas.',
      data: { type: 'device-notification-check' },
    },
    trigger: null,
  });
}
