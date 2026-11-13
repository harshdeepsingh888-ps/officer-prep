import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'

// The app's version is the last commit's time, not the build time: rebuilding the same code (the twice-daily
// headline refresh) then produces identical files, so installed apps aren't told about a "new version".
const VERSION = (() => {
  try { return execSync('git log -1 --format=%cI').toString().trim() } catch { return new Date().toISOString() }
})()

// Production builds (and `vite preview` of them) are served from GitHub Pages at /officer-prep/; dev runs at the root.
// Four pages: the landing page at the root, the app under app/, the privacy and terms page, and the 404 page.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/officer-prep/' : '/',
  define: { __BUILD_TIME__: JSON.stringify(VERSION) }, // shown in Library → This device
  build: {
    rollupOptions: {
      input: { landing: 'index.html', app: 'app/index.html', legal: 'legal.html', notFound: '404.html' },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': a new version waits until you press "Update now" in the toast (src/components/AppUpdates.tsx),
      // so an update never reloads the page in the middle of a test.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon-64.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Officer Prep',
        short_name: 'Officer Prep',
        description: 'Self-study for CDS, AFCAT, CAPF, Coast Guard and UPSC CSE — planner, practice, past papers and SSB tests.',
        theme_color: '#000000',
        background_color: '#000000',
        // The installed app opens on the app itself, not the landing page.
        start_url: './app/',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + fonts work offline; Google APIs and UPSC links always go to the network.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The share image is only for link previews, so it is not stored offline.
        globIgnores: ['og.png'],
        // Offline, any address the cache doesn't know opens the app rather than the landing page.
        navigateFallback: 'app/index.html',
        cleanupOutdatedCaches: true,
        // Headlines: always try for the latest, fall back to the last copy when offline.
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.endsWith('/news/latest.json'),
          handler: 'NetworkFirst',
          options: { cacheName: 'news', networkTimeoutSeconds: 8, expiration: { maxEntries: 2 } },
        }],
      },
    }),
  ],
}))
