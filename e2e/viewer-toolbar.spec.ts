import { expect, type Locator, test } from '@playwright/test'

import { gotoViewerDemo, waitForViewerModel } from './viewer'

const positions = ['bottom', 'top', 'left', 'right'] as const
const scales = ['sm', 'md', 'lg'] as const
/** Rendered button box per preset: Autodesk stock is 42px; sm/lg come from the extension. */
const expectedBoxPx = { sm: 36, md: 42, lg: 52 } as const

/** Total rendered height of the first toolbar button, border box. */
function buttonBoxHeight(toolbar: Locator): Promise<number> {
  return toolbar
    .locator('.adsk-button')
    .first()
    .evaluate((node) => node.getBoundingClientRect().height)
}

test.describe('Viewer native toolbar', () => {
  test.use({ colorScheme: 'light', viewport: { width: 1440, height: 1000 } })
  // The captured region is the SDK canvas and toolbar, not browser chrome;
  // one baseline is shared across CI and local Chromium with a small pixel
  // tolerance for GPU antialiasing.
  test.beforeEach(({ browserName: _browserName }, testInfo) => {
    testInfo.snapshotSuffix = ''
  })

  for (const position of positions) {
    for (const scale of scales) {
      test(`${position} at ${scale} scale against the live model`, async ({ page }) => {
        await gotoViewerDemo(
          page,
          `/components/aps-viewer?viewerPosition=${position}&viewerScale=${scale}`,
        )
        const viewer = await waitForViewerModel(page)

        const toolbar = viewer.locator(
          `.adsk-toolbar.cantera-toolbar--${position}.cantera-toolbar--${scale}`,
        )
        await expect(toolbar).toBeVisible()
        if (position === 'left' || position === 'right') {
          await expect
            .poll(() => toolbar.evaluate((node) => getComputedStyle(node).flexDirection))
            .toBe('column')
        }
        await expect.poll(() => buttonBoxHeight(toolbar)).toBeCloseTo(expectedBoxPx[scale], 0)

        await expect(viewer).toHaveScreenshot(`viewer-toolbar-${position}-${scale}.png`, {
          animations: 'disabled',
          maxDiffPixelRatio: 0.03,
        })
      })
    }
  }

  // Numeric scale is assertion-only: an exact box, no committed baseline —
  // the preset matrix already covers every position visually.
  test('numeric scale renders an exact button box', async ({ page }) => {
    await gotoViewerDemo(page, '/components/aps-viewer?viewerPosition=bottom&viewerScale=48')
    const viewer = await waitForViewerModel(page)

    const toolbar = viewer.locator('.adsk-toolbar.cantera-toolbar--bottom.cantera-toolbar--sized')
    await expect(toolbar).toBeVisible()
    await expect.poll(() => buttonBoxHeight(toolbar)).toBeCloseTo(48, 0)
  })
})
