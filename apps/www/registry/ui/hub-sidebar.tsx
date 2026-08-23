'use client'

import { type ComponentProps, type ReactNode, useState } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FinderDialog, type FinderProps, FinderTrigger } from '@/components/ui/finder'
import { HubTree, type HubTreeProps } from '@/components/ui/hub-tree'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'

/**
 * HubSidebar — who you are, then the fast path, then the walk: an identity
 * row (avatar + name, with the collapse toggle inline on its right), an
 * input-shaped trigger opening the ⌘K finder palette, and the hub tree.
 * Pure composition of controlled components: it lays out and forwards, and
 * the wiring between them stays in the consumer's hands — a finder
 * `onReveal` becomes tree `expandedIds` + `selectedId` in one update.
 *
 * Render inside your own `SidebarProvider`, with the page content in
 * `SidebarInset` — this component is the sidebar itself, not the app shell.
 * `collapsible` and the other shadcn Sidebar props pass straight through;
 * in icon mode the identity row keeps its avatar, the trigger compacts to
 * an icon, and the text yields.
 */

export interface HubSidebarUser {
  name: string
  /** Secondary line — a role, an email, the active hub. */
  detail?: string
  /** Avatar node (e.g. a generated mark). Falls back to initials. */
  avatar?: ReactNode
}

export interface HubSidebarProps extends ComponentProps<typeof Sidebar> {
  /** Props forwarded to the ⌘K FinderDialog; the trigger reuses its placeholder. */
  finder: Omit<FinderProps, 'className'>
  /** Props forwarded to the HubTree in the content slot. */
  tree: HubTreeProps
  /** Identity row pinned at the very top, with the collapse toggle inline. */
  user?: HubSidebarUser
  /** Rendered between the identity row and the finder trigger. */
  header?: ReactNode
  /** Rendered in the sidebar footer. */
  footer?: ReactNode
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase() ?? '')
    .join('')
}

function HubSidebar({ finder, tree, user, header, footer, ...props }: HubSidebarProps) {
  const [finderOpen, setFinderOpen] = useState(false)

  return (
    <Sidebar {...props}>
      <SidebarHeader className="gap-2">
        {user && (
          <div className="flex min-h-8 items-center gap-2 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-1">
            {user.avatar ?? (
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="text-xs">{initialsOf(user.name)}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium text-sm">{user.name}</span>
              {user.detail && (
                <span className="truncate text-muted-foreground text-xs">{user.detail}</span>
              )}
            </div>
            {/* Stays reachable when collapsed to the icon rail — the toggle is
                how you get back, so it never hides with the text. */}
            <SidebarTrigger className="shrink-0" />
          </div>
        )}
        {header}
        <FinderTrigger placeholder={finder.placeholder} onClick={() => setFinderOpen(true)} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <HubTree {...tree} />
        </SidebarGroup>
      </SidebarContent>
      {footer && <SidebarFooter>{footer}</SidebarFooter>}
      <SidebarRail />
      <FinderDialog open={finderOpen} onOpenChange={setFinderOpen} {...finder} />
    </Sidebar>
  )
}

export { HubSidebar }
