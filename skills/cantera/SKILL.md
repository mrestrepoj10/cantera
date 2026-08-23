---
name: cantera
description: Use when building or reviewing construction (AEC) interfaces with the cantera shadcn registry — Autodesk (APS / ACC) sign-in, OAuth scope pickers, provider connection cards, status tokens, and the wired sign-in and connections blocks. Triggers on "cantera", "@cantera/<item>", canteraui.xyz, or any request for ACC / APS OAuth, scope, or connection UI in a shadcn project.
---

# cantera

cantera is a shadcn registry for construction (AEC) interfaces: OAuth sign-in,
scope, and connection components, plus end-to-end Autodesk (APS / ACC) blocks. It
is **not an npm package** — `npx shadcn@latest add @cantera/<item>` copies the
source into the project, where it renders on that project's own shadcn primitives
and theme. The consumer owns the code from there, and editing it is expected.

Register the namespace once in `components.json`:

```json
{
  "registries": {
    "@cantera": "https://canteraui.xyz/r/{name}.json"
  }
}
```

Then install by name — the CLI resolves shadcn primitives from the project's own
base and style, and cantera dependencies from this registry:

```sh
npx shadcn@latest add @cantera/connection-card
npx shadcn@latest add @cantera/acc-sign-in
```

## The locked pattern

Every domain follows the same three layers, and new work stays inside it:

1. **Generic types** (`registry:lib`) — the vocabulary components speak:
   `OAuthProvider`, `OAuthScope`, `OAuthConnection`. Never provider-specific.
2. **Provider adapters** (`registry:lib`) — data-only presets that translate one
   API into those types: `aps-oauth-preset` carries Autodesk's provider metadata,
   scope catalog, scope bundles, and a `fromApsUserInfo` adapter.
3. **Wired blocks** (`registry:block`) — the batteries-included path: pages, route
   handlers, and the aec-auth glue, composing the same components.

