import { Chip, Stack } from '@mui/material';
import { PageHeading } from '../components/molecules/PageHeading';
import { MovementsTable } from '../components/organisms/MovementsTable';
import type { Movement } from '../types/banking';

export function MovementsPage({ movements }: { movements: Movement[] }) {
  return <Stack spacing={2}><PageHeading eyebrow="Actividad de cuenta" title="Movimientos" description="Consulta la actividad de tus cuentas." action={<Chip label={`${movements.length} registros`} variant="outlined" />} /><MovementsTable movements={movements} /></Stack>;
}
