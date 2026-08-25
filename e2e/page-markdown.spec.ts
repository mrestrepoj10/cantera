import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'
import { markdownPages } from './pages'

test.describe('markdown pages', () => {
  test('every catalog item serves its markdown twin', async ({ request }) => {
    for (const route of markdownPages) {
      // No redirect allowed: the URL that claims .md is the one that answers.
      const response = await request.get(route, { maxRedirects: 0 })

      expect.soft(response.status(), route).toBe(200)
      expect.soft(response.headers()['content-type'], route).toContain('text/markdown')

      const body = await response.text()
      expect.soft(body.startsWith('# '), route).toBe(true)
      expect.soft(body, route).toContain('npx shadcn@latest add @cantera/')
      expect.soft(body, route).not.toContain('<!DOCTYPE html>')
    }
  })
})

test.describe('page hand-off', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

  test('copies the page and links to the markdown, ChatGPT, and Claude', async ({ page }) => {
    await page.goto('/components/sign-in-card')
    await waitForHydration(page)

    const markdown = await (await page.request.get('/components/sign-in-card.md')).text()

    const viewAsMarkdown = page.getByRole('link', { name: /view sign-in card as markdown/i })
    await expect(viewAsMarkdown).toBeHidden()

    await page.getByRole('button', { name: /copy sign-in card page as markdown/i }).click()
    // Two live regions on the page — the install command has one too.
    await expect(
      page.getByRole('status').filter({ hasText: /copied the sign-in card page/i }),
    ).toHaveCount(1)
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(markdown)

    const toggle = page.getByRole('button', { name: /more ways to open sign-in card/i })
    await toggle.click()

    await expect(viewAsMarkdown).toHaveAttribute('href', '/components/sign-in-card.md')
    await expect(page.getByRole('link', { name: /open sign-in card in chatgpt/i })).toHaveAttribute(
      'href',
      /^https:\/\/chatgpt\.com\/\?q=.*sign-in-card\.md/,
    )
    await expect(page.getByRole('link', { name: /open sign-in card in claude/i })).toHaveAttribute(
      'href',
      /^https:\/\/claude\.ai\/new\?q=.*sign-in-card\.md/,
    )

    await page.keyboard.press('Escape')
    await expect(viewAsMarkdown).toBeHidden()
    await expect(toggle).toBeFocused()
  })
})
