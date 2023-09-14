import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3100',
    },
  },
  build: { target: 'es2020', chunkSizeWarningLimit: 2048 },
});
