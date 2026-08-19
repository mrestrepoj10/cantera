import Link from 'next/link'

import { CodeBlock } from '@/components/site/code-block'
import { ComponentGrid } from '@/components/site/component-grid'
import { ConnectionCardDemo, ScopePickerDemo, SignInCardDemo } from '@/components/site/demos'
import { InstallCommand } from '@/components/site/install-command'

const registryConfigSnippet = `{
  "registries": {
    "@cantera": "https://canteraui.xyz/r/{name}.json"
  }
}`

const ecosystem = [
  {
    name: 'cantera',
    href: 'https://github.com/mrestrepoj10/cantera',
    description: 'The components. shadcn-distributed, copy-paste-owned, data-agnostic.',
  },
  {
    name: 'aec-auth',
    href: 'https://github.com/mrestrepoj10/aec-auth',
    description: 'The token layer. APS and Procore OAuth flows, vault, refresh — on npm.',
  },
  {
    name: 'emulate',
    href: 'https://github.com/mrestrepoj10/emulate',
    description:
      'The APS emulator. A stateful OAuth sandbox — develop and demo without credentials.',
  },
]

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6">
      <section className="flex flex-col items-start gap-6 py-20 sm:py-28">
        <h1 className="text-balance font-semibold text-4xl tracking-tight sm:text-5xl">
          Construction UI. shadcn-native.
        </h1>
        <p className="max-w-xl text-balance text-lg text-muted-foreground">
          Components for AEC data — ACC-ready, source-agnostic. Install with the shadcn CLI, own the
          code.
        </p>
        <div className="flex w-full max-w-xl flex-col gap-3">
          <InstallCommand command="npx shadcn@latest add @cantera/sign-in-card" />
          <details className="group">
            <summary className="cursor-pointer list-none rounded-md font-mono text-muted-foreground text-xs outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
              <span className="group-open:hidden">Show one-time registry setup</span>
              <span className="hidden group-open:inline">One-time setup — components.json</span>
            </summary>
            <CodeBlock code={registryConfigSnippet} className="mt-2" />
          </details>
        </div>
      </section>

      <section className="border-border border-t py-16">
        <h2 className="text-balance font-semibold text-2xl tracking-tight">
          Data-agnostic by design
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
          Components take plain props and never fetch. The Autodesk provider and scope catalog below
          come from the <code className="font-mono text-[13px]">aps-oauth-preset</code> registry
          item; Procore is a hand-rolled object. Same components, any source. Click around — every
          demo is live.
        </p>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="flex flex-col gap-4 rounded-lg border border-border p-6">
            <p className="font-mono text-muted-foreground text-xs">sign-in-card</p>
            <div className="flex flex-1 items-center justify-center">
              <SignInCardDemo />
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-lg border border-border p-6">
            <p className="font-mono text-muted-foreground text-xs">scope-picker</p>
            <div className="flex flex-1 items-center">
              <ScopePickerDemo compact />
            </div>
          </div>
          <div className="flex flex-col gap-4 rounded-lg border border-border p-6">
            <p className="font-mono text-muted-foreground text-xs">connection-card</p>
            <div className="flex flex-1 items-center justify-center">
              <ConnectionCardDemo />
            </div>
          </div>
        </div>
      </section>

      <section className="border-border border-t py-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-semibold text-2xl tracking-tight">Components</h2>
          <Link
            href="/components"
            className="rounded-md text-muted-foreground text-sm outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            View all
          </Link>
        </div>
        <div className="mt-8">
          <ComponentGrid />
        </div>
      </section>

      <section className="border-border border-t py-16">
        <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-border p-8 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <h2 className="font-semibold text-lg tracking-tight">See it wired end to end</h2>
            <p className="text-muted-foreground text-sm">
              Try the full OAuth flow — no Autodesk account needed. It runs against an embedded APS
              emulator.
            </p>
          </div>
          <Link
            href="/demo"
            className="shrink-0 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm outline-none transition-opacity hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Open the demo
          </Link>
        </div>
      </section>

      <section className="border-border border-t py-16">
        <h2 className="font-semibold text-2xl tracking-tight">The stack around it</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm">
          cantera is the UI layer of a small open ecosystem — each piece works alone, together they
          are the five-minute ACC path.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {ecosystem.map((project) => (
            <a
              key={project.name}
              href={project.href}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col gap-1.5 rounded-lg border border-border p-5 outline-none transition-colors hover:border-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="font-mono text-[13px]">{project.name}</span>
              <span className="text-muted-foreground text-sm">{project.description}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}
