import Link from 'next/link'

import { componentRegistryGroups } from '@/components/site/registry'

interface ComponentGridProps {
  headingLevel?: 2 | 3
}

function ComponentGrid({ headingLevel = 2 }: ComponentGridProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  return (
    <div className="flex flex-col gap-12">
      {componentRegistryGroups.map((group) => (
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
                  // Resolves the URL-specific content before the click; the
                  // shared route shell stays deduplicated across the grid.
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
