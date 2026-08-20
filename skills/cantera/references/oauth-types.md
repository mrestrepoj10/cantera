# OAuth Types (`@cantera/oauth-types`)

Generic OAuth types for cantera components: providers, scopes, connections, accounts. The lingua franca adapters translate into.

- Type: lib
- Install: `npx shadcn@latest add @cantera/oauth-types`
- Docs: https://canteraui.xyz/components/oauth-types
- Registry item: https://canteraui.xyz/r/oauth-types.json

Files written into the consumer project:

- `lib/oauth-types.ts`

## Usage

The lingua franca every cantera component speaks. Components take these shapes as props and never fetch data themselves — adapters translate provider payloads into them, so Autodesk, Procore, or your own provider all render with the same components.

```tsx
import type { OAuthConnection, OAuthProvider } from '@/lib/oauth-types'

const fieldlink: OAuthProvider = {
  id: 'fieldlink',
  name: 'FieldLink',
}

const connection: OAuthConnection = {
  provider: fieldlink,
  status: 'connected',
  account: { name: 'Dana Alvarez', email: 'dana@ridgelinebuilders.com' },
  scopes: ['rfis:read', 'submittals:read'],
  expiresAt: Date.now() + 55 * 60_000,
}
```

## Exports

- `OAuthProvider` (`interface`) — A provider identity: id, name, optional icon and docsUrl. Marks carry their own default size, so one renders correctly wherever it is dropped; a [&_svg]:size-* wrapper still wins.
- `OAuthScope` (`interface`) — One grantable scope: id (the literal scope string), label, description, required.
- `OAuthScopePreset` (`interface`) — A named bundle of scope ids for a common task, e.g. "Viewer".
- `OAuthConnectionStatus` (`type`) — 'connected' | 'expired' | 'error' | 'disconnected'.
- `OAuthAccount` (`interface`) — The human behind a grant: name, email, avatarUrl — all optional.
- `OAuthConnection` (`interface`) — A provider grant: provider, status, and optional account, scopes, expiresAt, error.
- `connectionExpiry` (`(connection: OAuthConnection) => Date | null`) — Normalizes expiresAt (Date, string, or number) into a Date, or null when absent.
- `isExpiringSoon` (`(connection: OAuthConnection, withinMs?: number) => boolean`) — True when the connection expires within withinMs — five minutes by default.
- `accountInitials` (`(account?: OAuthAccount) => string`) — Initials for avatar fallbacks: "Dana Alvarez" becomes "DA".
