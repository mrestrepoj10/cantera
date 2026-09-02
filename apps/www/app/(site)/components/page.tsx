import type { Metadata } from 'next'
import Link from 'next/link'

import { componentRegistryGroups } from '@/components/site/registry'

export const metadata: Metadata = {
  title: 'Components',
  description: 'Cantera components, provider adapters, shared types, and design tokens.',
}

export default function ComponentsPage() {
  return (
    <div className="grid py-12 sm:py-16 xl:grid-cols-[minmax(0,1fr)_11rem] xl:gap-12">
      <article className="min-w-0 max-w-4xl">
        <header>
          <h1 className="text-balance font-semibold text-3xl tracking-tight">Components</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Construction UI built from plain typed props and callbacks. Pick a component, connect
            your data, and own the source in your application.
          </p>
        </header>

        <div className="mt-12 flex flex-col gap-12">
          {componentRegistryGroups.map((group) => (
            <section key={group.id} aria-labelledby={`${group.id}-heading`}>
              <h2
                id={`${group.id}-heading`}
                className="scroll-mt-28 font-semibold text-xl tracking-tight"
              >
                {group.title}
              </h2>
              <p className="mt-1 max-w-2xl text-muted-foreground text-sm">{group.description}</p>
              <ul className="mt-6 grid gap-x-10 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={`/components/${item.name}`}
                      prefetch={true}
                      className="focus-ring group flex min-h-11 items-center rounded-md font-medium text-sm underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-12 border-border border-t pt-8">
          <p className="text-muted-foreground text-sm">
            Looking for bigger pieces? Browse the{' '}
            <Link
              href="/blocks"
              className="focus-ring rounded-sm text-foreground underline underline-offset-4"
            >
              blocks
            </Link>{' '}
            and the ready-to-deploy{' '}
            <Link
              href="/templates"
              className="focus-ring rounded-sm text-foreground underline underline-offset-4"
            >
              templates
            </Link>
            .
          </p>
        </div>
      </article>

      <aside className="hidden xl:block">
        <nav aria-label="On this page" className="sticky top-24 py-1">
          <p className="mb-3 font-medium text-muted-foreground text-xs">On this page</p>
          <ul className="flex flex-col gap-1">
            {componentRegistryGroups.map((group) => (
              <li key={group.id}>
                <Link
                  href={`#${group.id}-heading`}
                  className="focus-ring flex min-h-8 items-center rounded-md text-muted-foreground text-sm transition-colors hover:text-foreground"
                >
                  {group.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  )
}
