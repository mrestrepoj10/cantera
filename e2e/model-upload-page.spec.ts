import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'

test('model upload page uploads into a chosen folder and tracks translation', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 960 })
  await page.goto('/view/model-upload-page')
  // The upload sign-in preselects the Manage files access level. Sam is this
  // spec's user: parallel specs signing in as the same emulator user clobber
  // each other's vault grant, and a narrower re-grant fails later refreshes.
  await page.getByRole('link', { name: /continue with autodesk/i }).click()
  await page.getByRole('button', { name: /sam ito/i }).click()
  await expect(page).toHaveURL(/\/view\/model-upload-page$/)
  await waitForHydration(page)

  await page.getByRole('combobox', { name: 'Project' }).click()
  await page.getByRole('option', { name: 'Sample Building' }).click()
  // A single top folder auto-selects; the subfolder select defaults to
  // uploading directly into it.
  await expect(page.getByRole('combobox', { name: 'Folder', exact: true })).toContainText(
    'Project Files',
  )

  const dropZone = page.getByRole('button', { name: /drag files here or browse/i })
  await expect(dropZone).toBeVisible()
  await page.locator('input[type=file]').setInputFiles({
    name: 'e2e-upload.rvt',
    mimeType: 'application/octet-stream',
    buffer: Buffer.alloc(64 * 1024, 7),
  })

  const row = page.getByRole('listitem').filter({ hasText: 'e2e-upload.rvt' })
  await expect(row).toBeVisible()
  await expect(row).toContainText(/Translating|Saving version/, { timeout: 15_000 })
  // The emulator simulates translation time; parallel workers stretch it.
  await expect(page.getByRole('button', { name: /upload complete/i })).toBeVisible({
    timeout: 120_000,
  })
})
