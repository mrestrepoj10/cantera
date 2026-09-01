import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'

test('model upload page uploads to the app bucket and tracks translation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  // Two-legged: the page needs no sign-in.
  await page.goto('/view/model-upload-page')
  await waitForHydration(page)

  const main = page.getByRole('main')
  await expect(main.getByRole('heading', { name: 'Model viewer' })).toBeVisible()

  await main.getByRole('button', { name: 'Upload models' }).click()
  const dialog = page.getByRole('dialog', { name: 'Upload models' })
  await expect(dialog).toBeVisible()
  await dialog.locator('input[type=file]').setInputFiles({
    name: 'e2e-bucket-upload.rvt',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(64 * 1024, 7),
  })

  const row = dialog.getByRole('listitem').filter({ hasText: 'e2e-bucket-upload.rvt' })
  await expect(row).toBeVisible()
  // The emulator simulates translation time; parallel workers stretch it.
  await expect(dialog.getByRole('button', { name: /upload complete/i })).toBeVisible({
    timeout: 120_000,
  })

  // The finished upload became the selection.
  await page.keyboard.press('Escape')
  const tree = page.getByRole('tree', { name: 'Uploaded models' })
  await expect(tree.getByRole('treeitem', { name: 'e2e-bucket-upload.rvt' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})
