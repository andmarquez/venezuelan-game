import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: true,
    proxy: {
      '/api/lrclib': {
        target: 'https://lrclib.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lrclib/, '/api'),
      },
      '/api/audd': {
        target: 'https://api.audd.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/audd/, ''),
      },
    },
  },
  preview: {
    allowedHosts: true,
    proxy: {
      '/api/lrclib': {
        target: 'https://lrclib.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lrclib/, '/api'),
      },
      '/api/audd': {
        target: 'https://api.audd.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/audd/, ''),
      },
    },
  },
});
