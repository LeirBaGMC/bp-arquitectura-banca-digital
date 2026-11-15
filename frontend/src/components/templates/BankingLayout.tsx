import { Box, Container, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useState } from 'react';
import { BankingSidebar } from '../organisms/BankingSidebar';
import { BankingHeader } from '../organisms/BankingHeader';
import type { PageKey } from '../../types/navigation';

export function BankingLayout({ current, notifications, customerName, onNavigate, onNotifications, onSignOut, children }: { current: PageKey; notifications: number; customerName: string; onNavigate: (page: PageKey) => void; onNotifications: () => void; onSignOut: () => void; children: React.ReactNode }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = (page: PageKey) => { onNavigate(page); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  return <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
    <BankingSidebar mobile={mobile} open={mobileMenuOpen} current={current} customerName={customerName} onClose={() => setMobileMenuOpen(false)} onNavigate={navigate} />
    <Box component="main" sx={{ minWidth: 0, flex: 1 }}>
      <BankingHeader current={current} notifications={notifications} customerName={customerName} onMenu={() => setMobileMenuOpen(true)} onNotifications={onNotifications} onSignOut={onSignOut} />
      <Container sx={{ px: { xs: 2, sm: 3.5 }, py: { xs: 2.5, md: 4 }, maxWidth: 'xl' }}>{children}</Container>
    </Box>
  </Box>;
}
