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
  // suite does. CI always pays it; locally it is opt-in via APS_E2E=1.
  test.skip(
    !process.env.CI && !process.env.APS_E2E,
    'viewer e2e loads the real Autodesk CDN and model; opt in locally with APS_E2E=1',
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
  // captured region never contains chrome — assert against the page.
  await expect(page.getByText('Loading model')).toBeHidden({ timeout: 30_000 })
  await expect(page.getByText('Model loaded')).toBeVisible({ timeout: 30_000 })
  return viewer
}
