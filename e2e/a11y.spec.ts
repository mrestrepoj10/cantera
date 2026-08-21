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

const VIEWER_DOCS_ROUTES = new Set(['/components/aps-viewer', '/components/viewer-native-toolbar'])
// Autodesk Viewer 7.* owns and injects this subtree. Cantera cannot repair its
// roles or contrast; the docs state this inherited limitation. Everything we
// render around and over the canvas remains in the scan.
const AUTODESK_VIEWER_SELECTOR = '[data-aps-viewer] .adsk-viewing-viewer'

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

async function scan(page: Page, route: string) {
  let builder = new AxeBuilder({ page }).withTags(WCAG_AA)
  if (VIEWER_DOCS_ROUTES.has(route)) {
    builder = builder.exclude(AUTODESK_VIEWER_SELECTOR)
  }
  const { violations } = await builder.analyze()
  return violations as AxeViolation[]
}

/** True when the appearance the blocking theme script chose is the one we asked for. */
function isDark(page: Page) {
  return page.evaluate(() => document.documentElement.classList.contains('dark'))
}

// CI scans the full matrix. Locally only the light palette runs — the dark
// half doubles the wall clock and CI blocks the merge on it either way.
const appearances = process.env.CI ? (['light', 'dark'] as const) : (['light'] as const)

for (const appearance of appearances) {
  test.describe(`axe — ${appearance}`, () => {
    // next-themes defaults to `system`, so emulating the media query drives the
    // appearance through the same path a user on a dark OS takes.
    test.use({ colorScheme: appearance })

    for (const route of sitePages) {
      test(`${route} has no WCAG A/AA violations`, async ({ page }) => {
        // The viewer docs pages load a real model from the Autodesk CDN in the
        // background of the scan — same opt-in as the viewer specs.
        test.skip(
          VIEWER_DOCS_ROUTES.has(route) && !process.env.CI && !process.env.APS_E2E,
          'viewer docs pages load the real Autodesk CDN and model; opt in locally with APS_E2E=1',
        )
        await page.goto(route)
        await waitForHydration(page)
        // Guard against a green scan of the wrong palette.
        await expect.poll(() => isDark(page)).toBe(appearance === 'dark')

        const violations = await scan(page, route)
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
