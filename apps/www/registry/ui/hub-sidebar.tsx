'use client'

import { ChevronsUpDownIcon } from 'lucide-react'
import { type ComponentProps, Fragment, type ReactElement, type ReactNode, useState } from 'react'

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
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

// Render inside your own SidebarProvider, with the page content in
// SidebarInset — this component is the sidebar itself, not the app shell.

export interface HubSidebarUserAction {
  id: string
  label: string
  icon?: ReactNode
  onSelect: () => void
  destructive?: boolean
  separatorBefore?: boolean
  disabled?: boolean
}

export interface HubSidebarUser {
  name: string
  detail?: string
  avatar?: ReactNode
  /** With any, the identity row becomes the account menu's trigger; with none
   * it stays a plain, non-interactive label. */
  actions?: HubSidebarUserAction[]
}

export interface HubSidebarProps extends ComponentProps<typeof Sidebar> {
  finder: Omit<FinderProps, 'className'>
  tree: HubTreeProps
  user?: HubSidebarUser
  header?: ReactNode
  /** Names the tree group ("Models · 4"); renders as the group label. */
  treeLabel?: ReactNode
  /** One quiet control beside the group label — an icon button element, not a
   * filled primary. Give it an aria-label. */
  treeAction?: ReactElement
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

function UserIdentity({ user, collapsible }: { user: HubSidebarUser; collapsible?: boolean }) {
  return (
    <>
      {/* size-8! wins over the menu button's 16px descendant-svg rule, which
          would shrink an SVG avatar to an icon. */}
      <span className="flex size-8 shrink-0 overflow-hidden rounded-lg ring-1 ring-transparent transition-[box-shadow] duration-150 ease-out group-hover/menu-button:ring-sidebar-ring/60 group-data-open/menu-button:ring-sidebar-ring [&>svg]:size-8!">
        {user.avatar ?? (
          <Avatar className="size-8 rounded-lg">
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

function UserRow({ user }: { user: HubSidebarUser }) {
  const { isMobile } = useSidebar()
  const actions = user.actions ?? []

  return (
    <SidebarMenu>
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
        {/* Never hidden with the text: collapsed to the icon rail, the toggle
            is how you get back. */}
        <SidebarTrigger className="size-8 shrink-0" />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

function HubSidebar({
  finder,
  tree,
  user,
  header,
  treeLabel,
  treeAction,
  footer,
  ...props
}: HubSidebarProps) {
  const [finderOpen, setFinderOpen] = useState(false)

  return (
    <Sidebar {...props}>
      <SidebarHeader className="gap-2 group-data-[collapsible=icon]:gap-1">
        {user && <UserRow user={user} />}
        {header}
        <FinderTrigger placeholder={finder.placeholder} onClick={() => setFinderOpen(true)} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="transition-[opacity,visibility] duration-200 ease-linear group-data-[collapsible=icon]:invisible group-data-[collapsible=icon]:opacity-0">
          {treeLabel != null && <SidebarGroupLabel>{treeLabel}</SidebarGroupLabel>}
          {treeAction != null && <SidebarGroupAction render={treeAction} />}
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
