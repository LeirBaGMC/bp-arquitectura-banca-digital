import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    cacheDir: env.VITE_CACHE_DIR || undefined,
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: {
        '/api': env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5080',
        '/health': env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:5080',
      },
    },
    build: { outDir: '../backend/wwwroot', emptyOutDir: true },
  };
});
