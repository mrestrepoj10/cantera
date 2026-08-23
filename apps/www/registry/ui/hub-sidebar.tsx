'use client'

import { type ComponentProps, type ReactNode, useState } from 'react'

import { FinderDialog, type FinderProps, FinderTrigger } from '@/components/ui/finder'
import { HubTree, type HubTreeProps } from '@/components/ui/hub-tree'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

/**
 * HubSidebar — the finder above the tree in one sidebar, ordered so the fast
 * path (an input-shaped trigger opening the ⌘K palette) sits above the walk
 * (the hub tree). Pure composition of controlled components: it lays out and
 * forwards, and the wiring between them stays in the consumer's hands — a
 * finder `onReveal` becomes tree `expandedIds` + `selectedId` in one update.
 *
 * Render inside your own `SidebarProvider`, with the page content in
 * `SidebarInset` — this component is the sidebar itself, not the app shell.
 * `collapsible` and the other shadcn Sidebar props pass straight through; the
 * trigger compacts to an icon when the rail collapses to icon mode.
 */

export interface HubSidebarProps extends ComponentProps<typeof Sidebar> {
  /** Props forwarded to the ⌘K FinderDialog; the trigger reuses its placeholder. */
  finder: Omit<FinderProps, 'className'>
  /** Props forwarded to the HubTree in the content slot. */
  tree: HubTreeProps
  /** Rendered above the finder trigger (a hub switcher, a title). */
  header?: ReactNode
  /** Rendered in the sidebar footer. */
  footer?: ReactNode
}

function HubSidebar({ finder, tree, header, footer, ...props }: HubSidebarProps) {
  const [finderOpen, setFinderOpen] = useState(false)

  return (
    <Sidebar {...props}>
      <SidebarHeader className="gap-2">
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
