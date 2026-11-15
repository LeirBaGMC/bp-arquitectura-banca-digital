import { createTheme } from '@mui/material/styles';

export const bpTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1769aa', dark: '#103653', light: '#eaf3fa' },
    secondary: { main: '#158f83' },
    success: { main: '#21836f' },
    warning: { main: '#b47719' },
    error: { main: '#b44740' },
    background: { default: '#f4f7fa', paper: '#ffffff' },
    text: { primary: '#152538', secondary: '#718094' },
    divider: '#e5ebf0',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.04em' },
    h2: { fontWeight: 700, letterSpacing: '-0.03em' },
    h3: { fontWeight: 700, letterSpacing: '-0.02em' },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  components: {
    MuiCard: { styleOverrides: { root: { border: '1px solid #e5ebf0', boxShadow: '0 8px 24px rgba(24,45,68,.045)' } } },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
  },
});
