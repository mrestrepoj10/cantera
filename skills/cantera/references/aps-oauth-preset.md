# APS OAuth Preset (`@cantera/aps-oauth-preset`)

Autodesk Platform Services (ACC) preset: provider metadata, scope catalog, scope bundles, and adapters into cantera's oauth types.

- Type: lib
- Install: `npx shadcn@latest add @cantera/aps-oauth-preset`
- Docs: https://canteraui.vercel.app/components/aps-oauth-preset
- Registry item: https://canteraui.vercel.app/r/aps-oauth-preset.json
- Registry dependencies: @cantera/oauth-types

Files written into the consumer project:

- `lib/aps-oauth-preset.tsx`

## Usage

Everything Autodesk-specific in one data-only item: provider metadata, the APS scope catalog with human explanations, the scope bundles aec-auth uses, and an adapter from the APS userinfo payload. Drop it into any component that takes oauth types — no client, no fetching, no tokens.

```tsx
import { apsProvider, apsScopeCatalog, apsScopePresets } from '@/lib/aps-oauth-preset'
import { ScopePicker, withRequiredScopes } from '@/components/ui/scope-picker'
import { SignInCard } from '@/components/ui/sign-in-card'

<SignInCard providers={[apsProvider]} hrefTemplate="/api/auth/{provider}" />

<ScopePicker
  scopes={apsScopeCatalog}
  presets={apsScopePresets}
  value={selected}
  onChange={setSelected}
  allowCustomScopes
/>

// Required scopes are unioned in where the value is used, never on mount.
const scope = withRequiredScopes(apsScopeCatalog, selected).join(' ')
```

## Exports

- `apsProvider` (`OAuthProvider`) — Autodesk provider metadata: id "aps", name, brand mark, OAuth docs link.
- `apsScopeCatalog` (`OAuthScope[]`) — The APS scope catalog — data, viewables, buckets, account admin, OpenID — with human explanations.
- `apsScopePresets` (`OAuthScopePreset[]`) — Common bundles mirrored from aec-auth's apsScopes recipes: viewer, data-read, data-write, account-admin.
- `ApsUserInfo` (`interface`) — The subset of the APS userinfo response the adapter reads.
- `fromApsUserInfo` (`(userInfo: ApsUserInfo) => OAuthAccount`) — Adapter from an APS userinfo payload into a cantera OAuthAccount.
