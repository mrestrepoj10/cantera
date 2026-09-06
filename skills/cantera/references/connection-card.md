# Connection Card (`@cantera/connection-card`)

A provider connection at a glance: account, grant status, scopes, and disconnect / reconnect actions.

- Type: component
- Install: `npx shadcn@latest add @cantera/connection-card`
- Docs: https://canteraui.vercel.app/components/connection-card
- Registry item: https://canteraui.vercel.app/r/connection-card.json
- Registry dependencies: button, card, @cantera/user-account-badge, @cantera/token-status, @cantera/oauth-types
- npm dependencies: lucide-react
- Working example page: `npx shadcn@latest add @cantera/connection-card-demo` — installs app/examples/connection-card/page.tsx

Files written into the consumer project:

- `connection-card.tsx`

## Props

- `connection` (`OAuthConnection`) — The provider grant to show: provider, account, status, scopes, expiry.
- `onDisconnect` (`() => void | Promise<void>`) — When set, a Disconnect button is shown while the connection is connected. Disconnecting revokes a grant, so it renders destructive. A returned promise drives the pending state.
- `onReconnect` (`() => void | Promise<void>`) — When set, a Connect / Reconnect button is shown while expired, errored, or disconnected. A returned promise drives the pending state.
- `disconnectPending` (`boolean`, default `false`) — Consumer-driven pending for the disconnect action — for a server action, where no promise comes back. The button stays mounted, keeps its label, and shows a spinner.
- `reconnectPending` (`boolean`, default `false`) — Consumer-driven pending for the connect / reconnect action.
- `showScopes` (`boolean`, default `true`) — Forwarded to the embedded TokenStatus.
- `...props` (`ComponentProps<typeof Card>`) — Remaining props are spread onto the underlying Card.
