import Link from 'next/link'

import { registryItems } from '@/components/site/registry'

/** One card per registry item, linking to its docs page. Driven by registry.json. */
function ComponentGrid() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {registryItems.map((item) => (
        <li key={item.name}>
          <Link
            href={`/components/${item.name}`}
            className="flex h-full flex-col gap-1.5 rounded-lg border border-border p-5 outline-none transition-colors hover:border-foreground/25 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span className="flex items-baseline gap-2">
              <span className="font-mono text-[13px]">{item.name}</span>
              {item.type === 'registry:lib' && (
                <span className="font-mono text-[10px] text-muted-foreground uppercase">lib</span>
              )}
            </span>
            <span className="text-sm text-muted-foreground">{item.description}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export { ComponentGrid }
