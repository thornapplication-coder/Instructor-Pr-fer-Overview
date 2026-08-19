import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves this project under the repository path, case-sensitive.
// Renaming the repository therefore moves the whole site, and a hard-coded base
// silently breaks every asset URL, the manifest scope and the service worker.
// So derive it from the repository itself: GitHub Actions always sets
// GITHUB_REPOSITORY ("owner/name"), which makes a future rename self-healing.
// VITE_BASE overrides it (custom domain: set it to "/"), and the literal below
// is only the fallback for a plain local build.
function repoBase() {
  const explicit = String(process.env.VITE_BASE || '').trim()
  if (explicit) return explicit.endsWith('/') ? explicit : explicit + '/'
  const slug = String(process.env.GITHUB_REPOSITORY || '').split('/')[1]
  return slug ? `/${slug}/` : '/Instructor-Pr-fer-Overview/'
}

const BASE = repoBase()

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // show an explicit "Update" button instead of silent reload
      includeAssets: ['favicon.ico', 'icons/apple-touch-icon.png'],
      manifest: {
        name: '737 Trainer & Examiner Monitoring',
        short_name: '737 TRAINER',
        description:
          'Monitoring & Steuerung der Instruktoren und Prüfer für den 737 MAX Phase-In (Eurowings).',
        lang: 'de',
        theme_color: '#AF1E65',
        // The splash screen while the installed app boots. Burgundy is the
        // TOPBAR's colour, not the page's - `body` paints var(--panel), so
        // every cold start flashed full-screen burgundy and then went white.
        // theme_color above stays burgundy; that one really is the bar.
        background_color: '#f8f9fa',
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
        // Anything above the default 2 MiB is dropped from the precache with
        // nothing but a build-log line: the app installs, looks fine, and then
        // fails offline on exactly that chunk. The main bundle grows every
        // release, so the ceiling is stated rather than inherited.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: BASE + 'index.html',
        cleanupOutdatedCaches: true
      }
    })
  ]
})
