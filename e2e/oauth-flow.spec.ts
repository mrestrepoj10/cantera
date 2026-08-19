import { expect, test } from '@playwright/test'

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

  // Disconnect clears the grant and returns to the sign-in card.
  await page.getByRole('button', { name: 'Disconnect' }).click()
  await expect(page.getByRole('link', { name: /continue with autodesk/i })).toBeVisible()
})
