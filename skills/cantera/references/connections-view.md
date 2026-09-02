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
