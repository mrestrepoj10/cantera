import type { Metadata } from 'next'
import Link from 'next/link'

import { CodeBlock } from '@/components/site/code-block'
import { PackageManagerProvider, PackageManagerTabs } from '@/components/site/package-manager-tabs'
import { registryConfigSnippet } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Installation',
  description:
    'Add the @cantera registry to your shadcn project, install items with the CLI, and theme the status tokens.',
}

const initCommands = {
  npm: 'npx shadcn@latest init',
  pnpm: 'pnpm dlx shadcn@latest init',
  bun: 'bunx --bun shadcn@latest init',
}

const addComponentCommands = {
  npm: 'npx shadcn@latest add @cantera/sign-in-card',
  pnpm: 'pnpm dlx shadcn@latest add @cantera/sign-in-card',
  bun: 'bunx --bun shadcn@latest add @cantera/sign-in-card',
}

const addBlockCommands = {
  npm: 'npx shadcn@latest add @cantera/acc-sign-in',
  pnpm: 'pnpm dlx shadcn@latest add @cantera/acc-sign-in',
  bun: 'bunx --bun shadcn@latest add @cantera/acc-sign-in',
}

const overrideTokensSnippet = `/* app/globals.css — after the CLI has written the tokens. */
:root {
  --status-warning: oklch(0.52 0.11 72);
  --status-warning-foreground: oklch(0.99 0.01 85);
  --status-warning-surface: oklch(0.955 0.045 85);
}

.dark {
  --status-warning: oklch(0.8 0.14 80);
  --status-warning-foreground: oklch(0.2 0.04 80);
  --status-warning-surface: oklch(0.29 0.05 80);
}`

const contrastOverrideSnippet = `/* app/globals.css — the two stock pairs that measure under WCAG AA in light mode. */
:root {
  /* Stock oklch(0.556 0 0) on --muted measures 4.35:1. This clears 4.8:1. */
  --muted-foreground: oklch(0.53 0 0);
  /* The primitives render destructive as ink on a 10% tint of itself, which
     measures 4.06:1 at the stock oklch(0.577 0.245 27.325). This clears 4.8:1. */
  --destructive: oklch(0.51 0.245 27.325);
}`

const tsconfigSnippet = `{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}`

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

