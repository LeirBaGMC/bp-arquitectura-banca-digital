import { Stack } from '@mui/material';
import { PageHeading } from '../components/molecules/PageHeading';
import { SecuritySettingsPanel } from '../components/organisms/SecuritySettingsPanel';

export function SettingsPage({ localOnly, onSignOut }: { localOnly: boolean; onSignOut: () => void }) {
  return (
    <Stack spacing={2}>
      <PageHeading
        eyebrow="Preferencias"
        title="Configuración"
        description="Administra la seguridad de tu cuenta."
      />
      <SecuritySettingsPanel localOnly={localOnly} onSignOut={onSignOut} />
    </Stack>
  );
}
