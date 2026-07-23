import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves this project under /testrepo/.
// If the repository is renamed, update `base` (and the paths in index.html) to match.
const BASE = '/testrepo/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // show an explicit "Update" button instead of silent reload
      includeAssets: ['favicon.ico', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'EWL 737 Trainer & Examiner Monitoring',
        short_name: 'EWL 737',
        description:
          'Monitoring & Steuerung der Instruktoren und Prüfer für den 737 MAX Phase-In (Eurowings).',
        lang: 'de',
        theme_color: '#AF1E65',
        background_color: '#AF1E65',
        display: 'standalone',
        orientation: 'any',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: BASE + 'index.html',
        cleanupOutdatedCaches: true
      }
    })
  ]
})
