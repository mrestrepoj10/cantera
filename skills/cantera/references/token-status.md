# Token Status (`@cantera/token-status`)

Status line for an OAuth grant: connection state, token expiry, and held scopes. Server-safe.

- Type: component
- Install: `npx shadcn@latest add @cantera/token-status`
- Docs: https://canteraui.vercel.app/components/token-status
- Registry item: https://canteraui.vercel.app/r/token-status.json
- Registry dependencies: badge, @cantera/status-tokens, @cantera/oauth-types
- Working example page: `npx shadcn@latest add @cantera/token-status-demo` — installs app/examples/token-status/page.tsx

Files written into the consumer project:

- `token-status.tsx`

## Props

- `connection` (`OAuthConnection`) — The grant to summarize: status badge, expiry, error text, scopes.
- `showExpiry` (`boolean`, default `true`) — Show a relative expiry while connected. Expiry is recoverable, so it takes the warning tone — never danger — as the deadline approaches.
- `showScopes` (`boolean`, default `false`) — Render each held scope as an outline badge.
- `locale` (`string | string[]`, default `runtime locale`) — BCP 47 locale(s) for the relative expiry. Left undefined, Intl resolves the runtime locale — nothing is hardcoded to English.
- `expiringSoonMs` (`number`, default `300000`) — How far ahead counts as "expiring soon", in milliseconds. Five minutes by default.
- `...props` (`ComponentProps<'div'>`) — Remaining props are spread onto the wrapping div.

## Exports

- `StatusTone` (`'success' | 'warning' | 'danger' | 'neutral'`) — The four semantic tones. One color, one meaning — reuse this type instead of inventing a parallel vocabulary.
- `statusToneClasses` (`Record<StatusTone, string>`) — Solid fill plus its ink, e.g. "bg-status-success text-status-success-foreground". Solid, not a low-alpha tint, so it survives direct sunlight.
- `statusInkClasses` (`Record<StatusTone, string>`) — The same tones as text color, for ink on the page or on a -surface companion.

## Data attributes

- `data-status` (`'connected' | 'expired' | 'error' | 'disconnected'`) — The raw connection status, for styling or querying from the outside.
- `data-tone` (`'success' | 'warning' | 'danger' | 'neutral'`) — The tone actually rendered — connected but expiring soon resolves to warning, not success.
