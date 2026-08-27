import { expect, type Page, test } from '@playwright/test'

import { waitForHydration } from './hydration'

export async function gotoViewerDemo(page: Page, path: string): Promise<void> {
  // Viewer tests download the real SDK from Autodesk's CDN and load a real
  // model — APS_E2E=1 opts in (locally by hand; in CI per ci.yml's path filter).
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

/** Idempotent: the showcase opens the inspector by default, but if it is
 * collapsed the settings trigger sits in the SDK toolbar (or a corner button
 * when the native toolbar is off). */
export async function openViewerInspector(page: Page): Promise<void> {
  const inspector = page.getByRole('complementary', { name: 'Viewer inspector' })
  if ((await inspector.count()) === 0) {
    await page.getByRole('button', { name: 'Viewer settings' }).click()
  }
  await expect(inspector).toBeVisible()
}

/** Waits for the viewer to report a started runtime and a loaded model. */
export async function waitForViewerModel(page: Page) {
  const viewer = page.locator('[data-aps-viewer-status]')
  await expect(viewer).toHaveAttribute('data-aps-viewer-status', 'ready', { timeout: 30_000 })
  // Contains, not equals: the live region appends extension status sentences
  // ("Markups toolbar loaded.") after the model text when extensions load.
  await expect(page.locator('[data-viewer-model-status]')).toContainText('Model loaded', {
    timeout: 30_000,
  })
  return viewer
}
