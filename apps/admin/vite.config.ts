/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

export default defineConfig(() => ({
  base: '/admin/',
  plugins: [react(), tsconfigPaths(), svgr()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    pool: 'threads',
    testTimeout: 10000,
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'es2022',
    sourcemap: 'hidden' as const,
    reportCompressedSize: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          ui: ['antd', '@ant-design/icons'],
          charts: ['recharts'],
          map: ['leaflet', 'react-leaflet', '@react-google-maps/api'],
          tanstack: ['@tanstack/react-query', '@tanstack/react-query-devtools'],
          forms: ['react-hook-form'],
          io: ['axios', 'socket.io-client'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
}));
