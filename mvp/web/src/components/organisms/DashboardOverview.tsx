import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ActivityIcon from '@mui/icons-material/ShowChartRounded';
import type { BankingData } from '../../types/banking';
import type { PageKey } from '../../types/navigation';
import { money } from '../../utils/format';
import { SummaryMetricCard } from '../molecules/SummaryMetricCard';
import { AccountSummaryRow } from '../molecules/AccountSummaryRow';
import { MovementSummaryRow } from '../molecules/MovementSummaryRow';

export function DashboardOverview({ data, onNavigate }: { data: BankingData; onNavigate: (page: PageKey) => void }) {
  const total = data.accounts.reduce((sum, account) => sum + account.balance, 0);
  return <Stack spacing={2.5}>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', lg: '1.35fr 1fr 1fr' }, gap: 2 }}>
      <Card sx={{ gridColumn: { xs: '1 / -1', lg: 'auto' }, bgcolor: 'primary.dark', color: 'common.white', overflow: 'hidden', position: 'relative', minHeight: 162, '&:after': { content: '""', position: 'absolute', right: -45, top: -75, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,.15)', boxShadow: '0 0 0 24px rgba(255,255,255,.025),0 0 0 50px rgba(255,255,255,.025)' } }}>
        <CardContent sx={{ position: 'relative', zIndex: 1, p: 2.75 }}><Typography variant="body2" sx={{ color: 'rgba(255,255,255,.76)' }}>Saldo total disponible</Typography><Typography variant="h3" sx={{ fontWeight: 750, my: 1.5 }}>{money(total)}</Typography><Stack direction="row" spacing={.75}  sx={{ alignItems: "center" }}><Typography variant="caption" sx={{ color: 'rgba(255,255,255,.78)' }}>Resumen de tus cuentas</Typography></Stack></CardContent>
      </Card>
      <SummaryMetricCard icon={<AccountBalanceWalletOutlinedIcon />} label="Cuentas activas" value={String(data.accounts.length)} note="Productos vinculados al perfil" />
      <SummaryMetricCard icon={<ActivityIcon />} label="Movimientos recientes" value={String(data.movements.length)} note="Últimos movimientos de tus cuentas" />
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.4fr 1fr' }, gap: 2 }}>
      <Card><CardContent sx={{ p: 2.5 }}><Stack direction="row"   sx={({...{ mb: 1 }, justifyContent: "space-between", alignItems: "center"})}><Typography variant="h6"   sx={{ fontSize: 17, fontWeight: 700 }}>Mis cuentas</Typography><Button size="small" onClick={() => onNavigate('movimientos')}>Ver actividad</Button></Stack>{data.accounts.map(account => <AccountSummaryRow key={account.id} account={account} />)}</CardContent></Card>
      <Stack spacing={2}>
        <Card><CardContent sx={{ p: 2.5 }}><Stack direction="row"   sx={({...{ mb: 1 }, justifyContent: "space-between", alignItems: "center"})}><Typography variant="h6"   sx={{ fontSize: 17, fontWeight: 700 }}>Actividad reciente</Typography><Button size="small" onClick={() => onNavigate('movimientos')}>Ver todo</Button></Stack>{data.movements.length ? data.movements.slice(0, 4).map(movement => <MovementSummaryRow key={movement.id} movement={movement} />) : <Typography color="text.secondary" variant="body2" sx={{ py: 3, textAlign: 'center' }}>Todavía no hay movimientos.</Typography>}</CardContent></Card>
      </Stack>
    </Box>
  </Stack>;
}
