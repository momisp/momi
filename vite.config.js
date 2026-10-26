import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@modes': path.resolve(__dirname, 'modes'),
    },
  },
  server: {
    proxy: {
      '/agile-sim/api': {
        target: 'http://127.0.0.1:3921',
        changeOrigin: true,
      },
    },
  },
});
