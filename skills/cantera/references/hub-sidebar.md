# Hub Sidebar (`@cantera/hub-sidebar`)

The finder composed above the hub tree in a shadcn sidebar: fast paths (query, recents, deep search) on top, the explorable tree below.

- Type: component
- Install: `npx shadcn@latest add @cantera/hub-sidebar`
- Docs: https://canteraui.xyz/components/hub-sidebar
- Registry item: https://canteraui.xyz/r/hub-sidebar.json
- Registry dependencies: avatar, sidebar, @cantera/finder, @cantera/hub-tree

Files written into the consumer project:

- `hub-sidebar.tsx`

## Install notes

Render inside your own SidebarProvider with page content in SidebarInset — HubSidebar is the sidebar, not the app shell. The header stacks an identity row (avatar + name with the collapse toggle inline — the toggle stays reachable in the icon rail) above a FinderTrigger opening the ⌘K FinderDialog (fed by the finder prop); the tree fills the content slot. It forwards grouped props to its two controlled halves and adds no state of its own; wire reveal by mapping a finder entry's path to the tree's expandedIds and selectedId in one update.

## Props

- `finder` (`Omit<FinderProps, 'className'>`) — Powers the ⌘K FinderDialog; the header renders a FinderTrigger reusing its placeholder. The fast paths — query, recents, deep search — sit above the tree on purpose.
- `tree` (`HubTreeProps`) — Forwarded to the HubTree in the content slot. Reveal wiring stays in the consumer: a finder entry path becomes expandedIds + selectedId in one update.
- `user` (`{ name: string; detail?: string; avatar?: ReactNode }`) — Identity row pinned at the very top — avatar (initials fallback) plus name and detail, with the collapse toggle inline on its right; the toggle stays reachable when the rail collapses to icon mode.
- `header / footer` (`ReactNode`) — Rendered between the identity row and the finder trigger, and in the sidebar footer.
- `...props` (`ComponentProps<typeof Sidebar>`) — Remaining props reach the shadcn Sidebar — side, variant, collapsible (the trigger compacts to an icon in icon mode). Render inside your own SidebarProvider with page content in SidebarInset.
