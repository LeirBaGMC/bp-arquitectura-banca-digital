import { Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { BrandMark } from '../atoms/BrandMark';
import type { PageKey } from '../../types/navigation';

const drawerWidth = 264;
const navigation: { key: PageKey; label: string; icon: React.ReactNode }[] = [
  { key: 'inicio', label: 'Resumen', icon: <AccountBalanceOutlinedIcon /> },
  { key: 'movimientos', label: 'Movimientos', icon: <AccountBalanceWalletOutlinedIcon /> },
  { key: 'transferir', label: 'Transferir', icon: <SwapHorizRoundedIcon /> },
  { key: 'notificaciones', label: 'Notificaciones', icon: <NotificationsNoneRoundedIcon /> },
];

type Props = { mobile: boolean; open: boolean; current: PageKey; customerName: string; onClose: () => void; onNavigate: (page: PageKey) => void };

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase();
}

export function BankingSidebar({ mobile, open, current, customerName, onClose, onNavigate }: Props) {
  const content = <Stack sx={{ height: '100%', p: 2.5 }}>
    <Stack direction="row" sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center' }}>
      <BrandMark />
      {mobile && <IconButton onClick={onClose} aria-label="Cerrar menú"><CloseRoundedIcon /></IconButton>}
    </Stack>
    <List disablePadding sx={{ display: 'grid', gap: .5 }}>
      {navigation.map(item => <ListItemButton key={item.key} aria-current={current === item.key ? 'page' : undefined} selected={current === item.key} onClick={() => onNavigate(item.key)} sx={{ minHeight: 46, borderRadius: 2, color: current === item.key ? 'primary.main' : 'text.secondary', '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.main' }, '&.Mui-selected:hover': { bgcolor: 'primary.light' } }}>
        <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>{item.icon}</ListItemIcon><ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 650, fontSize: 14 } } }} />
      </ListItemButton>)}
    </List>
    <Box sx={{ flex: 1 }} />
    <List disablePadding>
      <ListItemButton key="configuracion" aria-current={current === 'configuracion' ? 'page' : undefined} selected={current === 'configuracion'} onClick={() => onNavigate('configuracion')} sx={{ minHeight: 46, borderRadius: 2, color: current === 'configuracion' ? 'primary.main' : 'text.secondary', '&.Mui-selected': { bgcolor: 'primary.light', color: 'primary.main' }, '&.Mui-selected:hover': { bgcolor: 'primary.light' } }}>
        <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}><SettingsOutlinedIcon /></ListItemIcon>
        <ListItemText primary="Configuración" slotProps={{ primary: { sx: { fontWeight: 650, fontSize: 14 } } }} />
      </ListItemButton>
    </List>
    <Divider sx={{ mb: 2 }} />
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}><Box aria-hidden="true" sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#e5eff7', display: 'grid', placeItems: 'center', color: 'primary.dark', fontWeight: 700, fontSize: 12 }}>{initials(customerName)}</Box><Box><Typography variant="body2" sx={{ fontWeight: 700 }}>{customerName}</Typography><Typography variant="caption" color="text.secondary">Cliente personal</Typography></Box></Stack>
  </Stack>;

  return <Drawer variant={mobile ? 'temporary' : 'permanent'} open={mobile ? open : true} onClose={onClose} sx={{ width: mobile ? undefined : drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' } }}>
    {content}
  </Drawer>;
}
