import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import type { Movement } from '../../types/banking';
import { dateText, money } from '../../utils/format';
import { StatusBadge } from '../atoms/StatusBadge';

export function MovementsTable({ movements }: { movements: Movement[] }) {
  if (movements.length === 0) return <Paper variant="outlined" sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>Todavía no hay movimientos.</Paper>;
  return <TableContainer component={Paper} variant="outlined"><Table aria-label="Movimientos de cuenta">
    <TableHead><TableRow sx={{ bgcolor: '#f8fafc' }}><TableCell>Movimiento</TableCell><TableCell>Cuenta</TableCell><TableCell>Fecha</TableCell><TableCell>Estado</TableCell><TableCell align="right">Importe</TableCell></TableRow></TableHead>
    <TableBody>{movements.map(m => <TableRow key={m.id} hover><TableCell><Typography variant="body2"  sx={{ fontWeight: 700 }}>{m.title}</Typography><Typography variant="caption" color="text.secondary">{m.detail}</Typography></TableCell><TableCell>{m.account}</TableCell><TableCell>{dateText(m.createdAt)}</TableCell><TableCell><StatusBadge status={m.status} label="Completado" /></TableCell><TableCell align="right" sx={{ color: m.direction === 'IN' ? 'success.main' : 'text.primary', whiteSpace: 'nowrap', fontWeight: 700 }}>{m.direction === 'IN' ? <ArrowDownwardRoundedIcon sx={{ fontSize: 14, mr: .5, verticalAlign: 'middle' }} /> : <ArrowUpwardRoundedIcon sx={{ fontSize: 14, mr: .5, verticalAlign: 'middle' }} />}{money(Math.abs(m.amount))}</TableCell></TableRow>)}</TableBody>
  </Table></TableContainer>;
}
