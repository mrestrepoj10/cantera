'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarItem {
  name: string
  title: string
}

interface SidebarGroup {
  id: string
  title: string
  items: SidebarItem[]
}

function CatalogLinks({ groups, pathname }: { groups: SidebarGroup[]; pathname: string }) {
  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="mb-2 font-medium text-muted-foreground text-xs">Getting started</p>
        <Link
          href="/components"
          aria-current={pathname === '/components' ? 'page' : undefined}
          className="focus-ring flex min-h-8 items-center rounded-md px-2 text-sm transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:font-medium"
        >
          Overview
        </Link>
        <Link
          href="/installation"
          className="focus-ring flex min-h-8 items-center rounded-md px-2 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
        >
          Installation
        </Link>
        <Link
          href="/blocks"
          className="focus-ring flex min-h-8 items-center rounded-md px-2 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
        >
          Blocks
        </Link>
      </div>

      {groups.map((group) => (
        <div key={group.id}>
          <p className="mb-2 font-medium text-muted-foreground text-xs">{group.title}</p>
          <ul>
            {group.items.map((item) => {
              const href = `/components/${item.name}`
              const isCurrent = pathname === href
              return (
                <li key={item.name}>
                  <Link
                    href={href}
                    prefetch={true}
                    aria-current={isCurrent ? 'page' : undefined}
                    className="focus-ring flex min-h-8 items-center rounded-md px-2 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
                  >
                    {item.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function ComponentSidebar({ groups }: { groups: SidebarGroup[] }) {
  const pathname = usePathname()

  return (
    <>
      <details className="group mt-6 rounded-lg border border-border lg:hidden">
        <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between rounded-lg px-4 font-medium text-sm marker:content-none">
          Browse documentation
          <span aria-hidden="true" className="text-muted-foreground group-open:hidden">
            +
          </span>
          <span aria-hidden="true" className="hidden text-muted-foreground group-open:inline">
            −
          </span>
        </summary>
        <nav aria-label="Component documentation" className="border-border border-t p-3">
          <CatalogLinks groups={groups} pathname={pathname} />
        </nav>
      </details>

      <aside className="hidden lg:block">
        <nav
          aria-label="Component documentation"
          className="no-scrollbar sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto py-12 pr-6"
        >
          <CatalogLinks groups={groups} pathname={pathname} />
        </nav>
      </aside>
    </>
  )
}
