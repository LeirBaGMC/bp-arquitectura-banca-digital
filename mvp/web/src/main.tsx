import React from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import App from './app/App';
import { bpTheme } from './app/theme';
import './app/styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode><ThemeProvider theme={bpTheme}><CssBaseline /><App /></ThemeProvider></React.StrictMode>,
);
