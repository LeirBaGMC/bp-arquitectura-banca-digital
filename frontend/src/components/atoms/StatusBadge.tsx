import { Chip } from '@mui/material';

const statusPresentation: Record<string, { label: string; color: 'warning' | 'success' | 'error' | 'info' | 'default' }> = {
  PENDING: { label: 'En proceso', color: 'warning' },
  PROCESSING: { label: 'En proceso', color: 'warning' },
  COMPLETED: { label: 'Completada', color: 'success' },
  FAILED: { label: 'No completada', color: 'error' },
  REJECTED: { label: 'Rechazada', color: 'error' },
  CANCELLED: { label: 'Cancelada', color: 'default' },
  READ: { label: 'Leída', color: 'success' },
  NEW: { label: 'Nueva', color: 'info' },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const presentation = statusPresentation[status.toUpperCase()] ?? { label: 'En revisión', color: 'info' as const };
  return <Chip size="small" label={label ?? presentation.label} color={presentation.color} variant="outlined" sx={{ fontWeight: 700 }} />;
}
