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
  await expect(viewer.getByText('Loading model')).toBeHidden({ timeout: 30_000 })
  return viewer
}
