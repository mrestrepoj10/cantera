# User Account Badge (`@cantera/user-account-badge`)

An avatar-and-name chip for a connected account, with optional provider mark. Server-safe.

- Type: component
- Install: `npx shadcn@latest add @cantera/user-account-badge`
- Docs: https://canteraui.xyz/components/user-account-badge
- Registry item: https://canteraui.xyz/r/user-account-badge.json
- Registry dependencies: avatar, @cantera/oauth-types, @cantera/status-tokens
- Working example page: `npx shadcn@latest add @cantera/user-account-badge-demo` — installs app/examples/user-account-badge/page.tsx

Files written into the consumer project:

- `user-account-badge.tsx`

## Props

- `account` (`OAuthAccount`) — The account to show. Falls back from name to email; the avatar falls back to initials.
- `provider` (`OAuthProvider`) — When set, the provider mark is shown at the end of the chip.
- `size` (`'sm' | 'default'`, default `'default'`) — Compact or regular sizing. Text never drops below 12px in either.
- `...props` (`ComponentProps<'div'>`) — Remaining props are spread onto the wrapping div.
