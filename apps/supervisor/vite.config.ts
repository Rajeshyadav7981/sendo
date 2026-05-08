/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => ({
  base: '/supervisor/',
  plugins: [react(), tsconfigPaths()],
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
    port: 3001,
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
          tanstack: ['@tanstack/react-query'],
          io: ['axios', 'socket.io-client'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
