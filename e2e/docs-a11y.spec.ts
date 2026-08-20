import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

import { docsPages } from './pages'

/**
 * The a11y shipping bar, enforced on the Blume docs app.
 *
 * `a11y.spec.ts` covers `www` — the landing page, the demo, and the framed
 * previews. It cannot cover this: the docs are a separate deployment on a
 * separate origin, with their own chrome, their own palette, and their own
 * generated markup. A green scan over there says nothing about the pages a
 * reader actually lands on here, and the reference pages are generated, so a
 * violation would arrive silently on every item at once.
 *
 * Both appearances are scanned because half the bar is contrast, and the two
 * palettes fail independently.
 */

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/**
 * Nodes excluded from the scan, each with the reason it cannot be fixed here.
 * Keep this list empty unless a violation is genuinely outside our own code.
 */
const EXCLUDED_SELECTORS: string[] = []

interface AxeViolation {
  id: string
  help: string
  impact?: string | null
  nodes: { target: unknown[] }[]
}

function formatViolations(violations: AxeViolation[]): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes.map((node) => `      ${node.target.join(' ')}`).join('\n')
      return `  [${violation.impact}] ${violation.id}: ${violation.help}\n${nodes}`
    })
    .join('\n')
}

async function scan(page: Page) {
  let builder = new AxeBuilder({ page }).withTags(WCAG_AA)
  for (const selector of EXCLUDED_SELECTORS) {
    builder = builder.exclude(selector)
  }
  const { violations } = await builder.analyze()
  return violations as AxeViolation[]
}

/** Blume drives dark mode from `data-theme` on the root element. */
function isDark(page: Page) {
  return page.evaluate(() => document.documentElement.dataset.theme === 'dark')
}

for (const appearance of ['light', 'dark'] as const) {
  test.describe(`docs axe — ${appearance}`, () => {
    // Blume defaults to `system`, so emulating the media query drives the
    // appearance through the same path a reader on a dark OS takes.
    test.use({ colorScheme: appearance })

    for (const route of docsPages) {
      test(`${route} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(route)
        // Guard against a green scan of the wrong palette.
        await expect.poll(() => isDark(page)).toBe(appearance === 'dark')

        const violations = await scan(page)
        // Assert on the rule ids so a failure diff stays readable; the full
        // node-by-node detail rides along in the message.
        expect(
          violations.map((violation) => violation.id),
          `\n${formatViolations(violations)}`,
        ).toEqual([])
      })
    }
  })
}
