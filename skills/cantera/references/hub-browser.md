# Hub Browser (`@cantera/hub-browser`)

A controlled APS-style hub, project, folder, item, and version browser — breadcrumb navigation in, open callbacks out, with no fetching or token mechanics.

- Type: component
- Install: `npx shadcn@latest add @cantera/hub-browser`
- Docs: https://canteraui.xyz/components/hub-browser
- Registry item: https://canteraui.xyz/r/hub-browser.json
- Registry dependencies: badge, breadcrumb, button, popover, scroll-area, skeleton, @cantera/project-types, @cantera/status-tokens
- npm dependencies: lucide-react
- Working example page: `npx shadcn@latest add @cantera/hub-browser-demo` — installs app/examples/hub-browser/page.tsx

Files written into the consumer project:

- `hub-browser.tsx`

## Install notes

HubBrowser is fully controlled and never fetches. An empty path renders the hub list; each callback advances or rewinds the consumer-owned path and entries. Activating the Hubs breadcrumb passes ROOT_BROWSE_SEGMENT — the exported empty-id sentinel — to onNavigate.

Version history is on demand: onRequestVersions receives one item id, and the consumer feeds the single-item versions prop back. Picking a row calls onItemOpen(item); picking history calls onItemOpen(item, version). Status badges use @cantera/status-tokens.

## Props

- `path` (`BrowsePathSegment[]`) — Controlled hub → project → folder breadcrumb. An empty array is the hub list.
- `entries` (`FolderEntry[]`) — Rows at the current level. Hub and Project arrays fit structurally at their levels.
- `status` (`'ready' | 'loading' | 'error'`, default `'ready'`) — Loading keeps a still row skeleton and one announced spinner; error renders the supplied message.
- `error` (`string`) — Human-readable current-level failure, shown when status is error.
- `onNavigate` (`(segment: BrowsePathSegment) => void | Promise<void>`) — Folder-row and breadcrumb navigation. The Hubs crumb passes ROOT_BROWSE_SEGMENT, whose id is empty.
- `onItemOpen` (`(item: Item, version?: ItemVersion) => void | Promise<void>`) — Opens the tip when version is absent, or the exact version picked from history.
- `pending` (`{ navigatingTo?: string; openingItem?: string; loadingMore?: boolean }`) — Consumer-driven pending, including pagination for handlers that return void (a server action or a transition). Controls stay mounted, keep their labels, spin, and remain focusable.
- `versions` (`{ itemId: string; status: 'loading' | 'ready' | 'error'; versions: ItemVersion[] }`) — The one item whose on-demand history is currently loaded. A single-item shape prevents stale histories from crossing rows.
- `onRequestVersions` (`(itemId: string) => void | Promise<void>`) — Called when a row version affordance opens; feed the result back through versions.
- `hasMore / onLoadMore` (`boolean / () => void | Promise<void>`, default `false / undefined`) — Controlled pagination rendered as a final Load more row.
- `locale` (`string`, default `runtime locale`) — BCP 47 locale for relative modified times. Undefined delegates to Intl — nothing is hardcoded to English.
- `title / titleAs` (`string / 'h2' | 'h3' | 'h4'`, default `'Browse files' / 'h2'`) — Visible real heading and the level it occupies in the surrounding outline.
