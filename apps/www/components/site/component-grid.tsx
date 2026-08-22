import Link from 'next/link'

import { registryGroups } from '@/components/site/registry'

interface ComponentGridProps {
  /**
   * Heading level for the section titles — 2 directly under a page h1, 3 when
   * the grid sits inside a section that already owns an h2.
   */
  headingLevel?: 2 | 3
}

/**
 * The catalog, one titled section per kind of registry item and one card per
 * item. Purely presentational — the grouping comes from components/site/registry.
 */
function ComponentGrid({ headingLevel = 2 }: ComponentGridProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  return (
    <div className="flex flex-col gap-12">
      {registryGroups.map((group) => (
        <section key={group.id} aria-labelledby={`${group.id}-heading`}>
          <Heading id={`${group.id}-heading`} className="font-semibold text-xl tracking-tight">
            {group.title}
          </Heading>
          <p className="mt-1 max-w-2xl text-muted-foreground text-sm">{group.description}</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => (
              <li key={item.name}>
                <Link
                  href={`/components/${item.name}`}
                  // The destination depends on its dynamic segment. Resolve
                  // that URL-specific content before the click, while the
                  // shared route shell remains deduplicated across the grid.
                  prefetch={true}
                  className="focus-ring flex h-full flex-col gap-1.5 rounded-lg border border-border p-5 transition-colors hover:border-foreground/25"
                >
                  <span className="font-mono text-code">{item.name}</span>
                  <span className="text-muted-foreground text-sm">{item.description}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export { ComponentGrid }
