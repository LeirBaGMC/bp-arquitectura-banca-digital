import { Alert } from '@mui/material';

export function NoticeAlert({ severity = 'info', children }: { severity?: 'info' | 'success' | 'warning' | 'error'; children: React.ReactNode }) {
  return <Alert severity={severity} variant="outlined" sx={{ borderRadius: 2 }}>{children}</Alert>;
}
