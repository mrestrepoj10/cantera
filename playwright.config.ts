import { defineConfig } from '@playwright/test'

/**
 * Two apps, two servers, two projects.
 *
 * `www` hosts the registry, the landing page, the demo, and the framed
 * previews; `docs` is the Blume reference site. They are separate deployments
 * on separate origins, so a11y regressions on one cannot be caught by scanning
 * the other — which is what the split below exists to prevent. Each project
 * pins its own `baseURL` and claims its own specs by filename.
 *
 * The docs server is told to frame previews from the local `www` rather than
 * production: the committed MDX names the production origin (it has to, to stay
 * byte-stable), and a test run should exercise the build in front of it.
 */

const WWW_URL = 'http://localhost:3456'
const DOCS_URL = 'http://localhost:4321'

/** Specs that run against the docs app; everything else runs against www. */
const DOCS_SPECS = /docs-a11y\.spec\.ts/

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  projects: [
    {
      name: 'www',
      testIgnore: DOCS_SPECS,
      use: { baseURL: WWW_URL },
    },
    {
      name: 'docs',
      testMatch: DOCS_SPECS,
      use: { baseURL: DOCS_URL },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter www exec next dev -p 3456',
      url: WWW_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter docs exec blume dev --port 4321',
      url: DOCS_URL,
      reuseExistingServer: !process.env.CI,
      // Blume generates and starts an Astro project on first run, which is
      // slower to come up than a warm Next dev server.
      timeout: 180_000,
      env: { PUBLIC_EMBED_ORIGIN: WWW_URL },
    },
  ],
})
