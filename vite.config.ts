import react from '@vitejs/plugin-react';
import postcssPresetMantine from 'postcss-preset-mantine';
import postcssSimpleVars from 'postcss-simple-vars';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  css: {
    transformer: 'postcss',
    postcss: {
      plugins: [
        postcssPresetMantine(),
        postcssSimpleVars({
          variables: {
            'mantine-breakpoint-xs': '36em',
            'mantine-breakpoint-sm': '48em',
            'mantine-breakpoint-md': '62em',
            'mantine-breakpoint-lg': '75em',
            'mantine-breakpoint-xl': '88em',
          },
        }),
      ],
    },
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
    // Lightning CSS (Vite 8's default CSS minifier) lowers light-dark()
    // into a broken fallback when the CSS target is older than its
    // native support (Chrome 123, Firefox 120, Safari 17.5).
    cssTarget: ['chrome123', 'firefox120', 'safari17.5', 'edge123'],
    chunkSizeWarningLimit: 2048,
    sourcemap: true,
  },
});
