import { Stack } from '@mui/material';
import { PageHeading } from '../components/molecules/PageHeading';
import { TransferWorkbench } from '../components/organisms/TransferWorkbench';
import type { BankingData } from '../types/banking';

export function TransfersPage({ data, refresh, flash }: { data: BankingData; refresh: () => Promise<void>; flash: (message: string) => void }) {
  return <Stack spacing={2}><PageHeading eyebrow="Operaciones" title="Transferir" description="Transfiere entre tus cuentas o registra una transferencia a otro banco." /><TransferWorkbench data={data} refresh={refresh} flash={flash} /></Stack>;
}
