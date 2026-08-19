import type { Page } from '@playwright/test'

/**
 * Resolve once React has adopted the server markup.
 *
 * Scans and interactions that race hydration are flaky for reasons that have
 * nothing to do with the code under test, and the fiber key React attaches to
 * host nodes is the framework's own signal that the tree is live.
 */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const node = document.body.firstElementChild
    return (
      Boolean(node) && Object.keys(node as object).some((key) => key.startsWith('__reactFiber$'))
    )
  })
}
