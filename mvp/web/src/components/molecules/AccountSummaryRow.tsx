import { Avatar, Box, Stack, Typography } from '@mui/material';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import type { Account } from '../../types/banking';
import { money } from '../../utils/format';

export function AccountSummaryRow({ account }: { account: Account }) {
  return <Stack direction="row"  spacing={1.5} sx={({...{ py: 1.75, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }, alignItems: "center"})}>
    <Avatar variant="rounded" sx={{ bgcolor: 'primary.light', color: 'primary.main' }}><AccountBalanceWalletOutlinedIcon fontSize="small" /></Avatar>
    <Box sx={{ minWidth: 0, flex: 1 }}><Typography  variant="body2" noWrap sx={{ fontWeight: 700 }}>{account.alias}</Typography><Typography variant="caption" color="text.secondary">{account.kind} · {account.number}</Typography></Box>
    <Box sx={{ textAlign: 'right' }}><Typography variant="body2"  sx={{ fontWeight: 700 }}>{money(account.balance)}</Typography><Typography variant="caption" color="text.secondary">Disponible</Typography></Box>
  </Stack>;
}
