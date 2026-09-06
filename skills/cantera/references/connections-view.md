# Connections View (`@cantera/connections-view`)

The connections dashboard as a presentational block: providers and connections in, connect, reconnect, disconnect, and retry callbacks out — with the designed list, empty, loading, and error states, each exported.

- Type: block
- Install: `npx shadcn@latest add @cantera/connections-view`
- Docs: https://canteraui.vercel.app/components/connections-view
- Registry item: https://canteraui.vercel.app/r/connections-view.json
- Registry dependencies: button, @cantera/connection-card, @cantera/provider-sign-in-button, @cantera/token-status, @cantera/user-account-badge, @cantera/oauth-types, @cantera/status-tokens
- npm dependencies: lucide-react

Files written into the consumer project:

- `components/connections-view.tsx`

## Notes

Presentational only: providers and connections in, callbacks out. "ready" with nothing connected renders the empty state, and each state — ConnectionsList, ConnectionsEmpty, ConnectionsLoading, ConnectionsError — is exported so adapting the page keeps them. @cantera/connections-page ships ConnectionsManager, the wiring that points these callbacks at the acc-auth-routes handlers.

## ConnectionsView props

- `providers` (`OAuthProvider[]`) — Every provider this app can connect to, in display order. A provider with no grant renders as a "not connected" row, and a page where none of them has a grant renders the empty state.
- `connections` (`OAuthConnection[]`) — The grants that exist, matched to providers by connection.provider.id. A grant for a provider outside the catalog is appended rather than dropped, so a removed provider never vanishes silently.
- `status` (`'ready' | 'loading' | 'error'`, default `'ready'`) — The fetch state. Loading and error replace the list while the heading stays put — the page never shifts under a resolve. A single provider that failed is not this state: that is a row with status "error", which keeps its healthy siblings visible.
- `error` (`string`) — Page-level failure detail, shown with the retry when status is "error". Wired to the retry button with aria-describedby.
- `account` (`OAuthAccount`) — Who these grants belong to. Rendered as a UserAccountBadge beside the heading when set.
- `onConnect` (`(providerId: string) => void | Promise<void>`) — Starts consent for one provider. Connect and reconnect are the same act, so one callback serves the empty-state chooser and every row button. A returned promise drives that row's pending state.
- `onDisconnect` (`(providerId: string) => void | Promise<void>`) — Revokes one grant. A returned promise drives the pending state on that card's Disconnect button.
- `onRetry` (`() => void | Promise<void>`) — Retries the whole fetch. Shown only in the error state.
- `pending` (`{ connecting?: string; disconnecting?: string; retrying?: boolean }`) — Consumer-driven pending, for wiring where no promise comes back — a server action, or a navigation that never resolves. One provider id, not a set: a second consent redirect would race the first.
- `title` (`ReactNode`, default `'Connections'`) — Page heading text.
- `titleAs` (`'h1' | 'h2' | 'h3'`, default `'h1'`) — Heading element for the title — a block ships a real heading, not a styled div. Drop to h2 when embedding under one.
- `description` (`ReactNode`, default `'The accounts this app can read from…'`) — Sentence under the heading. Pass null to drop it.
- `showScopes` (`boolean`, default `true`) — Forwarded to every ConnectionCard, and through it to TokenStatus.
- `...props` (`ComponentProps<'section'>`) — Remaining props are spread onto the page section.

## Exports

- `ConnectionsView` (`component`) — The presentational page: heading, summary, and whichever of the four states applies. Data in, callbacks out, no fetching.
- `ConnectionsList` (`component`) — The ready state — one ConnectionCard per row, where the whole status vocabulary shows up at once.
- `ConnectionsEmpty` (`component`) — The empty state: the provider chooser itself, with one sentence on what a connection buys. No illustration — the system is monochrome.
- `ConnectionsLoading` (`component`) — The loading state: static skeleton rows built from the ConnectionCard box model, so nothing shifts on resolve, plus one spinner in a live region.
- `ConnectionsError` (`component`) — The page-level failure: message in danger ink plus a retry on the async-pending contract, wired with aria-describedby.
- `resolveConnections` (`(providers, connections?) => OAuthConnection[]`) — The data model: one row per provider in catalog order, a disconnected placeholder where no grant exists, and unknown grants appended.
- `ConnectionsManager` (`component`) — The client wiring: connect navigates to the consent route, disconnect posts to the revoke route, and both settle by re-rendering the server page. Swap it for your own backend and ConnectionsView does not change.
- `AccConnections` (`async component`) — The wired server component, on the lib and routes the acc-sign-in block installs. Render it from any server page; the default export is a ready-made /connections page with a streamed loading.tsx beside it.

## Data attributes

- `data-slot` (`connections-view · connections-list · connections-empty · connections-loading · connections-error`) — Which state is on the page, for styling and for tests.
- `data-status` (`ready · loading · error`) — On the page section: the fetch state it was rendered with.
