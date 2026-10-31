import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Production builds (and `vite preview` of them) are served from GitHub Pages at /officer-prep/; dev runs at the root.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/officer-prep/' : '/',
  define: { __BUILD_TIME__: JSON.stringify(new Date().toISOString()) }, // shown in Library → This device
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
        cleanupOutdatedCaches: true,
      },
    }),
  ],
}))
