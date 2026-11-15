import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Snackbar, Stack, Typography } from '@mui/material';
import { BankingLayout } from '../components/templates/BankingLayout';
import { AuthenticationRequiredError, describeApiError, loadBankingData } from '../services/bankingApi';
import type { BankingData } from '../types/banking';
import type { PageKey } from '../types/navigation';
import { authConfigured, beginLogin, completeLogin, endSession, getAccessToken, localAuthenticationEnabled } from '../services/auth';

const DashboardPage = lazy(() => import('../pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const MovementsPage = lazy(() => import('../pages/MovementsPage').then(module => ({ default: module.MovementsPage })));
const TransfersPage = lazy(() => import('../pages/TransfersPage').then(module => ({ default: module.TransfersPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(module => ({ default: module.SettingsPage })));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage').then(module => ({ default: module.NotificationsPage })));

const pages: PageKey[] = ['inicio', 'movimientos', 'transferir', 'notificaciones', 'configuracion'];
const pageFromLocation = (): PageKey => {
  const value = window.location.hash.slice(1) as PageKey;
  return pages.includes(value) ? value : 'inicio';
};

export default function App() {
  const [page, setPage] = useState<PageKey>(pageFromLocation);
  const [data, setData] = useState<BankingData | null>(null);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [authState, setAuthState] = useState<'loading' | 'login' | 'error' | 'ready'>('loading');
  const refresh = useCallback(async () => {
    try {
      setData(await loadBankingData());
      setError('');
    } catch (cause) {
      if (cause instanceof AuthenticationRequiredError) {
        setData(null);
        setAuthState('login');
      }
      throw cause;
    }
  }, []);
  const navigate = useCallback((nextPage: PageKey) => {
    window.history.pushState(null, '', `#${nextPage}`);
    setPage(nextPage);
  }, []);

  useEffect(() => {
    const onHistoryChange = () => setPage(pageFromLocation());
    window.addEventListener('popstate', onHistoryChange);
    return () => window.removeEventListener('popstate', onHistoryChange);
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        if (authConfigured) {
          await completeLogin();
          if (!getAccessToken()) {
            if (active) setAuthState('login');
            return;
          }
        } else if (!localAuthenticationEnabled) {
          throw new Error('Configura el proveedor de inicio de sesión antes de publicar la aplicación.');
        }
        if (active) setAuthState('ready');
        await refresh().catch((cause: Error) => {
          if (active) setError(describeApiError(cause));
        });
      } catch (cause) {
        if (active) {
          setError(describeApiError(cause));
          setAuthState('error');
        }
      }
    }
    void initialize();
    return () => { active = false; };
  }, [refresh]);

  if (authState !== 'ready') {
    return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: 'background.default' }}>
      <Card sx={{ width: 'min(100%, 440px)' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ mb: 1, fontWeight: 750 }}>BP digital</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {authState === 'loading' ? 'Preparando tu espacio seguro.' : 'Inicia sesión para consultar tus cuentas y movimientos.'}
          </Typography>
          {authState === 'error' && <Alert severity="error" sx={{ mb: 2 }} role="alert">{error}</Alert>}
          {authState === 'login' && !localAuthenticationEnabled && <Button fullWidth variant="contained" onClick={() => void beginLogin().catch((cause: Error) => { setError(describeApiError(cause)); setAuthState('error'); })}>Iniciar sesión</Button>}
          {authState === 'error' && <Button fullWidth variant="contained" onClick={() => window.location.reload()}>Reintentar</Button>}
        </CardContent>
      </Card>
    </Box>;
  }

  let content: React.ReactNode;
  if (!data && error) {
    content = <Stack spacing={2} sx={{ alignItems: 'flex-start' }}><Alert severity="error" role="alert">No pudimos cargar la información de tus cuentas. Inténtalo de nuevo.</Alert><Button variant="contained" onClick={() => refresh().catch((cause: unknown) => setError(describeApiError(cause)))}>Reintentar</Button></Stack>;
  } else if (!data) {
    content = <Box sx={{ py: 12, textAlign: 'center' }}><Typography color="text.secondary">Cargando la banca digital.</Typography></Box>;
  } else {
    switch (page) {
      case 'movimientos': content = <MovementsPage movements={data.movements} />; break;
      case 'transferir': content = <TransfersPage data={data} refresh={refresh} flash={setToast} />; break;
      case 'notificaciones': content = <NotificationsPage notifications={data.notifications} />; break;
      case 'configuracion': content = <SettingsPage localOnly={localAuthenticationEnabled} onSignOut={endSession} />; break;
      default: content = <DashboardPage data={data} onNavigate={navigate} />;
    }
  }

  return <>
    <BankingLayout current={page} notifications={data?.notifications.filter(n => !n.isRead).length ?? 0} customerName={data?.customer.name ?? ''} onNavigate={navigate} onNotifications={() => navigate('notificaciones')} onSignOut={endSession}>
      <Suspense fallback={<Box sx={{ py: 8, textAlign: 'center' }}><Typography color="text.secondary">Cargando esta sección.</Typography></Box>}>
        {content}
      </Suspense>
    </BankingLayout>
    <Snackbar open={Boolean(toast)} autoHideDuration={3200} onClose={() => setToast('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
      <Alert severity="success" variant="filled" onClose={() => setToast('')} sx={{ width: '100%' }}>{toast}</Alert>
    </Snackbar>
  </>;
}
