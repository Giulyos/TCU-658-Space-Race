import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Precache the favicon alongside the build output so the installed app
      // shell is complete offline.
      includeAssets: ['favicon.svg'],
      workbox: {
        // Precache the entire app shell (cache-first). The default glob misses
        // the .wav sound effects, so list every asset type the game ships —
        // nothing must be fetched from the network after the first load.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,wav,webmanifest}'],
        // SPA: serve the cached index.html for client routes (/admin, /game) so
        // a reload works offline. API calls are left to the network (the local
        // server), never cached.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//]
      },
      manifest: {
        name: 'Space Race',
        short_name: 'SpaceRace',
        description: 'Offline classroom English quiz race game.',
        theme_color: '#0b0420',
        background_color: '#0b0420',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js'
  }
})