export default function InstallationPage() {
  return (
    <PackageManagerProvider>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-12 sm:py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-balance font-semibold text-3xl tracking-tight">Installation</h1>
          <p className="text-muted-foreground">
            cantera is a shadcn registry, not an npm package. The CLI copies the source into your
            project, where it renders on your own primitives and theme — you own the code from
            there.
          </p>
        </header>

        <Section id="shadcn" title="1. Set up shadcn">
          <p className="text-muted-foreground text-sm">
            Skip this if your project already has a{' '}
            <code className="font-mono text-code">components.json</code>. cantera builds on your
            configured base and style, so whatever you pick here is what the components inherit.
          </p>
          <PackageManagerTabs label="Package manager for shadcn init" commands={initCommands} />
        </Section>

        <Section id="registry" title="2. Add the @cantera namespace">
          <p className="text-muted-foreground text-sm">
            One-time edit to <code className="font-mono text-code">components.json</code>. It maps
            the namespace onto this site's static registry, so the CLI can resolve{' '}
            <code className="font-mono text-code">@cantera/&lt;item&gt;</code> by name.
          </p>
          <CodeBlock code={registryConfigSnippet} lang="json" filename="components.json" />
          <p className="text-muted-foreground text-sm">
            Registry namespaces need shadcn 3 or newer. Nothing else changes: your existing{' '}
            <code className="font-mono text-code">aliases</code> and style stay as they are.
          </p>
        </Section>

        <Section id="items" title="3. Install items">
          <p className="text-muted-foreground text-sm">
            Add any item by name. The CLI pulls the shadcn primitives it needs from your configured
            base, and the cantera items it depends on from this registry.
          </p>
          <PackageManagerTabs
            label="Package manager for adding a component"
            commands={addComponentCommands}
          />
          <p className="text-muted-foreground text-sm">
            Blocks work the same way. The Autodesk sign-in block installs a working{' '}
            <code className="font-mono text-code">/sign-in</code> page, the{' '}
            <code className="font-mono text-code">/api/auth/*</code> route handlers, and the auth
            wiring on aec-auth.
          </p>
          <PackageManagerTabs
            label="Package manager for adding a block"
            commands={addBlockCommands}
          />
          <p className="text-muted-foreground text-sm">
            Every item, with a live preview and the exact source the CLI writes, is on the{' '}
            <Link
              href="/components"
              className="focus-ring rounded-md underline underline-offset-4 hover:text-foreground"
            >
              components pages
            </Link>
            .
          </p>
        </Section>

        <Section id="path-aliases" title="Path aliases — the one thing that bites">
          <p className="text-muted-foreground text-sm">
            The installed files import their neighbours by alias:{' '}
            <code className="font-mono text-code">@/components/ui/button</code>,{' '}
            <code className="font-mono text-code">@/lib/oauth-types</code>. Those resolve through
            the <code className="font-mono text-code">aliases</code> block in components.json and
            the <code className="font-mono text-code">paths</code> block in tsconfig.json, and{' '}
            <code className="font-mono text-code">shadcn add</code> will rewrite{' '}
            <code className="font-mono text-code">paths</code> to its own default when it decides
            your config needs normalizing.
          </p>
          <CodeBlock code={tsconfigSnippet} lang="json" filename="tsconfig.json" />
          <p className="text-muted-foreground text-sm">
            So: check <code className="font-mono text-code">paths</code> after your first{' '}
            <code className="font-mono text-code">shadcn add</code> and restore your own mappings if
            the CLI flattened them. We hit this in cantera's own repo — the site resolves{' '}
            <code className="font-mono text-code">@/components/ui/*</code> to the registry sources
            through a fallback list, and every{' '}
            <code className="font-mono text-code">shadcn add</code> run in the app has to have it
            restored from the git diff.
          </p>
        </Section>

        <Section id="theming" title="Theming">
          <p className="text-muted-foreground text-sm">
            Every status in cantera renders from four semantic colors rather than from a badge
            variant: <code className="font-mono text-code">success</code> is healthy,{' '}
            <code className="font-mono text-code">warning</code> is recoverable and needs attention
            (expiring and expired grants both live here),{' '}
            <code className="font-mono text-code">danger</code> is a failure the user must act on,
            and <code className="font-mono text-code">neutral</code> is absence.
          </p>
          <h3 className="font-medium text-sm">What @cantera/status-tokens installs</h3>
          <p className="text-muted-foreground text-sm">
            Twelve CSS variables in <code className="font-mono text-code">:root</code> and{' '}
            <code className="font-mono text-code">.dark</code> — each tone plus a{' '}
            <code className="font-mono text-code">-foreground</code> (ink on the solid fill) and a{' '}
            <code className="font-mono text-code">-surface</code> (soft background, which always
            carries <code className="font-mono text-code">text-status-*</code> ink) — and the{' '}
            <code className="font-mono text-code">@theme inline</code> wiring that turns them into{' '}
            <code className="font-mono text-code">bg-status-*</code> and{' '}
            <code className="font-mono text-code">text-status-*</code> utilities. Each utility
            resolves as <code className="font-mono text-code">var(--token, var(--fallback))</code>,
            so a theme that never defines the variables still renders readable text instead of
            nothing. It comes along with any component that shows status, so you rarely install it
            by hand.
          </p>
          <h3 className="font-medium text-sm">Overriding the tokens</h3>
          <p className="text-muted-foreground text-sm">
            Redefine the variables in your own stylesheet, after the CLI has written them. Keep the
            meanings: one color, one meaning is what makes a wall of connection cards readable at a
            glance. Text on a surface wants 4.5:1 or better, non-text fills 3:1, in both
            appearances.
          </p>
          <CodeBlock code={overrideTokensSnippet} lang="css" filename="globals.css" />
          <h3 className="font-medium text-sm">Two stock pairs measure under AA</h3>
          <p className="text-muted-foreground text-sm">
            Not cantera's tokens — shadcn's own, in light mode.{' '}
            <code className="font-mono text-code">--muted-foreground</code> on{' '}
            <code className="font-mono text-code">--muted</code> measures 4.35:1, and the
            destructive button renders its ink on a 10% tint of itself at 4.06:1. Both are under the
            4.5:1 the components are held to, so cantera's own components avoid depending on either
            pair. If you want the rest of your app to clear AA too, these are the values we use:
          </p>
          <CodeBlock code={contrastOverrideSnippet} lang="css" filename="globals.css" />
        </Section>

        <Section id="why" title="Why it is built this way">
          <p className="text-muted-foreground text-sm">
            Every item is CI-verified to install lint-clean: the whole registry is laid out in a
            scratch consumer project and run through a fresh create-next-app&apos;s own gates —
            ESLint with eslint-config-next at zero warnings, and strict tsc — on every change. Your
            first <code className="font-mono text-code">lint</code> after an install has nothing to
            say about code you did not write.
          </p>
          <p className="text-muted-foreground text-sm">
            The rules behind the tokens, the pending states, and the 44px targets are written down:{' '}
            <Link
              href="/philosophy"
              className="focus-ring rounded-md underline underline-offset-4 hover:text-foreground"
            >
              Philosophy
            </Link>{' '}
            covers what every item is held to, and{' '}
            <Link
              href="/stack"
              className="focus-ring rounded-md underline underline-offset-4 hover:text-foreground"
            >
              the stack
            </Link>{' '}
            covers how cantera, aec-auth, and the APS emulator fit together — including the
            environment variables the blocks read and the credential-free way to run them.
          </p>
        </Section>
      </div>
    </PackageManagerProvider>
  )
}
