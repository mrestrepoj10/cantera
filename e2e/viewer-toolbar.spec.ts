import { expect, type Locator, test } from '@playwright/test'

import { gotoViewerDemo, waitForViewerModel } from './viewer'

const positions = ['bottom', 'top', 'left', 'right'] as const
const scales = ['sm', 'md', 'lg'] as const
/** Rendered button box per preset: Autodesk stock is 42px; sm/lg come from the extension. */
const expectedBoxPx = { sm: 36, md: 42, lg: 52 } as const

/** Total rendered height of the first visible toolbar button, border box.
 * LMV keeps hidden buttons (collapsed flyouts) in the DOM at zero height. */
function buttonBoxHeight(toolbar: Locator): Promise<number> {
  return toolbar
    .locator('.adsk-button:visible')
    .first()
    .evaluate((node) => node.getBoundingClientRect().height)
}

/**
 * Assertion-based on purpose — no screenshot baselines. Committed PNGs churned
 * on every intentional layout change, needed live APS credentials to
 * regenerate (fork PRs could not), and never caught a bug the computed-style
 * assertions below miss: class application, orientation, flyout anchoring,
 * and exact button-box sizing are all asserted directly against the live SDK.
 */
test.describe('Viewer native toolbar', () => {
  test.use({ colorScheme: 'light', viewport: { width: 1440, height: 1000 } })

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
          // Flyout and tooltip anchoring is the fragile half of the vertical
          // CSS (it targets LMV-internal class names) — assert the side
          // override actually applied instead of trusting the class landed.
          const tooltip = toolbar.locator('.adsk-control-tooltip').first()
          await expect
            .poll(() =>
              tooltip.evaluate((node, side) => {
                const style = getComputedStyle(node)
                return side === 'left'
                  ? style.right === 'auto' && style.left !== 'auto'
                  : style.left === 'auto' && style.right !== 'auto'
              }, position),
            )
            .toBe(true)
        }
        await expect.poll(() => buttonBoxHeight(toolbar)).toBeCloseTo(expectedBoxPx[scale], 0)
      })
    }
  }

  test('numeric scale renders an exact button box', async ({ page }) => {
    await gotoViewerDemo(page, '/components/aps-viewer?viewerPosition=bottom&viewerScale=48')
    const viewer = await waitForViewerModel(page)

    const toolbar = viewer.locator('.adsk-toolbar.cantera-toolbar--bottom.cantera-toolbar--sized')
    await expect(toolbar).toBeVisible()
    await expect.poll(() => buttonBoxHeight(toolbar)).toBeCloseTo(48, 0)
  })
})
