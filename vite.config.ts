import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  server: { port: 3000, strictPort: true, proxy: {
    '/api': {
      target: 'http://localhost:3100',
    },
  }},
  build: { target: 'es2020' },
});
