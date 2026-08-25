import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'
import { gotoViewerDemo, waitForViewerModel } from './viewer'

declare global {
  interface Window {
    /** Test-only: the documentElement class captured on the first painted frame. */
    __firstFrameClass?: string
  }
}

/**
 * Dark mode is a shipping surface, not a nicety: the components are
 * contrast-verified in both appearances, so the appearance has to be correct
 * from the first paint and has to survive navigation.
 */

test.describe('theme toggle', () => {
  test.use({ colorScheme: 'light' })

  test('toggles the appearance and persists the choice across navigation', async ({ page }) => {
    await page.goto('/')
    await waitForHydration(page)

    const html = page.locator('html')
    await expect(html).not.toHaveClass(/\bdark\b/)

    // The button names itself after the appearance it moves to, so the name is
    // the assertion: pressing it must flip both the class and the name.
    await page.getByRole('button', { name: 'Switch to dark theme' }).click()
    await expect(html).toHaveClass(/\bdark\b/)
    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()

    // Client-side navigation keeps the choice…
    const nav = page.getByRole('navigation', { name: 'Main' })
    await nav.getByRole('link', { name: 'Components' }).click()
    await expect(page).toHaveURL(/\/components$/)
    await expect(html).toHaveClass(/\bdark\b/)

    // …and so does a full document load, because the choice is persisted.
    await page.goto('/components/connection-card')
    await expect(html).toHaveClass(/\bdark\b/)
    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()

    // Back to light, and the reverse direction persists too.
    await page.getByRole('button', { name: 'Switch to light theme' }).click()
    await expect(html).not.toHaveClass(/\bdark\b/)
    await page.reload()
    await expect(html).not.toHaveClass(/\bdark\b/)
  })

  test('updates the APS Viewer theme without recreating its WebGL canvas', async ({ page }) => {
    await gotoViewerDemo(page, '/components/aps-viewer')

    const viewer = await waitForViewerModel(page)
    const canvas = viewer.locator('canvas').first()
    const canvasHandle = await canvas.elementHandle()
    await expect(viewer.locator('.adsk-viewing-viewer')).toHaveClass(/light-theme/)

    await page.getByRole('button', { name: 'Switch to dark theme' }).click()

    await expect(viewer.locator('.adsk-viewing-viewer')).toHaveClass(/dark-theme/)
    expect(
      await canvasHandle?.evaluate((node, live) => node === live, await canvas.elementHandle()),
    ).toBe(true)
  })
})

test.describe('no flash of the wrong theme', () => {
  test.use({ colorScheme: 'dark' })

  test('the appearance class is set before the first paint on a hard load', async ({ page }) => {
    // A parser-blocking inline script in <head> is what makes this possible:
    // it runs before <body> exists, so no paintable frame ever lacks the
    // class. next-themes' own copy at the top of <body> is not early enough —
    // a slow-streaming document can paint the body's background before
    // reaching it — which is why the layout ships the head script this
    // asserts. It must appear before <body>, not merely before the content.
    const response = await page.request.get('/components')
    const markup = await response.text()
    const scriptAt = markup.search(/<script>[^<]*prefers-color-scheme[^<]*<\/script>/)
    expect(
      scriptAt,
      'the blocking appearance script is missing from the server markup',
    ).toBeGreaterThan(-1)
    expect(scriptAt, 'the blocking appearance script renders after <body> opens').toBeLessThan(
      markup.indexOf('<body'),
    )

    // Record the class list inside the first animation frame in which <body>
    // exists. rAF callbacks run as part of the rendering steps, before that
    // frame is painted — so a class observed here was in place for the paint.
    // Frames before <body> is parsed are skipped: nothing page-controlled has
    // painted yet (the background lives on body), so a slow-streaming head
    // cannot flash a theme. But an empty body is not skipped — body carries
    // bg-background, so from its first frame a wrong class is a visible flash.
    await page.addInitScript(() => {
      const record = () => {
        if (document.body) {
          window.__firstFrameClass = document.documentElement.className
          return
        }
        requestAnimationFrame(record)
      }
      requestAnimationFrame(record)
    })

    await page.goto('/components')
    await waitForHydration(page)

    const firstFrameClass = await page.evaluate(() => window.__firstFrameClass)
    expect(firstFrameClass, 'no frame was recorded').toBeDefined()
    expect(firstFrameClass, 'the first painted frame was not dark').toContain('dark')

    // And it stays dark — no post-hydration correction.
    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  })
})
