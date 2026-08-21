import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'

const positions = ['bottom', 'top', 'left', 'right'] as const
const scales = ['md', 'lg'] as const

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
        await page.goto(`/components/aps-viewer?viewerPosition=${position}&viewerScale=${scale}`)
        await waitForHydration(page)

        const viewer = page.locator('[data-aps-viewer-status]')
        await expect(viewer).toHaveAttribute('data-aps-viewer-status', 'ready', {
          timeout: 30_000,
        })
        await expect(viewer.getByText('Loading model')).toBeHidden({ timeout: 30_000 })

        const toolbar = viewer.locator(
          `.adsk-toolbar.cantera-toolbar--${position}.cantera-toolbar--${scale}`,
        )
        await expect(toolbar).toBeVisible()
        if (position === 'left' || position === 'right') {
          await expect
            .poll(() => toolbar.evaluate((node) => getComputedStyle(node).flexDirection))
            .toBe('column')
        }
        if (scale === 'lg') {
          await expect
            .poll(() =>
              toolbar
                .locator('.adsk-button')
                .first()
                .evaluate((node) => Number.parseFloat(getComputedStyle(node).minHeight)),
            )
            .toBeGreaterThanOrEqual(44)
        }

        await expect(viewer).toHaveScreenshot(`viewer-toolbar-${position}-${scale}.png`, {
          animations: 'disabled',
          maxDiffPixelRatio: 0.03,
        })
      })
    }
  }
})
