import { defineConfig, devices } from '@playwright/test'

// Browser regression tests (`npm run test:e2e`): the production build, served by `vite preview` at the same
// /officer-prep/ path as GitHub Pages, driven in the Chrome installed on this machine (no browser download).
// Every test starts with an empty database; the service worker is blocked so no test sees a cached build.

const PORT = 4173

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-report' }]],
  outputDir: 'e2e-results',
  use: {
    baseURL: `http://localhost:${PORT}/officer-prep/`,
    channel: 'chrome',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1280, height: 800 } } },
    { name: 'phone-dark', use: { ...devices['Pixel 7'], channel: 'chrome', colorScheme: 'dark' } },
  ],
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/officer-prep/`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
