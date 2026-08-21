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

test('HubBrowser keeps navigation and version controls stable while their promises settle', async ({
  page,
}) => {
  await page.goto('/components/hub-browser')
  await waitForHydration(page)

  const browser = page.locator('[data-slot="hub-browser"]')
  const folder = browser.getByRole('button', { name: 'Browse Design' })
  const folderHandle = await folder.elementHandle()
  await folder.click()

  await expect(folder).toHaveAttribute('aria-busy', 'true')
  await expect(folder).toHaveAttribute('aria-disabled', 'true')
  await expect(folder).toHaveAccessibleName('Browse Design')
  await expect(folder.locator('.animate-spin')).toBeVisible()
  expect(
    await folderHandle?.evaluate((node, live) => node === live, await folder.elementHandle()),
  ).toBe(true)

  await expect(
    browser.getByRole('button', { name: 'Open Summit Tower Coordination.rvt' }),
  ).toBeVisible({
    timeout: 5000,
  })
  const versions = browser.getByRole('button', {
    name: 'Choose version of Summit Tower Coordination.rvt',
  })
  const versionsHandle = await versions.elementHandle()
  await versions.click()

  await expect(versions).toHaveAttribute('aria-busy', 'true')
  await expect(versions).toHaveAccessibleName('Choose version of Summit Tower Coordination.rvt')
  await expect(versions).toContainText('7')
  await expect(versions.locator('.animate-spin')).toBeVisible()
  expect(
    await versionsHandle?.evaluate((node, live) => node === live, await versions.elementHandle()),
  ).toBe(true)
  await expect(page.getByRole('button', { name: /v6 summit tower coordination/i })).toBeVisible({
    timeout: 5000,
  })
})
