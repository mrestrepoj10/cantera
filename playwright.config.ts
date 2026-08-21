import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  // CI runs the full matrix on a dedicated runner; locally, half the cores and
  // fail-fast keep the machine usable while the suite runs.
  workers: process.env.CI ? undefined : 3,
  maxFailures: process.env.CI ? 0 : 1,
  use: {
    baseURL: 'http://localhost:3456',
  },
  webServer: {
    // CI serves the production build it already made (the build step runs
    // before e2e), so no route pays a dev-mode compile. Locally, dev mode on
    // the same port as `pnpm dev` so a running dev server is reused as-is.
    command: process.env.CI
      ? 'pnpm --filter www exec next start -p 3456'
      : 'pnpm --filter www exec next dev -p 3456',
    url: 'http://localhost:3456',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
