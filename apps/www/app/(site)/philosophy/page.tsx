import type { Metadata } from 'next'
import Link from 'next/link'

import { CodeBlock } from '@/components/site/code-block'

export const metadata: Metadata = {
  title: 'Philosophy',
  description:
    'Why cantera is a system rather than a gallery: theme inheritance, semantic status tokens, the types-adapters-blocks pattern, and the contracts every item is held to.',
}

const adapterSnippet = `// The generic type every component speaks — no provider anywhere in it.
interface OAuthConnection {
  provider: OAuthProvider
  status: 'connected' | 'expired' | 'error' | 'disconnected'
  account?: OAuthAccount
  scopes?: string[]
  expiresAt?: Date
}

// The Autodesk adapter, a separate registry item, translates into it.
const connection = fromApsUserInfo(userInfo, { scopes, expiresAt })

// The component takes it and renders. It has never heard of Autodesk.
<ConnectionCard connection={connection} onDisconnect={disconnect} />`

const statusSnippet = `/* Every status renders from the same four tones, in both appearances. */
--status-success: /* healthy */;
--status-warning: /* recoverable — expiring and expired both live here */;
--status-danger:  /* a failure the user must act on */;
--status-neutral: /* absence — never connected */;

/* Each with a -foreground (ink on the solid fill) and a -surface companion,
   mapped so a theme that never defines them still renders readable text. */
--color-status-warning: var(--status-warning, var(--foreground));`

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="flex scroll-mt-20 flex-col gap-4 border-border border-t pt-10">
      <h2 className="font-semibold text-xl tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

/** Inline identifier, the site's code type role. */
function C({ children }: { children: React.ReactNode }) {
  return <code className="font-mono text-code">{children}</code>
}

