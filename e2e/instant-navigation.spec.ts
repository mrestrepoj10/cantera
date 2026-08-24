import { instant } from '@next/playwright'
import { expect, test } from '@playwright/test'

test.describe('Next.js 16.3 instant navigations', () => {
  test('the demo reveals its route shell instantly', async ({ page }) => {
    await page.goto('/')
    const demoLink = page.getByRole('navigation', { name: 'Main' }).getByRole('link', {
      name: 'Demo',
    })
    await expect(demoLink).toBeVisible()
    await page.waitForLoadState('networkidle')

    await instant(page, async () => {
      await demoLink.click()
      await expect(page.getByRole('heading', { level: 1, name: 'Live demo' })).toBeVisible()
    })
  })

  test('catalog links prefetch URL-specific component documentation', async ({ page }) => {
    test.skip(!process.env.CI, 'Next.js route prefetching is disabled by the development server')
    await page.goto('/components')
    // The catalog grid lives in the page's article; the sidebar nav renders
    // the same link twice (mobile disclosure and desktop aside).
    const componentLink = page
      .getByRole('article')
      .getByRole('link', { name: 'Sign-In Card', exact: true })
    await componentLink.scrollIntoViewIfNeeded()
    await expect(componentLink).toBeVisible()
    await page.waitForLoadState('networkidle')

    await instant(page, async () => {
      await componentLink.click()
      await expect(page.getByRole('heading', { level: 1, name: 'Sign-In Card' })).toBeVisible()
    })
  })
})
