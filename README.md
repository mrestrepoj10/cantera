# cantera

**Construction UI. shadcn-native.** Components for AEC data — ACC-ready, source-agnostic. Install with the shadcn CLI, own the code.

cantera is a [shadcn registry](https://ui.shadcn.com/docs/registry), not an npm package: `npx shadcn@latest add` copies the source into your project. Components are built on your project's shadcn primitives and inherit your theme, base, and style. They take plain typed props — data in, callbacks out — so they work with data from Autodesk Construction Cloud, Procore, or anywhere else. Provider-specific presets and adapters translate real APIs into those props.

- Site and live demo: [canteraui.vercel.app](https://canteraui.vercel.app)
- Token layer companion: [aec-auth](https://github.com/mrestrepoj10/aec-auth)
- Zero-credential OAuth demos: [emulate](https://github.com/mrestrepoj10/emulate) (`@emulators/aps`)

## Install

One-time, add the registry to your `components.json`:

```json
{
  "registries": {
    "@cantera": "https://canteraui.vercel.app/r/{name}.json"
  }
}
```

Then add items:

```sh
npx shadcn@latest add @cantera/sign-in-card
npx shadcn@latest add @cantera/acc-sign-in
```

The CLI resolves everything: shadcn primitives from your configured base and style, cantera dependencies from this registry. Full guide — package-manager tabs, the path-alias caveat, and theming: [canteraui.vercel.app/installation](https://canteraui.vercel.app/installation).

Every component also ships an example item — a self-contained demo plus the page that mounts it — so `npx shadcn@latest add @cantera/connection-card-demo` (or the **Open in v0** button on any docs page) lands a screen that renders, not a bare component.

Agents: install the skill with `npx skills add mrestrepoj10/cantera` for the registry's pattern, contracts, and a reference per item. On the web, [`/llms.txt`](https://canteraui.vercel.app/llms.txt) indexes the site, [`/llms-full.txt`](https://canteraui.vercel.app/llms-full.txt) carries every item's props and the design contracts, and [`/r/llms.txt`](https://canteraui.vercel.app/r/llms.txt) sits next to the registry JSON.

## Items

| Item | Type | What it is |
| --- | --- | --- |
| `oauth-types` | lib | Generic OAuth types: providers, scopes, connections, accounts. The lingua franca adapters translate into. |
| `aps-oauth-preset` | lib | Autodesk (APS / ACC) preset: provider metadata, scope catalog, scope bundles, adapters. |
| `status-tokens` | tokens | The semantic status palette as CSS variables, plus `statusCssVars` — the same twelve tokens typed, for inline styles and chart series. |
| `provider-sign-in-button` | component | Sign-in button and link for one provider: brand icon, label, loading state. |
| `sign-in-card` | block | Multi-provider sign-in chooser. Server-renderable via href template, or client-driven. |
| `scope-picker` | block | Controlled scope picker: descriptions, one-click presets, required scopes pinned on. |
| `user-account-badge` | component | Avatar-and-name chip for a connected account. Server-safe. |
| `token-status` | component | Grant status line: connection state, token expiry, held scopes. Server-safe. |
| `connection-card` | component | A provider connection at a glance, with disconnect / reconnect. |
| `acc-auth-routes` | kit | Headless Autodesk OAuth routes, vault wiring, and a signed application session. |
| `acc-connection-panel` | block | The live Autodesk connection panel: one connection card wired to sign-out and consent restart. |
| `acc-sign-in` | template | Complete Autodesk sign-in flow on [aec-auth](https://github.com/mrestrepoj10/aec-auth): consent redirect, code exchange, vault-managed single-use refresh, signed session, live connection panel. |
| `connections-view` | block | The connections dashboard, presentational: providers and connections in, callbacks out, with the list, empty, loading, and error states. |
| `connections-page` | template | The manage-grants page: one card per provider connection, with connect, reconnect, and disconnect — plus the designed empty, loading, and error states. |
| `project-types` | lib | Generic hubs, projects, folders, items, immutable versions, model translations, and sheet issuances. |
| `aps-data-preset` | lib | Data Management, Model Derivative, and ACC Sheets adapters into the generic project types. |
| `hub-switcher` | component | Controlled hub selector for switching account-level project containers. |
| `project-picker` | component | Searchable project picker with optional hub grouping. |
| `version-set-select` | component | ACC Sheets issuance selector with locale-aware dates. |
| `hub-browser` | block | Controlled hub-to-file browser with breadcrumbs, pagination, translation status, and on-demand version selection. |
| `hub-tree` | component | Accessible lazy hub, project, folder, item, and version tree. |
| `finder` | block | Search surface for loaded, recent, and remote files with path-aware results. |
| `hub-sidebar` | block | Finder and project tree composed into a shadcn sidebar. |
| `crew-avatar` | component | Deterministic monochrome construction-worker avatar generated from a name and role. |
| `file-picker-dialog` | component | The hub browser in a dialog, returning an item tip or an exact version. |
| `viewer-types` | lib | Structural types for the public Autodesk Viewer global runtime. |
| `viewer-extension-types` | lib | Typed Autodesk Viewer extension catalog, options, and compatibility metadata. |
| `aps-viewer` | component | Strict-Mode-safe Viewer host with native-toolbar docking and sizing, live theme changes, URN swaps, resize, and hooks. |
| `model-status-card` | component | Translation status, progress, diagnostics, retry, and open actions. |
| `model-viewer-page` | template | Signed-in ACC project tree, recursive finder, and full-bleed Autodesk Viewer page. |
| `model-upload-page` | template | Two-legged OSS upload, translation tracking, model library, and Viewer page. |
| `upload-types` | lib | Generic upload lifecycle types, accept matching, and localized byte formatting. |
| `file-drop-zone` | block | Validated AEC drag-and-drop surface with progress, processing, retry, and removal states. |

Items sit on four rungs. **Foundations** are the shared types, provider presets, status tokens, and the auth kit. **Components** are data-agnostic by design: they never fetch. **Blocks** are the sections and surfaces built from them — sign-in cards, scope pickers, sidebars, browsers, drop zones — with sample data in and callbacks out, no routes and no environment. **Templates** are ready-to-deploy pages: the route, its API handlers, environment keys, and the aec-auth glue in one install. In `registry.json`, `meta.kind` carries the rung for blocks and templates; the site, the skill, and the llms artifacts group by it. The pattern every domain follows is **types + adapters + components + blocks + templates**. Issues, RFIs, and submittals are future domains; model viewing already follows the pattern above.

Every item page carries a **Copy prompt** button: the install as an agent-runnable prompt — register the namespace, run the add, then read the keys and the Next list the CLI prints. Only templates and the kit print install notes; every other item keeps its notes on its docs page.

`aps-viewer` follows the same boundary: pass a Model Derivative URN and a promise-based `getAccessToken` callback. It never ships credentials or a route. The site’s live playground uses the showcase-only `/api/viewer-token` route with `viewables:read`; configure it through `APS_CLIENT_ID`, `APS_CLIENT_SECRET`, and `APS_VIEWER_DEMO_URN` in the root `.env` (see `.env.example`).

## The acc-sign-in template

`npx shadcn@latest add @cantera/acc-sign-in` installs a working `/sign-in` page, `/api/auth/*` route handlers, and the auth wiring on aec-auth's vault. Configure with environment variables:

| Variable | Meaning |
| --- | --- |
| `APS_CLIENT_ID` / `APS_CLIENT_SECRET` | Your APS app credentials. |
| `APP_ORIGIN` | Canonical public origin, such as `https://app.example.com`. Required in production so OAuth never trusts forwarded host headers. |
| `APS_AUTH_BASE_URL` | Optional auth origin override — absolute, or relative like `/emulate/aps` for an embedded emulator. Unset = real APS. |
| `SESSION_SECRET` | HMAC key for the session cookie. Required in production — the routes refuse to start without it. |
| `ACC_AUTH_DEMO` | Set to `1` only for emulator-backed demos: allows the insecure fallback session secret in production. |

The default vault store is in-memory. For production, swap in a durable `VaultStore` (Upstash Redis + encryption) — two lines, see the [aec-auth README](https://github.com/mrestrepoj10/aec-auth).

## The connections-page template

`npx shadcn@latest add @cantera/connections-page` installs a `/connections` page, its streamed `loading.tsx`, and `ConnectionsManager` (the wiring) over the `connections-view` block (presentational — providers and connections in, callbacks out). It depends on `acc-auth-routes` for the routes and the aec-auth glue, so the same environment variables above configure both.

The `connections-view` block ships all four states, each exported so adapting the page keeps them:

| State | What it is |
| --- | --- |
| `ConnectionsList` | The mixed dashboard — connected, expiring soon, expired, errored, and never-connected rows together. |
| `ConnectionsEmpty` | Nothing connected yet. The provider chooser *is* the empty state; no illustration, no message about nothingness. |
| `ConnectionsLoading` | A still skeleton at the real card geometry, so nothing shifts on resolve. No shimmer, no stagger. |
| `ConnectionsError` | The whole fetch failed: message plus a retry on the async-pending contract. A single provider that failed stays a row, not a page. |

Point `ConnectionsView` at any backend — it never fetches.

## The model-upload-page template

`npx shadcn@latest add @cantera/model-upload-page` installs `/upload`, its two-legged upload and Viewer token routes, and the upload UI. Protect the routes with your application access control: they intentionally use application credentials rather than an end-user session.

| Variable | Meaning |
| --- | --- |
| `APS_CLIENT_ID` / `APS_CLIENT_SECRET` | APS application credentials used for OSS, translation, and Viewer tokens. |
| `APS_BUCKET` | Optional OSS bucket key. The block otherwise derives one from the client id and creates it with a persistent policy. |
| `APP_ORIGIN` | Canonical public origin. Required in production when `APS_AUTH_BASE_URL` is relative. |
| `APS_AUTH_BASE_URL` | Optional absolute APS origin or relative embedded-emulator mount. |

Files are uploaded under server-issued object keys and translation/status requests are restricted to that bucket. The default limit is 250 MiB per file.

## Development

```sh
pnpm install
pnpm dev              # apps/www on :3456 — landing, docs, registry, live demo
pnpm lint             # biome
pnpm typecheck
pnpm registry:build   # example items + apps/www/public/r/*.json + llms.txt artifacts + skills/cantera (all committed)
pnpm registry:verify  # install closure, npm-dep coverage, and drift against a fresh build
pnpm e2e              # Playwright: OAuth flow, pending contracts, and live viewer assertions (APS_E2E=1)
```

### Repo layout

- `apps/www` — one Next.js app: landing, per-component docs, registry hosting (`public/r`), and the live demo.
- `apps/www/registry/` — **source of truth for all distributed code.** The site imports these files through tsconfig path fallbacks (`@/components/ui/*` resolves to `registry/ui/*` first), so docs and demos render exactly what consumers install.
- `apps/www/app/emulate/[...path]` — the APS OAuth emulator embedded via `@emulators/adapter-next`. Same-origin, so the demo works on any deployment URL. State is in-memory and resets when the server recycles.
- `vendor/@emulators/` — prebuilt `core` / `aps` / `adapter-next` vendored from the [emulate fork](https://github.com/mrestrepoj10/emulate) until the upstream PR publishes them to npm.
- `e2e/` — Playwright smoke test of the full sign-in flow.

### Caveats for contributors

- Running `shadcn add` in `apps/www` rewrites `tsconfig.json` `paths` to `{"@/*": ["./*"]}` — restore the fallback mappings afterwards (see git diff).
- `pnpm registry:build` output is committed — `apps/www/public/r/`, the `llms*.txt` artifacts, the generated `registry:example` items in `registry.json`, and `skills/cantera/`. `pnpm registry:verify` rebuilds all of it into a scratch directory and fails on any difference, and CI runs `git diff --exit-code` on top.
- A distributed file may only import what its item installs: another file in the same item, a `@cantera/*` registry dependency, a shadcn primitive declared by plain name, or `@/lib/utils`. `registry:verify` checks that closure against the *installed* paths, so a wrong file type (`registry:component` lands in `components/`, `registry:ui` in `components/ui/`) fails here instead of in someone's project.

## License

MIT. Vendored `@emulators/*` packages are Apache-2.0 (see `vendor/@emulators/LICENSE`).
