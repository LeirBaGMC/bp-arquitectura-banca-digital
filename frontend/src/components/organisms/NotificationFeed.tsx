import { Avatar, Card, CardContent, List, ListItem, ListItemAvatar, ListItemText, Stack, Typography } from '@mui/material';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import type { Notification } from '../../types/banking';
import { dateText } from '../../utils/format';
import { StatusBadge } from '../atoms/StatusBadge';

export function NotificationFeed({ notifications }: { notifications: Notification[] }) {
  return <Card><CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
    {notifications.length ? <List disablePadding>{notifications.map(notification => <ListItem key={notification.id} divider sx={{ px: 0, gap: 1 }}>
      <ListItemAvatar><Avatar variant="rounded" sx={{ bgcolor: 'primary.light', color: 'primary.main' }}><NotificationsNoneRoundedIcon fontSize="small" /></Avatar></ListItemAvatar>
      <ListItemText primary={<Typography variant="body2"  sx={{ fontWeight: 700 }}>{notification.title}</Typography>} secondary={<Stack component="span" spacing={.25}><Typography component="span" variant="body2" color="text.secondary">{notification.message}</Typography><Typography component="span" variant="caption" color="text.secondary">{dateText(notification.createdAt)}</Typography></Stack>} />
      <StatusBadge status={notification.isRead ? 'READ' : 'NEW'} label={notification.isRead ? 'Leída' : 'Nueva'} />
    </ListItem>)}</List> : <Typography sx={{ py: 5, textAlign: 'center' }} color="text.secondary">No tienes notificaciones.</Typography>}
  </CardContent></Card>;
}
