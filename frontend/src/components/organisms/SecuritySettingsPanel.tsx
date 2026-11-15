import { Alert, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

export function SecuritySettingsPanel({ localOnly, onSignOut }: { localOnly: boolean; onSignOut: () => void }) {
  return (
    <Card sx={{ maxWidth: 780 }}>
      <CardContent sx={{ p: { xs: 2.25, md: 3 } }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
          <SecurityRoundedIcon color="primary" sx={{ fontSize: 30 }} />
          <Stack>
            <Typography variant="h6" sx={{ fontSize: 17, fontWeight: 700 }}>Seguridad de la cuenta</Typography>
            <Typography variant="body2" color="text.secondary">Administra el acceso a tu sesión.</Typography>
          </Stack>
        </Stack>
        <Alert severity={localOnly ? 'warning' : 'info'} sx={{ mb: 2 }}>
          {localOnly
            ? 'El acceso local está habilitado solo para desarrollo. Configura el proveedor de identidad antes de publicar.'
            : 'El proveedor de identidad valida tu sesión y la API limita la información a tu usuario.'}
        </Alert>
        <Button variant="outlined" startIcon={<LogoutRoundedIcon />} onClick={onSignOut}>Cerrar sesión</Button>
      </CardContent>
    </Card>
  );
}
