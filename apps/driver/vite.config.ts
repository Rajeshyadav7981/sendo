import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/driver/',
  plugins: [
    react(),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Sendo Driver',
        short_name: 'Sendo',
        description: 'Sendo driver app — onboarding, attendance, advances, trips',
        theme_color: '#FFC107',
        background_color: '#111111',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/driver/',
        scope: '/driver/',
        icons: [
          { src: '/driver/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/driver/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/driver/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^\/api\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'api-cache', networkTimeoutSeconds: 5 },
          },
          {
            urlPattern: /^\/uploads\//,
            handler: 'CacheFirst',
            options: { cacheName: 'uploads-cache' },
          },
        ],
      },
    }),
  ],
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
          offline: ['idb-keyval'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
});
