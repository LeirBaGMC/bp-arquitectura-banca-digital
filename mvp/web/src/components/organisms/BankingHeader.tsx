import { AppBar, Avatar, Badge, Breadcrumbs, IconButton, Stack, Toolbar, Tooltip, Typography } from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import type { PageKey } from '../../types/navigation';

const titles: Record<PageKey, string> = { inicio: 'Resumen', movimientos: 'Movimientos', transferir: 'Transferir', notificaciones: 'Notificaciones', configuracion: 'Configuración' };

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase();
}

export function BankingHeader({ current, notifications, customerName, onMenu, onNotifications, onSignOut }: { current: PageKey; notifications: number; customerName: string; onMenu: () => void; onNotifications: () => void; onSignOut: () => void }) {
  return <AppBar color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'rgba(255,255,255,.92)', backdropFilter: 'blur(10px)', position: 'sticky' }}>
    <Toolbar sx={{ minHeight: '72px !important', gap: 1.5 }}>
      <IconButton onClick={onMenu} aria-label="Abrir menú" sx={{ display: { md: 'none' }, color: 'primary.dark' }}><MenuRoundedIcon /></IconButton>
      <Breadcrumbs separator="/" sx={{ flex: 1 }}><Typography variant="body2" color="text.secondary">Banca digital</Typography><Typography variant="body2" color="text.primary"  sx={{ fontWeight: 700 }}>{titles[current]}</Typography></Breadcrumbs>
      <Stack direction="row" spacing={{ xs: 1, sm: 2.5 }} sx={{ alignItems: 'center' }}>
        <IconButton aria-label="Ver notificaciones" onClick={onNotifications}><Badge badgeContent={notifications} color="warning" max={9}><NotificationsNoneRoundedIcon /></Badge></IconButton>
        <Tooltip title="Cerrar sesión"><IconButton aria-label="Cerrar sesión" onClick={onSignOut}><LogoutRoundedIcon /></IconButton></Tooltip>
        <Avatar aria-label={customerName} sx={{ width: 34, height: 34, bgcolor: '#e5eff7', color: 'primary.dark', fontSize: 12, fontWeight: 700 }}>{initials(customerName)}</Avatar>
      </Stack>
    </Toolbar>
  </AppBar>;
}