export default function PhilosophyPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12 sm:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-balance font-semibold text-3xl tracking-tight">Philosophy</h1>
        <p className="text-muted-foreground">
          Construction software is full of interfaces that were designed once and copied forever.
          cantera is the other thing: a small system with rules you can check, distributed as source
          you own. What follows is the stance, and how each part of it is enforced.
        </p>
      </header>

      <Section id="system" title="A system, not a gallery">
        <p className="text-muted-foreground text-sm">
          A gallery ships pretty screenshots and a palette to match. A system ships parts that stay
          coherent inside someone else's product. cantera never ships a restyled primitive: items
          declare shadcn primitives — <C>button</C>, <C>card</C>, <C>dialog</C> — as registry
          dependencies and inherit whatever base, style, and theme the consuming project already
          configured. Install a connection card into a project with rounded corners and a warm
          neutral, and it arrives rounded and warm.
        </p>
        <p className="text-muted-foreground text-sm">
          That means no hardcoded palettes. There is no hex value in a distributed component. Color
          arrives as tokens, and the only vocabulary cantera adds on top of shadcn's is the semantic
          status palette — four meanings, not four decorations.
        </p>
        <CodeBlock code={statusSnippet} lang="css" />
        <p className="text-muted-foreground text-sm">
          One color, one meaning is what makes a wall of connection cards readable at a glance.
          Expired is <C>warning</C>, not <C>danger</C> — a refresh away, not a failure. A generic{' '}
          <C>secondary</C> badge reads as gray nothing and <C>destructive</C> collapses "expired"
          into "broken", so status never renders from a badge variant. The same twelve tokens are
          exported typed, as <C>statusCssVars</C>, for inline styles and chart series, so nobody
          hand-types a variable name.
        </p>
      </Section>

      <Section id="pattern" title="The locked pattern">
        <p className="text-muted-foreground text-sm">
          Every domain cantera covers — today OAuth, later issues, RFIs, submittals, model viewers —
          is built in the same three layers, and new work stays inside them:
        </p>
        <ol className="flex flex-col gap-3 text-muted-foreground text-sm">
          <li>
            <span className="font-medium text-foreground">Generic types.</span> The vocabulary
            components speak: <C>OAuthProvider</C>, <C>OAuthScope</C>, <C>OAuthConnection</C>.
            Per-domain <C>registry:lib</C> items, never one monolithic types item, and never a
            provider's field names.
          </li>
          <li>
            <span className="font-medium text-foreground">Provider adapters.</span> Data-only
            presets that translate one API into those types. <C>aps-oauth-preset</C> carries
            Autodesk's provider metadata, scope catalog, scope bundles, and the adapters. A Procore
            preset lands the day aec-auth ships Procore, and no component changes.
          </li>
          <li>
            <span className="font-medium text-foreground">Wired blocks.</span> The
            batteries-included path: pages, route handlers, and the auth glue between them,
            composing the same components a hand-rolled integration would.
          </li>
        </ol>
        <CodeBlock code={adapterSnippet} />
        <p className="text-muted-foreground text-sm">
          The test is simple: if a component's props mention a vendor, the layering is wrong.
        </p>
      </Section>

      <Section id="never-fetch" title="Components never fetch">
        <p className="text-muted-foreground text-sm">
          Data comes in as props and decisions go out as callbacks. No component opens a request, no
          component reads a cookie, no component knows where its data came from. That is what lets
          the same <C>connection-card</C> render an Autodesk grant from a server component, a
          Procore grant from a hand-rolled object, and a fixture in a test — and it is why the
          landing page can demo the real components against the Autodesk preset and a hand-written
          Procore provider side by side, with no adapter in the component.
        </p>
        <p className="text-muted-foreground text-sm">
          Tokens are the sharpest case. Refresh, storage, and rotation are genuinely hard and
          genuinely dangerous, so they live in{' '}
          <a
            href="https://github.com/mrestrepoj10/aec-auth"
            target="_blank"
            rel="noreferrer"
            className="focus-ring rounded-md underline underline-offset-4 hover:text-foreground"
          >
            aec-auth
          </a>
          , a real npm package with a real version number. cantera renders; it never implements
          OAuth mechanics beyond a block's thin route wiring.{' '}
          <Link
            href="/stack"
            className="focus-ring rounded-md underline underline-offset-4 hover:text-foreground"
          >
            How the pieces compose
          </Link>{' '}
          is its own page.
        </p>
      </Section>

      <Section id="contracts" title="Contracts, not preferences">
        <p className="text-muted-foreground text-sm">
          Three rules bind every item in the registry. They are not style opinions — code that
          breaks them is wrong here, and each one is checked.
        </p>
        <h3 className="font-medium text-sm">Async pending</h3>
        <p className="text-muted-foreground text-sm">
          Every component with an async callback exposes a pending state, and pending means
          disabled-with-spinner-while-keeping-the-label. Never a label swapped for "Loading…", never
          a collapsed control, never an element that changes type mid-action — a button that becomes
          an anchor under a pressed finger loses focus and loses the screen reader. Pending is both
          a prop the consumer drives (<C>loading</C>, <C>disconnectPending</C>,{' '}
          <C>loadingProvider</C>, for server actions where no promise comes back) and an internal
          state a returned promise drives for you. Disabled controls render <C>aria-disabled</C>,
          not the native attribute, so they stay focusable.
        </p>
        <h3 className="font-medium text-sm">Field density</h3>
        <p className="text-muted-foreground text-sm">
          This UI is used with gloves, on a tablet, on site — a screen at arm's length competing
          with daylight, operated by a hand that is not precise. So primary actions carry a 44px
          minimum touch target, comfortable density is the default and compact is opt-in, and 12px
          is the text floor: there is no <C>text-[10px]</C> anywhere in the registry. Text clears
          4.5:1 against its surface and non-text fills clear 3:1, in both appearances. Focus
          indicators are a full-alpha 2px outline, because a 50%-alpha ring measures 1.54:1 and does
          not clear the 3:1 bar.
        </p>
        <h3 className="font-medium text-sm">A tested a11y bar</h3>
        <p className="text-muted-foreground text-sm">
          The bar is enforced, not asserted. Playwright runs axe over every route on this site in
          both appearances, and the docs pages render the exact registry sources the CLI installs —
          so a green scan here is a green scan on the distributed components, not on a marketing
          page around them. The registry has its own verifiers: every distributed file may only
          import what its item installs, every npm import must be declared, the committed build
          output is rebuilt and compared byte for byte, and every file is laid out in a scratch
          consumer project and held to a fresh create-next-app&apos;s own gates — ESLint with
          eslint-config-next at zero warnings, and tsc under strict mode — so an install never
          starts with lint errors in code you did not write.
        </p>
      </Section>

      <Section id="no-package" title="No npm package, by design">
        <p className="text-muted-foreground text-sm">
          cantera is a registry. <C>npx shadcn@latest add @cantera/sign-in-card</C> copies the
          source into your project, where it becomes your file — editable, reviewable in your diffs,
          with no dependency to upgrade and no maintainer between you and a change you need at 6am
          on a site trailer. The construction shops that need this UI most are the ones least able
          to wait on someone else's release.
        </p>
        <p className="text-muted-foreground text-sm">
          The trade is real and worth naming: no automatic upgrades. The registry is latest-wins,
          and history lives in git tags and the changelog. What you get for that is a codebase with
          no cantera in its dependency tree — only code you own, built on primitives you already
          had.
        </p>
      </Section>

      <Section id="next" title="Where to go next">
        <ul className="flex flex-col gap-2 text-muted-foreground text-sm">
          <li>
            <Link
              href="/stack"
              className="focus-ring rounded-md underline underline-offset-4 hover:text-foreground"
            >
              The AEC frontend stack
            </Link>{' '}
            — how cantera, aec-auth, and the APS emulator compose.
          </li>
          <li>
            <Link
              href="/components"
              className="focus-ring rounded-md underline underline-offset-4 hover:text-foreground"
            >
              Components
            </Link>{' '}
            — every item, with a live preview and the exact installed source.
          </li>
          <li>
            <Link
              href="/installation"
              className="focus-ring rounded-md underline underline-offset-4 hover:text-foreground"
            >
              Installation
            </Link>{' '}
            — the registry namespace, path aliases, and theming the status tokens.
          </li>
        </ul>
      </Section>
    </div>
  )
}
