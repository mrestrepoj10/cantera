# Finder (`@cantera/finder`)

Query box over consumer-supplied result groups — recents, pins, the current level, an async deep search — with entries that carry their location so finding can reveal where a file lives.

- Type: component
- Install: `npx shadcn@latest add @cantera/finder`
- Docs: https://canteraui.vercel.app/components/finder
- Registry item: https://canteraui.vercel.app/r/finder.json
- Registry dependencies: button, command, @cantera/project-types, @cantera/status-tokens
- npm dependencies: lucide-react

Files written into the consumer project:

- `finder.tsx`

## Install notes

Fully controlled and data-agnostic: query out through onQueryChange, groups in as props; the consumer owns fetching, debouncing, and persistence. APS has no cross-hub search API, so label each group after the scope actually searched (folders/{id}/search is recursive within one project) and pass the scoped project's name as scope — it renders as a persistent "Searching in" notice under the input, wired to it with aria-describedby. Entries carry path: BrowsePathSegment[] — onReveal hands it back so a hub-tree (expandedIds + selectedId) or hub-browser (a location change) unfolds to the entry. Three surfaces share the contract: Finder renders inline, FinderDialog is the ⌘K palette (shortcut built in, closes on select or reveal), and FinderTrigger is the input-shaped button that opens it.

## Props

- `query / onQueryChange` (`string / (query: string) => void`) — Controlled query. The finder never fetches: the consumer owns the search call, the debounce, and the scope.
- `groups` (`FinderGroup[]`) — Result groups in render order — recents, pins, the current level, an async deep search. Each carries id, label, status (ready | loading | error), error, and entries; loading keeps existing entries visible under a spinner-labeled heading, and error renders in warning ink because retyping retries.
- `entries (FinderEntry)` (`{ item: Item; version?: ItemVersion; path?: BrowsePathSegment[]; caption?: string }`) — Entries carry their address: path renders as the location line and powers onReveal; caption replaces it for recents ("opened 5 minutes ago").
- `onItemOpen` (`(entry: FinderEntry) => void | Promise<void>`) — Open the entry (tip, or the carried version). A returned promise drives the per-row pending spinner; the row keeps its label and never unmounts.
- `onReveal` (`(entry: FinderEntry) => void`) — Show the entry where it lives. Map entry.path to a hub-tree (expandedIds + selectedId) or a hub-browser location in one state update. The affordance renders only when the entry has a path.
- `pending` (`{ openingId?: string }`) — Consumer-driven pending for server actions, keyed by finderEntryKey(entry). Promise-returning callbacks drive it automatically.
- `placeholder / label / emptyLabel` (`string`, default `'Find a file' / 'Find a file' / 'No matches.'`) — Input placeholder, the accessible name of the query box, and the no-matches line shown once a query has no entries anywhere.
- `scope` (`string`) — Name of what a search reaches (the scoped project). Renders as a persistent "Searching in" notice under the input, wired to it with aria-describedby, so the reach stays visible while typing.

## Exports

- `FinderDialog` (`FinderProps & { open; onOpenChange; shortcut?; title?; description? }`) — The ⌘K palette over the same controlled surface. shortcut (default true) binds ⌘K / Ctrl+K to toggle; selecting or revealing an entry closes it — the palette is a jump, not a workspace.
- `FinderTrigger` (`ComponentProps<'button'> & { placeholder?; showShortcut? }`) — Input-shaped button that opens the palette — the visible, tappable entry point with the shortcut as decoration. Compacts to an icon inside a sidebar collapsed to icon mode.
- `finderEntryKey` (`(entry: FinderEntry) => string`) — Stable key for an entry — item id, plus the version id when the entry means a specific version. Use it for pending.openingId and list keys.
- `FinderEntry / FinderGroup / FinderGroupStatus / FinderPending` (`types`) — The full controlled surface, importable for consumer wiring.
