import { expect, test } from '@playwright/test'

import { gotoViewerDemo, waitForViewerModel } from './viewer'

test.describe('Viewer demo extensions', () => {
  test.use({ colorScheme: 'light', viewport: { width: 1440, height: 1000 } })

  test('markup extension loads live and unloads in place', async ({ page }) => {
    await gotoViewerDemo(
      page,
      '/components/aps-viewer?viewerExtensions=Autodesk.Viewing.MarkupsGui',
    )
    const viewer = await waitForViewerModel(page)

    const markupButton = viewer.locator('#toolbar-markupTool')
    await expect(markupButton).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('[data-viewer-demo]')).toHaveAttribute(
      'data-extension-status',
      'Autodesk.Viewing.MarkupsGui:ready',
    )

    // The unload control lives in the Extensions tab; the inspector opens on
    // Setup. Unloading unmounts the loader, which unloads the extension in
    // place — the model stays loaded, so the viewer never left the ready state.
    await page.getByRole('tab', { name: /^Extensions/ }).click()
    await page.getByRole('button', { name: 'Unload Markups toolbar' }).click()
    await expect(markupButton).toBeHidden()
    await expect(viewer).toHaveAttribute('data-aps-viewer-status', 'ready')
  })
})
