import { expect, type Page, test } from '@playwright/test'

import { waitForHydration } from './hydration'

/**
 * The APS Viewer demos need real credentials: an APS app that can mint a
 * `viewables:read` token, and a translated model to point at. A fork-originated
 * pull request gets none of them — GitHub does not expose repository secrets to
 * forks — so the docs page renders its unconfigured placeholder instead of a
 * viewer, and every assertion that waits on a live model would hang until the
 * job times out.
 *
 * The placeholder is the signal: it is rendered by the same page under test, so
 * this reads the app's own answer rather than guessing from the runner's
 * environment (a local `.env` at the repository root is loaded by next.config,
 * not by the Playwright process).
 *
 * Navigates to `path`, waits for hydration, and skips the calling test when the
 * demo is unconfigured.
 */
export async function gotoViewerDemo(page: Page, path: string): Promise<void> {
  // Every viewer test downloads the real SDK from Autodesk's CDN and loads a
  // real translated model into a WebGL context — the most expensive thing the
  // suite does, and the only place a third-party outage can fail the run.
  // APS_E2E=1 opts in: locally by hand, in CI when the PR touches
  // viewer-adjacent paths, and always on pushes to main.
  test.skip(
    !process.env.APS_E2E,
    'viewer e2e loads the real Autodesk CDN and model; opt in with APS_E2E=1',
  )
  await page.goto(path)
  await waitForHydration(page)
  const unconfigured = await page.locator('[data-viewer-demo="unconfigured"]').count()
  test.skip(
    unconfigured > 0,
    'the APS Viewer demo is unconfigured (APS_CLIENT_ID, APS_CLIENT_SECRET, APS_VIEWER_DEMO_URN)',
  )
}

/** Waits for the viewer to report a started runtime and a loaded model. */
export async function waitForViewerModel(page: Page) {
  const viewer = page.locator('[data-aps-viewer-status]')
  await expect(viewer).toHaveAttribute('data-aps-viewer-status', 'ready', { timeout: 30_000 })
  // The status strip sits under the canvas, outside the viewer element, so the
  // captured region never contains chrome. Target the strip's own node rather
  // than its words: the polite live region beside it carries the same text.
  await expect(page.locator('[data-viewer-model-status]')).toHaveText('Model loaded', {
    timeout: 30_000,
  })
  return viewer
}
