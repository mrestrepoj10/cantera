import type { Page } from '@playwright/test'

/** Resolves once React has adopted the server markup — the fiber key React
 * attaches to host nodes is the framework's own signal that the tree is live. */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const node = document.body.firstElementChild
    return (
      Boolean(node) && Object.keys(node as object).some((key) => key.startsWith('__reactFiber$'))
    )
  })
}
