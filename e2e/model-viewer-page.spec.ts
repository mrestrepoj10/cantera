import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'

test('model viewer shell browses, finds, and adapts without clipping', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/view/model-viewer-page')
  await page.getByRole('link', { name: /continue with autodesk/i }).click()
  await page.getByRole('button', { name: /test user/i }).click()
  await expect(page).toHaveURL(/\/view\/model-viewer-page$/)
  await waitForHydration(page)

  const main = page.getByRole('main')
  const tree = page.getByRole('tree', { name: 'Project files' })
  const sidebarToggle = main.getByRole('button', { name: 'Toggle Sidebar' })

  await expect(main.getByRole('heading', { name: 'Model viewer' })).toBeVisible()
  await expect(main.getByRole('button', { name: 'Sign out of Autodesk' })).toBeVisible()
  await expect(tree).toBeVisible()

  await sidebarToggle.click()
  await expect(tree).toBeHidden()
  await sidebarToggle.click()
  await expect(tree).toBeVisible()

  for (const name of ['Emulate Construction Hub', 'Sample Building']) {
    await tree.getByRole('treeitem', { name, exact: true }).click()
  }

  // Expanding into the project scopes the finder to it, which renames its trigger.
  await page.getByRole('button', { name: 'Search in Sample Building' }).click()
  const finder = page.getByRole('dialog', { name: 'Find a file' })
  await expect(finder.getByText('Searching in Sample Building')).toBeVisible()
  await finder.getByRole('combobox', { name: 'Find a file' }).fill('structural')
  // structural.rvt sits two unopened folders deep: picking the remote result
  // loads, expands, and selects its path in the tree.
  await finder.getByRole('option', { name: /structural\.rvt/ }).click()
  for (const name of ['Project Files', 'Plans', 'Coordination']) {
    await expect(tree.getByRole('treeitem', { name, exact: true })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  }
  await expect(tree.getByRole('treeitem', { name: 'structural.rvt' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  await expect(main.getByText('structural.rvt', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Search in Sample Building' }).click()
  await finder.getByRole('combobox', { name: 'Find a file' }).fill('sample')
  await finder.getByRole('option', { name: /sample\.rvt/ }).click()
  await expect(tree.getByRole('treeitem', { name: 'sample.rvt' })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  await page.setViewportSize({ width: 390, height: 844 })
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    )
    .toBe(true)
  await main.getByRole('button', { name: 'Toggle Sidebar' }).click()
  await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Sidebar' }).getByRole('tree')).toBeVisible()
})
