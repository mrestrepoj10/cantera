import { expect, type Locator, test } from '@playwright/test'

import { gotoViewerDemo, openViewerInspector, waitForViewerModel } from './viewer'

// Each position exercises docking and orientation once; each scale exercises
// button-box sizing once. The full position×scale product re-verifies the same
// class machinery at triple the CDN cost.
const dockingCases = [
  { position: 'bottom', scale: 'md' },
  { position: 'top', scale: 'md' },
  { position: 'left', scale: 'md' },
  { position: 'right', scale: 'md' },
  { position: 'bottom', scale: 'sm' },
  { position: 'bottom', scale: 'lg' },
] as const

/** Rendered button box per preset: compact, comfortable, and gloved. */
const expectedBoxPx = { sm: 36, md: 44, lg: 52 } as const

/** LMV keeps hidden buttons (collapsed flyouts) in the DOM at zero height. */
function buttonBoxHeight(toolbar: Locator): Promise<number> {
  return toolbar
    .locator('.adsk-button:visible')
    .first()
    .evaluate((node) => node.getBoundingClientRect().height)
}

/**
 * Assertion-based on purpose — no screenshot baselines: committed PNGs churned
 * on every intentional layout change and needed live APS credentials to
 * regenerate, while computed-style assertions catch the same regressions.
 */
test.describe('APS Viewer toolbar', () => {
  test.use({ colorScheme: 'light', viewport: { width: 1440, height: 1000 } })

  for (const { position, scale } of dockingCases) {
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
      await expect
        .poll(async () => {
          const [toolbarBox, viewerBox] = await Promise.all([
            toolbar.boundingBox(),
            viewer.boundingBox(),
          ])
          if (!toolbarBox || !viewerBox) return false
          let gap: number
          switch (position) {
            case 'bottom':
              gap = viewerBox.y + viewerBox.height - (toolbarBox.y + toolbarBox.height)
              break
            case 'top':
              gap = toolbarBox.y - viewerBox.y
              break
            case 'left':
              gap = toolbarBox.x - viewerBox.x
              break
            case 'right':
              gap = viewerBox.x + viewerBox.width - (toolbarBox.x + toolbarBox.width)
              break
          }
          // Inside the viewer (gap >= 0) and hugging the edge (gap < 40).
          return gap >= 0 && gap < 40
        })
        .toBe(true)
      if (position === 'left' || position === 'right') {
        await expect
          .poll(() => toolbar.evaluate((node) => getComputedStyle(node).flexDirection))
          .toBe('column')
        // Tooltip anchoring targets LMV-internal class names — assert the side
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

  test('numeric scale renders an exact button box', async ({ page }) => {
    await gotoViewerDemo(page, '/components/aps-viewer?viewerPosition=bottom&viewerScale=48')
    const viewer = await waitForViewerModel(page)

    const toolbar = viewer.locator('.adsk-toolbar.cantera-toolbar--bottom.cantera-toolbar--sized')
    await expect(toolbar).toBeVisible()
    await expect.poll(() => buttonBoxHeight(toolbar)).toBeCloseTo(48, 0)
  })

  test('viewer radius updates in place without overflowing the inspector', async ({ page }) => {
    await gotoViewerDemo(page, '/components/aps-viewer?viewerRadius=0')
    const viewer = await waitForViewerModel(page)
    await openViewerInspector(page)
    const workbench = page.locator('[data-viewer-workbench]')
    const canvas = viewer.locator('canvas').first()
    const canvasHandle = await canvas.elementHandle()
    const inspector = page.getByRole('complementary', { name: 'Viewer inspector' })
    const setup = page.getByRole('tabpanel', { name: 'Setup' })

    await expect
      .poll(() => viewer.evaluate((node) => getComputedStyle(node).borderRadius))
      .toBe('0px')
    await expect
      .poll(() => workbench.evaluate((node) => getComputedStyle(node).borderRadius))
      .toBe('0px')
    await expect
      .poll(() => viewer.evaluate((node) => getComputedStyle(node).overflow))
      .toBe('hidden')
    await expect
      .poll(() => inspector.evaluate((node) => node.scrollWidth <= node.clientWidth))
      .toBe(true)
    await expect
      .poll(() => setup.evaluate((node) => getComputedStyle(node).overflowX))
      .toBe('hidden')

    await page.getByRole('slider', { name: 'Viewer radius' }).fill('24')
    await expect
      .poll(() => viewer.evaluate((node) => getComputedStyle(node).borderRadius))
      .toBe('24px')
    await expect
      .poll(() => workbench.evaluate((node) => getComputedStyle(node).borderRadius))
      .toBe('24px')
    expect(
      await canvasHandle?.evaluate((node, live) => node === live, await canvas.elementHandle()),
    ).toBe(true)
  })

  test('ViewCube visibility changes without recreating the viewer', async ({ page }) => {
    await gotoViewerDemo(page, '/components/aps-viewer')
    const viewer = await waitForViewerModel(page)
    const canvas = viewer.locator('canvas').first()
    const canvasHandle = await canvas.elementHandle()
    await openViewerInspector(page)
    const viewCube = viewer.locator('.viewcubeWrapper')
    const toggle = page.getByRole('checkbox', { name: 'ViewCube' })

    await expect(viewCube).toBeVisible()
    await toggle.click()
    await expect(viewCube).toBeHidden()
    await toggle.click()
    await expect(viewCube).toBeVisible()
    expect(
      await canvasHandle?.evaluate((node, live) => node === live, await canvas.elementHandle()),
    ).toBe(true)
  })

  test('toolbar can be removed and restored without losing the model', async ({ page }) => {
    await gotoViewerDemo(page, '/components/aps-viewer')
    const viewer = await waitForViewerModel(page)
    await openViewerInspector(page)
    const toggle = page.getByRole('checkbox', { name: 'Native toolbar' })

    await toggle.click()
    await expect(viewer.locator('.adsk-toolbar')).toHaveCount(0)
    await expect(page.locator('[data-viewer-model-status]')).toContainText('Model loaded', {
      timeout: 30_000,
    })

    await toggle.click()
    await expect(viewer.locator('.adsk-toolbar')).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('[data-viewer-model-status]')).toContainText('Model loaded', {
      timeout: 30_000,
    })
  })
})
