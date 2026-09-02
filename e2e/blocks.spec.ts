import { readFileSync } from 'node:fs'
import path from 'node:path'
import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'

interface RegistryFile {
  items: { name: string; title: string; meta?: { kind?: string }; categories?: string[] }[]
}

const registry = JSON.parse(
  readFileSync(path.join(__dirname, '../apps/www/registry.json'), 'utf8'),
) as RegistryFile

const showcase = registry.items.filter(
  (item) => item.meta?.kind === 'block' || item.meta?.kind === 'template',
)

test('the blocks page lists every block and template, filtered by category', async ({ page }) => {
  await page.goto('/blocks')
  await waitForHydration(page)

  await expect(page.getByRole('heading', { level: 2, name: 'Templates' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Blocks' })).toBeVisible()
  for (const item of showcase) {
    await expect(page.locator(`article#${item.name}`), item.name).toBeVisible()
  }

  const uploads = showcase.filter((item) => item.categories?.includes('upload'))
  expect(uploads.length).toBeGreaterThan(0)

  await page.getByRole('button', { name: 'upload', exact: true }).click()
  for (const item of showcase) {
    const article = page.locator(`article#${item.name}`)
    if (uploads.includes(item)) await expect(article, item.name).toBeVisible()
    else await expect(article, item.name).toHaveCount(0)
  }

  await page.getByRole('button', { name: 'All', exact: true }).click()
  await expect(page.locator('article')).toHaveCount(showcase.length)
})

test('a block card carries the install, the prompt, and the composition', async ({ page }) => {
  await page.goto('/blocks')
  await waitForHydration(page)

  const article = page.locator('article#model-viewer-page')
  await expect(article.getByText('npx shadcn@latest add @cantera/model-viewer-page')).toBeVisible()
  await expect(
    article.getByRole('button', { name: /copy an agent prompt that installs model viewer page/i }),
  ).toBeVisible()
  await expect(article.getByText(/installs \d+ registry files/i)).toBeVisible()
  await expect(article.getByText(/model-browser/)).toBeVisible()
  await expect(article.getByRole('link', { name: /report a bug/i })).toHaveAttribute(
    'href',
    /github\.com\/mrestrepoj10\/cantera\/issues\/new/,
  )
})
