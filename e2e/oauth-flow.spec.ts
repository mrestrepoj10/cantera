import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'

// The product's core promise: the acc-sign-in block completes a real OAuth
// flow against the embedded APS emulator — consent, code exchange, vault
// refresh custody, session — with zero credentials.
test('full sign-in flow through the embedded APS emulator', async ({ page }) => {
  await page.goto('/demo')
  await expect(page.getByRole('link', { name: /continue with autodesk/i })).toBeVisible()

  await page.getByRole('link', { name: /continue with autodesk/i }).click()

  // The emulator's consent page: pick a seeded user.
  await expect(page.getByText('Sign in with Autodesk')).toBeVisible()
  await page.getByRole('button', { name: /maria renteria/i }).click()

  // Back on the demo page, connected.
  await expect(page).toHaveURL(/\/demo$/)
  await expect(page.getByText('Maria Renteria')).toBeVisible()
  await expect(page.getByText('maria@builders.example')).toBeVisible()
  await expect(page.getByText('Connected')).toBeVisible()

  // Held scopes render as badges — preserved from the requested scopes even
  // though the emulator's token response omits a scope list.
  await expect(page.getByText('user-profile:read')).toBeVisible()
  await expect(page.getByText('viewables:read')).toBeVisible()

  // The workflow lights up on the same grant: hubs and projects read from the
  // emulator's Data Management endpoints, the issuance from ACC Sheets, and
  // the translation status from Model Derivative — all server-side, with this
  // user's bearer token.
  await expect(page.getByRole('combobox', { name: 'Hub' })).toContainText('Ridgeline Builders')
  await expect(page.getByRole('combobox', { name: 'Project' })).toContainText('Summit Tower')
  await expect(page.getByRole('combobox', { name: 'Version set' })).toContainText('IFC 2026-03')
  await expect(page.getByText('summit-tower-arch.rvt')).toBeVisible()
  await expect(page.locator('[data-slot="model-status-card"][data-status="success"]')).toBeVisible()

  // Picking another project re-reads the server: a different hub's projects,
  // a different issuance, different models. The redirect back landed a fresh
  // document, so wait for hydration before the first client interaction — a
  // click that races it lands on a picker with no handlers yet.
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

  // Disconnect clears the grant and returns to the sign-in card.
  await page.getByRole('button', { name: 'Disconnect' }).click()
  await expect(page.getByRole('link', { name: /continue with autodesk/i })).toBeVisible()
})
