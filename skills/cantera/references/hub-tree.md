# Hub Tree (`@cantera/hub-tree`)

A controlled, fetch-free APS-style tree for hubs, projects, folders, items, and versions, with lazy expansion callbacks and complete keyboard navigation.

- Type: component
- Install: `npx shadcn@latest add @cantera/hub-tree`
- Docs: https://canteraui.vercel.app/components/hub-tree
- Registry item: https://canteraui.vercel.app/r/hub-tree.json
- Registry dependencies: @cantera/project-types, @cantera/status-tokens, @cantera/upload-types
- npm dependencies: lucide-react

Files written into the consumer project:

- `hub-tree.tsx`

## Install notes

HubTree is fully controlled and never fetches. Give every node a stable, globally unique tree id and preserve the provider-normalized Hub, Project, Folder, Item, or ItemVersion in its value field. Expanding calls onExpand; feed the loaded children back through nodes and include the id in expandedIds. Items open their tip through onItemOpen(item); version rows call onItemOpen(item, version). The comfortable default uses 44px rows; compact is an explicit opt-in.

## Props

- `nodes` (`HubTreeNode[]`) — Controlled hub → project → folder → item → version tree. Each node keeps a globally unique tree id and its typed domain object in value.
- `expandedIds` (`string[]`) — Controlled ids of branches whose children are visible.
- `selectedId` (`string`) — Tree id of the selected item or version.
- `pendingId` (`string`) — Branch currently loading children. Its label stays mounted while the disclosure icon crossfades to a spinner.
- `density` (`'comfortable' | 'compact'`, default `'comfortable'`) — Row density. Comfortable keeps the 44px field target; compact is the explicit desktop escape hatch.
- `empty` (`ReactNode`) — Rendered instead of the default "No projects found." when nodes is empty — the place for loading, error, and reconnect states.
- `onExpand / onCollapse` (`(node: HubTreeBranchNode) => void | Promise<void>`) — Controlled disclosure callbacks. Fetch children in onExpand, then feed the updated nodes and expandedIds back.
- `onItemOpen` (`(item: Item, version?: ItemVersion) => void | Promise<void>`) — Opens the item tip when version is absent, or the exact immutable version activated below it.

## Node types

- `HubTreeNode` (`HubTreeHubNode | HubTreeProjectNode | HubTreeFolderNode | HubTreeItemNode | HubTreeVersionNode`) — Discriminated by type. Branches may receive children and hasChildren; versions are always leaves.
