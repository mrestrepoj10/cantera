import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'
import { blockItems, templateItems } from './pages'

const catalogArticles = '#catalog article'

test('the blocks page lists every block, filtered by category', async ({ page }) => {
  await page.goto('/blocks')
  await waitForHydration(page)

  for (const item of blockItems) {
    await expect(page.locator(`article#${item.name}`), item.name).toBeVisible()
  }

  // Any category that some, but not all, blocks carry proves the filter narrows.
  const categories = [...new Set(blockItems.flatMap((item) => item.categories ?? []))]
  const category = categories.find((candidate) => {
    const count = blockItems.filter((item) => item.categories?.includes(candidate)).length
    return count > 0 && count < blockItems.length
  })
  expect(category).toBeDefined()
  const matching = blockItems.filter((item) => item.categories?.includes(category ?? ''))

  await page.getByRole('button', { name: category, exact: true }).click()
  for (const item of blockItems) {
    const article = page.locator(`article#${item.name}`)
    if (matching.includes(item)) await expect(article, item.name).toBeVisible()
    else await expect(article, item.name).toHaveCount(0)
  }

  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(page.locator(catalogArticles)).toHaveCount(blockItems.length)
})

test('the templates page lists every template', async ({ page }) => {
  await page.goto('/templates')
  await waitForHydration(page)

  for (const item of templateItems) {
    await expect(page.locator(`article#${item.name}`), item.name).toBeVisible()
  }
  await expect(page.locator('article')).toHaveCount(templateItems.length)
})

test('a template card carries the install, the prompt, and the composition', async ({ page }) => {
  await page.goto('/templates')
  await waitForHydration(page)

  const article = page.locator('article#model-viewer-page')
  await expect(article.getByText('npx shadcn@latest add @cantera/model-viewer-page')).toBeVisible()
  await expect(
    article.getByRole('button', { name: /copy an agent prompt that installs model viewer page/i }),
  ).toBeVisible()
  await expect(article.getByText(/installs \d+ registry files/i)).toBeVisible()
  await expect(article.getByText(/acc-auth-routes/)).toBeVisible()
  await expect(article.getByRole('link', { name: /report a bug/i })).toHaveAttribute(
    'href',
    /github\.com\/mrestrepoj10\/cantera\/issues\/new/,
  )
})
