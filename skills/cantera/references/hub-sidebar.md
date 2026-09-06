# Hub Sidebar (`@cantera/hub-sidebar`)

The finder composed above the hub tree in a shadcn sidebar: fast paths (query, recents, deep search) on top, the explorable tree below.

- Type: block
- Install: `npx shadcn@latest add @cantera/hub-sidebar`
- Docs: https://canteraui.vercel.app/components/hub-sidebar
- Registry item: https://canteraui.vercel.app/r/hub-sidebar.json
- Registry dependencies: avatar, dropdown-menu, sidebar, @cantera/finder, @cantera/hub-tree

Files written into the consumer project:

- `hub-sidebar.tsx`

## Notes

Render inside your own SidebarProvider with page content in SidebarInset — HubSidebar is the sidebar, not the app shell. The header stacks an identity row (avatar + name with the collapse toggle inline — the toggle stays reachable in the icon rail) above a FinderTrigger opening the ⌘K FinderDialog (fed by the finder prop); the tree fills the content slot. Give user.actions and the identity row becomes the account menu's trigger — typed items with icons, optional separators, and a destructive variant for sign-out, anchored beside the rail on desktop and below the row on mobile; with no actions the row stays a plain label. It forwards grouped props to its two controlled halves and adds no state of its own; wire reveal by mapping a finder entry's path to the tree's expandedIds and selectedId in one update.

## Props

- `finder` (`Omit<FinderProps, 'className'>`) — Powers the ⌘K FinderDialog; the header renders a FinderTrigger reusing its placeholder. The fast paths — query, recents, deep search — sit above the tree on purpose.
- `tree` (`HubTreeProps`) — Forwarded to the HubTree in the content slot. Reveal wiring stays in the consumer: a finder entry path becomes expandedIds + selectedId in one update.
- `user` (`{ name: string; detail?: string; avatar?: ReactNode; actions?: HubSidebarUserAction[] }`) — Identity row pinned at the very top — avatar (initials fallback) plus name and detail, with the collapse toggle inline on its right; the toggle stays reachable when the rail collapses to icon mode.
- `user.actions` (`{ id, label, icon?, onSelect, destructive?, separatorBefore?, disabled? }[]`) — Account menu items. With any, the identity row becomes the menu trigger (chevron affordance, menu anchored beside the rail — below it on mobile) and repeats the identity as the menu header; with none the row stays a plain label. separatorBefore opens a group; destructive carries the sign-out ink.
- `treeLabel` (`ReactNode`) — Names the tree group ("Models · 4"); renders as the sidebar group label above the tree.
- `treeAction` (`ReactElement`) — One quiet control beside the group label — an icon button element with an aria-label, positioned as the sidebar group action.
- `header / footer` (`ReactNode`) — Rendered between the identity row and the finder trigger, and in the sidebar footer.
- `...props` (`ComponentProps<typeof Sidebar>`) — Remaining props reach the shadcn Sidebar — side, variant, collapsible (the trigger compacts to an icon in icon mode). Render inside your own SidebarProvider with page content in SidebarInset.
