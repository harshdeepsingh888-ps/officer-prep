import { defineConfig } from 'vitest/config'

// Unit and module tests (`npm test`). They run in Node with an in-memory IndexedDB (src/test/setup.ts), so the
// Dexie database behaves as it does in the browser. Dates are checked in Indian time, as the app is used there.
process.env.TZ = 'Asia/Kolkata'

export default defineConfig({
  define: { __BUILD_TIME__: JSON.stringify('test') },
  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    environment: 'node',
  },
})
