import { Stack } from '@mui/material';
import { PageHeading } from '../components/molecules/PageHeading';
import { NotificationFeed } from '../components/organisms/NotificationFeed';
import type { Notification } from '../types/banking';

export function NotificationsPage({ notifications }: { notifications: Notification[] }) {
  return <Stack spacing={2}><PageHeading eyebrow="Centro de actividad" title="Notificaciones" description="Consulta los avisos de tu cuenta." /><NotificationFeed notifications={notifications} /></Stack>;
}
