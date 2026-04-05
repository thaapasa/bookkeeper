import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3100',
      '/content': 'http://localhost:3100',
    },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 2048,
    sourcemap: true,
  },
});
