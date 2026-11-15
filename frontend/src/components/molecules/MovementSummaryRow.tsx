import { Avatar, Box, Stack, Typography } from '@mui/material';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import type { Movement } from '../../types/banking';
import { dateText, money } from '../../utils/format';

export function MovementSummaryRow({ movement }: { movement: Movement }) {
  const incoming = movement.direction === 'IN';
  return <Stack direction="row"  spacing={1.5} sx={({...{ py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 0 } }, alignItems: "center"})}>
    <Avatar variant="rounded" sx={{ bgcolor: incoming ? '#eaf6f1' : '#eff4f8', color: incoming ? 'success.main' : 'primary.main' }}>{incoming ? <ArrowDownwardRoundedIcon fontSize="small" /> : <ArrowUpwardRoundedIcon fontSize="small" />}</Avatar>
    <Box sx={{ flex: 1, minWidth: 0 }}><Typography  variant="body2" noWrap sx={{ fontWeight: 700 }}>{movement.title}</Typography><Typography variant="caption" color="text.secondary" noWrap  sx={{ display: "block" }}>{movement.detail} · {dateText(movement.createdAt)}</Typography></Box>
    <Typography variant="body2"  color={incoming ? 'success.main' : 'text.primary'} sx={{ fontWeight: 700 }}>{incoming ? '+' : '−'}{money(Math.abs(movement.amount))}</Typography>
  </Stack>;
}