Components are data-agnostic and style-agnostic: plain typed props in, callbacks
out, no fetching, no token mechanics, built only on the consumer's own shadcn
primitives. If a component needs data, the consumer fetches it and passes it in.
Token handling — refresh, storage, rotation — belongs to
[aec-auth](https://github.com/mrestrepoj10/aec-auth), never to a component.

## Binding contracts

These are not style preferences. Code that breaks them is wrong here.

**Status vocabulary.** Every status renders from the `@cantera/status-tokens` variables: `--status-success`, `--status-warning`, `--status-danger`, `--status-neutral`, each with a `-foreground` companion (ink on the solid fill) and a `-surface` companion (soft background, which always carries `text-status-*` ink, never the `-foreground` ink). One color, one meaning: success is healthy, warning is recoverable and needs attention, danger is a failure the user must act on, neutral is absence. Recoverable states — expired, expiring soon — are warning, not danger: a refresh away, not a failure. Never substitute a generic badge variant for a status: `secondary` reads as gray nothing, and `destructive` collapses "expired" and "broken" into one color. Status uses solid fills, not low-alpha tints. `statusCssVars` (from `lib/status-tokens.ts`) gives the same twelve tokens as typed `var()` strings for inline styles, chart series, and canvas fills — never hand-type a variable name.

**Async pending.** Every component with an async callback exposes a pending state, and pending means disabled-with-spinner-while-keeping-the-label — never a label swapped for "Loading…", never a collapsed control. A pressed control is never unmounted and never changes element type mid-action. Pending is both a prop the consumer drives (`loading`, `disconnectPending`, `reconnectPending`, `loadingProvider` — for server actions, where no promise comes back) and an internal state: a callback that returns a promise drives it automatically. Disabled controls render `aria-disabled`, not the native attribute, so they stay focusable and a screen reader user can still find them.

**Field density and a11y.** This UI is used with gloves, on a tablet, on site. Primary actions carry a 44px minimum touch target; comfortable density is the default and compact is opt-in. 12px is the text floor — there is no `text-[10px]` anywhere in the registry. Focus indicators are 3:1 against their surroundings (`focus-visible:border-ring` plus a full-alpha ring). Every block ships a real heading, every description is wired with `aria-describedby`, and `Intl` formatting is locale-neutral (`Intl.RelativeTimeFormat(undefined, ...)`, with an optional `locale` prop).

**Installed specifiers.** Distributed files import what the install produces: `@/components/ui/connection-card`, `@/lib/oauth-types`. Never `@/registry/...` — that path exists only in the cantera repo and installs broken.

**Icon sizing.** Preset provider marks carry their own `className="size-4"`, so one renders correctly wherever it is dropped. A `[&_svg]:size-*` wrapper still wins on specificity where a surface wants another size — use the wrapper, not a rewritten mark, and keep `aria-hidden` on decorative marks.

## Items

Read the reference before writing code against an item: it carries the props, the
exports, the files the install writes, and the environment it needs.

| Item | Type | What it is | Reference |
| --- | --- | --- | --- |
| `@cantera/oauth-types` | lib | Generic OAuth types for cantera components: providers, scopes, connections, accounts. The lingua franca adapters translate into. | [references/oauth-types.md](references/oauth-types.md) |
| `@cantera/aps-oauth-preset` | lib | Autodesk Platform Services (ACC) preset: provider metadata, scope catalog, scope bundles, and adapters into cantera's oauth types. | [references/aps-oauth-preset.md](references/aps-oauth-preset.md) |
| `@cantera/status-tokens` | tokens | Semantic status colors — success, warning, danger, neutral — each with a foreground and a surface companion, contrast-verified in light and dark. The palette every cantera status surface renders from. | [references/status-tokens.md](references/status-tokens.md) |
| `@cantera/provider-sign-in-button` | component | A sign-in button for a single OAuth provider: brand icon, label, loading state. Works as a link or a click handler. | [references/provider-sign-in-button.md](references/provider-sign-in-button.md) |
| `@cantera/sign-in-card` | component | A multi-provider sign-in chooser card. Server-renderable via an href template, or client-driven via a callback. | [references/sign-in-card.md](references/sign-in-card.md) |
| `@cantera/scope-picker` | component | A controlled OAuth scope picker: checkbox list with descriptions, one-click presets, required scopes pinned on, and an escape hatch for scopes outside the catalog. | [references/scope-picker.md](references/scope-picker.md) |
| `@cantera/user-account-badge` | component | An avatar-and-name chip for a connected account, with optional provider mark. Server-safe. | [references/user-account-badge.md](references/user-account-badge.md) |
| `@cantera/token-status` | component | Status line for an OAuth grant: connection state, token expiry, and held scopes. Server-safe. | [references/token-status.md](references/token-status.md) |
| `@cantera/connection-card` | component | A provider connection at a glance: account, grant status, scopes, and disconnect / reconnect actions. | [references/connection-card.md](references/connection-card.md) |
| `@cantera/acc-sign-in` | block | Complete Autodesk (APS / ACC) sign-in flow on aec-auth: consent redirect, code exchange, vault-managed refresh, signed session, and a live connection panel. | [references/acc-sign-in.md](references/acc-sign-in.md) |
| `@cantera/connections-page` | block | The page that manages every provider grant: one card per connection, with connect, reconnect, and disconnect — plus the designed empty, loading, and error states a real fetch needs. | [references/connections-page.md](references/connections-page.md) |
| `@cantera/project-types` | lib | Generic project-context types for cantera components: hubs, projects, folders, items, versions, model translations, and sheet version sets. The lingua franca adapters translate into. | [references/project-types.md](references/project-types.md) |
| `@cantera/aps-data-preset` | lib | Autodesk Platform Services (ACC) data preset: adapters from Data Management hubs, projects, folders, items, and versions plus Model Derivative and ACC Sheets payloads into cantera's project types. | [references/aps-data-preset.md](references/aps-data-preset.md) |
| `@cantera/hub-switcher` | component | The hub context switch: which ACC hub — or any Hub — the rest of the screen works against, with region context and a pending state for the switch itself. | [references/hub-switcher.md](references/hub-switcher.md) |
| `@cantera/project-picker` | component | The project choice every ACC screen starts from: a searchable combobox grouped by hub, with the loading, error, and empty states a real fetch needs. | [references/project-picker.md](references/project-picker.md) |
| `@cantera/version-set-select` | component | Which issuance of the construction sheets to read from, every option carrying its issuance date — building from a superseded set is an expensive mistake. | [references/version-set-select.md](references/version-set-select.md) |
| `@cantera/hub-browser` | component | A controlled APS-style hub, project, folder, item, and version browser — breadcrumb navigation in, open callbacks out, with no fetching or token mechanics. | [references/hub-browser.md](references/hub-browser.md) |
| `@cantera/hub-tree` | component | A controlled, fetch-free APS-style tree for hubs, projects, folders, items, and versions, with lazy expansion callbacks and complete keyboard navigation. | [references/hub-tree.md](references/hub-tree.md) |
| `@cantera/file-picker-dialog` | component | Hub Browser inside a dialog, with tip-or-version selection and an explicit cancel action. | [references/file-picker-dialog.md](references/file-picker-dialog.md) |
| `@cantera/viewer-types` | lib | Zero-dependency structural types for the Autodesk Viewer global runtime, documents, models, extensions, and promise-based token callbacks. | [references/viewer-types.md](references/viewer-types.md) |
| `@cantera/viewer-extension-types` | lib | A typed catalog of the Autodesk Viewer's public extensions: every loadExtension id, the options each one actually reads, and the flags that decide whether loading it can work — verified against the shipped viewer source. | [references/viewer-extension-types.md](references/viewer-extension-types.md) |
| `@cantera/aps-viewer` | component | A Strict-Mode-safe React host for Autodesk Viewer 7.* with deduplicated runtime loading, live native-toolbar controls, theme and ViewCube controls, frame radius, URN swaps, automatic resize, and composable hooks. | [references/aps-viewer.md](references/aps-viewer.md) |
| `@cantera/model-status-card` | component | The translation state of one design: whether the model is viewable yet, how far along it is, and what failed — with a retry on the async-pending contract. | [references/model-status-card.md](references/model-status-card.md) |
| `@cantera/model-viewer-page` | block | A complete APS project-tree and Autodesk Viewer page: lazy 3-legged Data Management browsing, a full-bleed native viewer, account controls, and untranslated-model states. | [references/model-viewer-page.md](references/model-viewer-page.md) |
| `@cantera/upload-types` | lib | Generic upload lifecycle types for cantera components: files moving through queued, uploading, processing, complete, and error, plus rejection reasons, an accept matcher, and locale-neutral byte formatting. | [references/upload-types.md](references/upload-types.md) |
| `@cantera/file-drop-zone` | component | A drafting-grid drop zone for heavy AEC files: the dot grid magnetizes under a dragged file, plots upward as bytes land, and glows while the provider translates — with per-file rows on the async-pending contract. | [references/file-drop-zone.md](references/file-drop-zone.md) |

## Working examples

Every component ships an example item: a self-contained demo plus a page that
mounts it, which is what "Open in v0" hands over and the fastest way to see one
wired up.

```sh
npx shadcn@latest add @cantera/status-tokens-demo
npx shadcn@latest add @cantera/provider-sign-in-button-demo
npx shadcn@latest add @cantera/sign-in-card-demo
npx shadcn@latest add @cantera/scope-picker-demo
npx shadcn@latest add @cantera/user-account-badge-demo
npx shadcn@latest add @cantera/token-status-demo
npx shadcn@latest add @cantera/connection-card-demo
npx shadcn@latest add @cantera/hub-switcher-demo
npx shadcn@latest add @cantera/project-picker-demo
npx shadcn@latest add @cantera/version-set-select-demo
npx shadcn@latest add @cantera/hub-browser-demo
npx shadcn@latest add @cantera/file-picker-dialog-demo
npx shadcn@latest add @cantera/aps-viewer-demo
npx shadcn@latest add @cantera/model-status-card-demo
npx shadcn@latest add @cantera/file-drop-zone-demo
```

## More

- Full API reference in one fetch: https://canteraui.xyz/llms-full.txt
- Registry index for agents: https://canteraui.xyz/r/llms.txt
- Token layer (refresh, storage, rotation): https://github.com/mrestrepoj10/aec-auth
- Credential-free OAuth emulator: https://github.com/mrestrepoj10/emulate
