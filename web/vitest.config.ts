import { defineConfig } from 'vitest/config'

// Unit tests live next to the code in src/. The Playwright e2e suite under
// tests/e2e is driven separately (npm run test:e2e), so keep it out of vitest.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
