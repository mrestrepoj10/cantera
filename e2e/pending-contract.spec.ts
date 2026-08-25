import { expect, test } from '@playwright/test'

import { waitForHydration } from './hydration'

// The docs demo drives ConnectionCard with a ~900ms promise, so the pending
// window is real and observable rather than mocked.
test('ConnectionCard keeps its disconnect button mounted, labelled and disabled while pending', async ({
  page,
}) => {
  await page.goto('/components/connection-card')
  await waitForHydration(page)

  const card = page.locator('[data-slot="connection-card"]')
  const disconnect = card.getByRole('button', { name: 'Disconnect' })
  await expect(disconnect).toBeEnabled()

  // A remount would stop the pre-click handle from resolving to the live node.
  const handle = await disconnect.elementHandle()
  await disconnect.click()

  await expect(disconnect).toHaveAttribute('aria-busy', 'true')
  await expect(disconnect).toHaveAccessibleName('Disconnect')
  // aria-disabled, never the native attribute: the pending control stays
  // discoverable and focusable.
  await expect(disconnect).toHaveAttribute('aria-disabled', 'true')
  await expect(disconnect).not.toHaveAttribute('disabled', /.*/)
  await expect(disconnect).toBeVisible()
  expect(
    await handle?.evaluate((node, live) => node === live, await disconnect.elementHandle()),
  ).toBe(true)
  await expect(disconnect.locator('.animate-spin')).toBeVisible()
  await expect(disconnect).toHaveText('Disconnect')

  await disconnect.focus()
  await expect(disconnect).toBeFocused()

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
  // The visible token is part of the name, so voice control can reach it.
  const versions = browser.getByRole('button', {
    name: 'v7, choose a version of Summit Tower Coordination.rvt',
  })
  const versionsHandle = await versions.elementHandle()
  await versions.click()

  await expect(versions).toHaveAttribute('aria-busy', 'true')
  await expect(versions).toHaveAccessibleName(
    'v7, choose a version of Summit Tower Coordination.rvt',
  )
  await expect(versions).toContainText('7')
  await expect(versions.locator('.animate-spin')).toBeVisible()
  expect(
    await versionsHandle?.evaluate((node, live) => node === live, await versions.elementHandle()),
  ).toBe(true)
  await expect(page.getByRole('button', { name: /^Version 6,/ })).toBeVisible({
    timeout: 5000,
  })
})
