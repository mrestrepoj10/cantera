# Scope Picker (`@cantera/scope-picker`)

A controlled OAuth scope picker: task-oriented presets, an optional advanced-permissions disclosure, required scopes pinned on, and an escape hatch for scopes outside the catalog.

- Type: component
- Install: `npx shadcn@latest add @cantera/scope-picker`
- Docs: https://canteraui.vercel.app/components/scope-picker
- Registry item: https://canteraui.vercel.app/r/scope-picker.json
- Registry dependencies: badge, button, checkbox, input, label, @cantera/oauth-types, @cantera/status-tokens
- npm dependencies: lucide-react
- Working example page: `npx shadcn@latest add @cantera/scope-picker-demo` — installs app/examples/scope-picker/page.tsx

Files written into the consumer project:

- `scope-picker.tsx`

## Props

- `scopes` (`OAuthScope[]`) — The scope catalog to render. Scopes marked required render checked and cannot be deselected — they stay focusable via aria-disabled and announce why.
- `value` (`string[]`) — Selected scope ids. Controlled and taken literally: the picker never calls onChange on mount to backfill required scopes. Union them in where the value is used with withRequiredScopes.
- `onChange` (`(value: string[]) => void`) — Called with the next selection on every change — catalog order first, custom scopes trailing in insertion order.
- `presets` (`OAuthScopePreset[]`) — Named bundles rendered as toggle buttons above the list, each showing its label and description, with aria-pressed reflecting whether the current selection matches the bundle.
- `presetsLabel` (`string`, default `'Presets'`) — Legend for the preset group. Use a task-oriented label such as “Access level” when presets represent user-facing permission tiers.
- `collapsibleScopes` (`boolean`, default `false`) — Keeps presets prominent while placing the individual scope controls in a native disclosure. The summary reports the selected scope count.
- `scopeListLabel` (`string`, default `'Advanced permissions'`) — Summary label for the scope disclosure when collapsibleScopes is enabled.
- `allowCustomScopes` (`boolean`, default `false`) — Adds a field for scopes outside the catalog — granular resource scopes like data:read:<urn>, or anything the provider added since. Custom scopes render with a "custom" badge and round-trip through value / onChange like any other.
- `customScopeLabel` (`string`, default `'Add a scope'`) — Label for the custom-scope field.
- `disabled` (`boolean`, default `false`) — Disables the presets, every checkbox, and the custom-scope field.
- `...props` (`ComponentProps<'div'>`) — Remaining props are spread onto the wrapping div.

## Exports

- `withRequiredScopes` (`(scopes: OAuthScope[], value: string[]) => string[]`) — The required scopes of the catalog, unioned into a picker value, in catalog order with custom scopes appended. Call it at submit time, or when building the authorize URL, so required scopes are never silently dropped.
