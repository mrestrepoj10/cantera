import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'
import { markdownPages } from './pages'

/**
 * The `.md` twin of every docs page, and the hand-off control that points at it.
 *
 * The promise a `.md` URL makes is narrow and easy to break: it must answer
 * with markdown itself, not redirect to the HTML page and not fall through to
 * the app shell. That is what these assert, per item, so an added component
 * cannot ship a page without its markdown.
 */

test.describe('markdown pages', () => {
  for (const route of markdownPages) {
    test(`${route} serves markdown`, async ({ request }) => {
      // No redirect allowed: the URL that claims .md is the one that answers.
      const response = await request.get(route, { maxRedirects: 0 })

      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('text/markdown')

      const body = await response.text()
      expect(body.startsWith('# ')).toBe(true)
      expect(body).toContain('npx shadcn@latest add @cantera/')
      expect(body).not.toContain('<!DOCTYPE html>')
    })
  }
})

test.describe('page hand-off', () => {
  test.use({ permissions: ['clipboard-read', 'clipboard-write'] })

  test('copies the page and links to the markdown, ChatGPT, and Claude', async ({ page }) => {
    await page.goto('/components/sign-in-card')
    await waitForHydration(page)

    const markdown = await (await page.request.get('/components/sign-in-card.md')).text()

    // Closed by default: nothing inside the disclosure is reachable.
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

    // Escape closes the panel and hands focus back to the control that opened it.
    await page.keyboard.press('Escape')
    await expect(viewAsMarkdown).toBeHidden()
    await expect(toggle).toBeFocused()
  })
})
