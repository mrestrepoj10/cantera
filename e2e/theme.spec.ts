import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'
import { gotoViewerDemo, waitForViewerModel } from './viewer'

declare global {
  interface Window {
    __firstFrameClass?: string
  }
}

test.describe('theme toggle', () => {
  test.use({ colorScheme: 'light' })

  test('toggles the appearance and persists the choice across navigation', async ({ page }) => {
    await page.goto('/')
    await waitForHydration(page)

    const html = page.locator('html')
    await expect(html).not.toHaveClass(/\bdark\b/)

    await page.getByRole('button', { name: 'Switch to dark theme' }).click()
    await expect(html).toHaveClass(/\bdark\b/)
    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()

    const nav = page.getByRole('navigation', { name: 'Main' })
    await nav.getByRole('link', { name: 'Components' }).click()
    await expect(page).toHaveURL(/\/components$/)
    await expect(html).toHaveClass(/\bdark\b/)

    await page.goto('/components/connection-card')
    await expect(html).toHaveClass(/\bdark\b/)
    await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()

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
    // The layout ships a parser-blocking appearance script in <head>: a copy at
    // the top of <body> is not early enough — a slow-streaming document can
    // paint the body's background before reaching it.
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

    // rAF callbacks run before their frame paints, so a class observed in the
    // first frame where <body> exists was in place for the first visible paint.
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

    await expect(page.locator('html')).toHaveClass(/\bdark\b/)
  })
})
