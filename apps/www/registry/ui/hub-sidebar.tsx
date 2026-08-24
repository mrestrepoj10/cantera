'use client'

import { ChevronsUpDownIcon } from 'lucide-react'
import { type ComponentProps, Fragment, type ReactNode, useState } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FinderDialog, type FinderProps, FinderTrigger } from '@/components/ui/finder'
import { HubTree, type HubTreeProps } from '@/components/ui/hub-tree'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

/**
 * HubSidebar — who you are, then the fast path, then the walk: an identity
 * row (avatar + name opening an account menu, with the collapse toggle inline
 * on its right), an input-shaped trigger opening the ⌘K finder palette, and
 * the hub tree.
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

export interface HubSidebarUserAction {
  id: string
  label: string
  /** Leading icon node, sized by the menu (16px). */
  icon?: ReactNode
  onSelect: () => void
  /** Destructive ink — sign out, disconnect an account. */
  destructive?: boolean
  /** Open a new group: renders a separator above this item. */
  separatorBefore?: boolean
  disabled?: boolean
}

export interface HubSidebarUser {
  name: string
  /** Secondary line — a role, an email, the active hub. */
  detail?: string
  /** Avatar node (e.g. a generated mark). Falls back to initials. */
  avatar?: ReactNode
  /**
   * Account menu items. With any, the identity row becomes the menu's
   * trigger; with none it stays a plain, non-interactive label.
   */
  actions?: HubSidebarUserAction[]
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

/** Avatar plus the two text lines, shared by the row and the menu header. */
function UserIdentity({ user, collapsible }: { user: HubSidebarUser; collapsible?: boolean }) {
  return (
    <>
      {/* Sized here rather than by the caller: a sidebar menu button forces
          every descendant svg to 16px, which would shrink an SVG avatar to an
          icon while leaving an <img> one alone. */}
      {/* The avatar fills its button in the icon rail, hiding the row's hover
          fill — so hover and open read on the mark itself instead. The ring is
          sidebar-ring at both steps, not sidebar-border: the initials disc and
          the hover fill share the muted tone, so a hairline border-token ring
          dissolves with them. */}
      <span className="flex size-8 shrink-0 overflow-hidden rounded-lg ring-1 ring-transparent transition-[box-shadow] duration-150 ease-out group-hover/menu-button:ring-sidebar-ring/60 group-data-open/menu-button:ring-sidebar-ring [&>svg]:size-8!">
        {user.avatar ?? (
          <Avatar className="size-8 rounded-lg">
            {/* Committed, not muted: bg-muted is the same tone as the row's
                hover fill, so a muted disc vanishes the moment the row is
                hovered. The primary pair sits at the opposite end of the
                scale in both themes, so the disc always keeps its own edge. */}
            <AvatarFallback className="rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs">
              {initialsOf(user.name)}
            </AvatarFallback>
          </Avatar>
        )}
      </span>
      <span
        className={cn(
          'flex min-w-0 flex-1 flex-col text-left leading-tight',
          collapsible && 'group-data-[collapsible=icon]:hidden',
        )}
      >
        <span className="truncate font-medium text-sm">{user.name}</span>
        {user.detail && (
          <span className="truncate text-muted-foreground text-xs">{user.detail}</span>
        )}
      </span>
    </>
  )
}

/**
 * The identity row: a label when there is nothing to do with it, the account
 * menu's trigger the moment `actions` arrive — same geometry either way, so
 * the header does not shift when a consumer wires the menu up.
 */
function UserRow({ user }: { user: HubSidebarUser }) {
  const { isMobile } = useSidebar()
  const actions = user.actions ?? []

  return (
    <SidebarMenu>
      {/* Wrapping, not a state-flipped column: as the rail narrows, the toggle
          drops under the avatar at the width where it stops fitting, so the
          relayout rides the panel's own animation instead of teleporting at
          the first frame of it. */}
      <SidebarMenuItem className="flex flex-wrap items-center justify-center gap-1">
        {actions.length > 0 ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              // Collapsed, the name is a picture: the label has to be spoken.
              aria-label={user.name}
              render={
                <SidebarMenuButton
                  size="lg"
                  // w-auto beats the primitive's icon-mode `size-8!` so the
                  // button keeps tracking the animating panel width.
                  className="flex-1 data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground group-data-[collapsible=icon]:w-auto! group-data-[collapsible=icon]:justify-center"
                />
              }
            >
              <UserIdentity user={user} collapsible />
              <ChevronsUpDownIcon
                aria-hidden="true"
                className="ml-auto group-data-[collapsible=icon]:hidden"
              />
            </DropdownMenuTrigger>
            {/* Anchored beside the rail on desktop so the menu never covers the
                tree it was opened from; below the trigger on mobile, where the
                sidebar is a sheet and there is no beside. */}
            <DropdownMenuContent
              side={isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
              className="min-w-56 rounded-lg"
            >
              <div className="flex items-center gap-2 px-1.5 py-1.5">
                <UserIdentity user={user} />
              </div>
              <DropdownMenuSeparator />
              {actions.map((action) => (
                <Fragment key={action.id}>
                  {action.separatorBefore && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    variant={action.destructive ? 'destructive' : 'default'}
                    disabled={action.disabled}
                    onClick={action.onSelect}
                    className="min-h-9"
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                </Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex h-12 flex-1 items-center gap-2 overflow-hidden p-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-0">
            <UserIdentity user={user} collapsible />
          </div>
        )}
        {/* Stays reachable when collapsed to the icon rail — the toggle is
            how you get back, so it never hides with the text. */}
        {/* Sized to the row's other controls so the rail is one column of
            32px squares rather than three sizes stacked. */}
        <SidebarTrigger className="size-8 shrink-0" />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function HubSidebar({ finder, tree, user, header, footer, ...props }: HubSidebarProps) {
  const [finderOpen, setFinderOpen] = useState(false)

  return (
    <Sidebar {...props}>
      <SidebarHeader className="gap-2 group-data-[collapsible=icon]:gap-1">
        {user && <UserRow user={user} />}
        {header}
        <FinderTrigger placeholder={finder.placeholder} onClick={() => setFinderOpen(true)} />
      </SidebarHeader>
      <SidebarContent>
        {/* A tree has no icon form: collapsed, its rows would clip mid-name
            rather than shrink, so the rail drops it and keeps the three
            things that still work at 48px — who you are, search, expand. It
            fades on the panel's own clock rather than blinking out on the
            first frame, and only then stops taking hits. */}
        <SidebarGroup className="transition-[opacity,visibility] duration-200 ease-linear group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:opacity-0">
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
