import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'

test('full sign-in flow through the embedded APS emulator', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByRole('link', { name: /continue with autodesk/i })).toBeVisible()

  await page.getByRole('link', { name: /continue with autodesk/i }).click()

  await expect(page.getByText('Sign in with Autodesk')).toBeVisible()
  await page.getByRole('button', { name: /maria renteria/i }).click()

  await expect(page).toHaveURL(/\/demo$/)
  await expect(page.getByText('Maria Renteria')).toBeVisible()
  await expect(page.getByText('maria@builders.example')).toBeVisible()
  await expect(page.getByText('Connected')).toBeVisible()

  await expect(page.getByText('user-profile:read')).toBeVisible()
  await expect(page.getByText('viewables:read')).toBeVisible()

  await expect(page.getByRole('combobox', { name: 'Hub' })).toContainText('Ridgeline Builders')
  await expect(page.getByRole('combobox', { name: 'Project' })).toContainText('Summit Tower')
  await expect(page.getByRole('combobox', { name: 'Version set' })).toContainText('IFC 2026-03')
  await expect(page.getByText('summit-tower-arch.rvt')).toBeVisible()
  await expect(page.locator('[data-slot="model-status-card"][data-status="success"]')).toBeVisible()

  // The redirect landed a fresh document: a click that races hydration lands
  // on a picker with no handlers yet.
  await waitForHydration(page)
  await expect(page.locator('[data-slot="acc-workflow-panel"]')).toHaveAttribute(
    'data-hydrated',
    'true',
  )
  await page.getByRole('combobox', { name: 'Project' }).click()
  await page.getByRole('option', { name: 'Cedar Mill Campus' }).click()
  await expect(page.getByRole('combobox', { name: 'Version set' })).toContainText('IFC 2026-05')
  // Exact match: the failed card's error prose quotes the same file name.
  await expect(page.getByText('cedar-mill-site.nwd', { exact: true })).toBeVisible()
  await expect(page.locator('[data-slot="model-status-card"][data-status="failed"]')).toBeVisible()

  await page.getByRole('button', { name: 'Disconnect' }).click()
  await expect(page.getByRole('link', { name: /continue with autodesk/i })).toBeVisible()
})
