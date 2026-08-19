import AxeBuilder from '@axe-core/playwright'
import { expect, type Page, test } from '@playwright/test'

import { waitForHydration } from './hydration'
import { sitePages } from './pages'

/**
 * The a11y shipping bar from AGENTS.md, enforced. The docs pages render the
 * exact registry sources consumers install, so an axe pass here is a pass on
 * the distributed components — not just on the site chrome around them.
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

/** True when the appearance the blocking theme script chose is the one we asked for. */
function isDark(page: Page) {
  return page.evaluate(() => document.documentElement.classList.contains('dark'))
}

for (const appearance of ['light', 'dark'] as const) {
  test.describe(`axe — ${appearance}`, () => {
    // next-themes defaults to `system`, so emulating the media query drives the
    // appearance through the same path a user on a dark OS takes.
    test.use({ colorScheme: appearance })

    for (const route of sitePages) {
      test(`${route} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(route)
        await waitForHydration(page)
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
