import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'

/**
 * The async-pending contract from AGENTS.md, on the component that carries the
 * most destructive action in the registry. Pending is disabled-with-a-spinner
 * while the label stays put: no swap to "Loading…", no control that disappears
 * from under the cursor, no element-type change mid-action.
 *
 * The docs demo drives ConnectionCard with a ~900ms promise, so the pending
 * window is real and observable rather than mocked.
 */
test('ConnectionCard keeps its disconnect button mounted, labelled and disabled while pending', async ({
  page,
}) => {
  await page.goto('/components/connection-card')
  await waitForHydration(page)

  const card = page.locator('[data-slot="connection-card"]')
  const disconnect = card.getByRole('button', { name: 'Disconnect' })
  await expect(disconnect).toBeEnabled()

  // Capture the element handle before the click so a remount is detectable:
  // React would throw the node away and the handle would stop resolving.
  const handle = await disconnect.elementHandle()
  await disconnect.click()

  // Inside the pending window: same button, same label, same element.
  await expect(disconnect).toHaveAttribute('aria-busy', 'true')
  await expect(disconnect).toHaveAccessibleName('Disconnect')
  // `focusableWhenDisabled` means aria-disabled rather than the native
  // attribute — the control stays discoverable and focusable while it works.
  await expect(disconnect).toHaveAttribute('aria-disabled', 'true')
  await expect(disconnect).not.toHaveAttribute('disabled', /.*/)
  await expect(disconnect).toBeVisible()
  expect(
    await handle?.evaluate((node, live) => node === live, await disconnect.elementHandle()),
  ).toBe(true)
  // The spinner is the only thing that changed, and it never displaced the label.
  await expect(disconnect.locator('.animate-spin')).toBeVisible()
  await expect(disconnect).toHaveText('Disconnect')

  // A pending control still takes focus, which is the point of aria-disabled.
  await disconnect.focus()
  await expect(disconnect).toBeFocused()

  // Once the promise settles the demo flips to disconnected and the card
  // offers the inverse action.
  await expect(card.getByRole('button', { name: 'Connect' })).toBeVisible({ timeout: 5000 })
  await expect(disconnect).toHaveCount(0)
})
