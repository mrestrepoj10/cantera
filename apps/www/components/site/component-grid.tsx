import Link from 'next/link'

import { registryItems } from '@/components/site/registry'

const typeTag: Partial<Record<string, string>> = {
  'registry:lib': 'lib',
  'registry:item': 'tokens',
  'registry:block': 'block',
}

/** One card per registry item, linking to its docs page. Driven by registry.json. */
function ComponentGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {registryItems.map((item) => {
        const tag = typeTag[item.type]
        return (
          <li key={item.name}>
            <Link
              href={`/components/${item.name}`}
              className="focus-ring flex h-full flex-col gap-1.5 rounded-lg border border-border p-5 transition-colors hover:border-foreground/25"
            >
              <span className="flex items-baseline gap-2">
                <span className="font-mono text-code">{item.name}</span>
                {tag && (
                  <span className="font-mono text-muted-foreground text-xs uppercase tracking-wide">
                    {tag}
                  </span>
                )}
              </span>
              <span className="text-muted-foreground text-sm">{item.description}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export { ComponentGrid }
