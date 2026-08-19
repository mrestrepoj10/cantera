# cantera

**Construction UI. shadcn-native.** Components for AEC data — ACC-ready, source-agnostic. Install with the shadcn CLI, own the code.

cantera is a [shadcn registry](https://ui.shadcn.com/docs/registry), not an npm package: `npx shadcn add` copies the source into your project. Components are built on your project's shadcn primitives and inherit your theme, base, and style. They take plain typed props — data in, callbacks out — so they work with data from Autodesk Construction Cloud, Procore, or anywhere else. Provider-specific presets and adapters translate real APIs into those props.

- Site and live demo: [canteraui.xyz](https://canteraui.xyz)
- Token layer companion: [aec-auth](https://github.com/mrestrepoj10/aec-auth)
- Zero-credential OAuth demos: [emulate](https://github.com/mrestrepoj10/emulate) (`@emulators/aps`)

## Install

One-time, add the registry to your `components.json`:

```json
{
  "registries": {
    "@cantera": "https://canteraui.xyz/r/{name}.json"
  }
}
```

Then add items:

```sh
npx shadcn@latest add @cantera/sign-in-card
npx shadcn@latest add @cantera/acc-sign-in
```

The CLI resolves everything: shadcn primitives from your configured base and style, cantera dependencies from this registry.

## Items

| Item | Type | What it is |
| --- | --- | --- |
| `oauth-types` | lib | Generic OAuth types: providers, scopes, connections, accounts. The lingua franca adapters translate into. |
| `aps-oauth-preset` | lib | Autodesk (APS / ACC) preset: provider metadata, scope catalog, scope bundles, adapters. |
| `provider-sign-in-button` | component | Sign-in button for one provider: brand icon, label, loading state. Link or click handler. |
| `sign-in-card` | component | Multi-provider sign-in chooser. Server-renderable via href template, or client-driven. |
| `scope-picker` | component | Controlled scope picker: descriptions, one-click presets, required scopes pinned on. |
| `user-account-badge` | component | Avatar-and-name chip for a connected account. Server-safe. |
| `token-status` | component | Grant status line: connection state, token expiry, held scopes. Server-safe. |
| `connection-card` | component | A provider connection at a glance, with disconnect / reconnect. |
| `acc-sign-in` | block | Complete Autodesk sign-in flow on [aec-auth](https://github.com/mrestrepoj10/aec-auth): consent redirect, code exchange, vault-managed single-use refresh, signed session, live connection panel. |

Components are data-agnostic by design: they never fetch. The pattern every future domain (issues, RFIs, submittals, model viewers) follows is **types + adapters + blocks** — generic types as props, adapters per provider, blocks for the batteries-included path.

## The acc-sign-in block

`npx shadcn add @cantera/acc-sign-in` installs a working `/sign-in` page, `/api/auth/*` route handlers, and the auth wiring on aec-auth's vault. Configure with environment variables:

| Variable | Meaning |
| --- | --- |
| `APS_CLIENT_ID` / `APS_CLIENT_SECRET` | Your APS app credentials. |
| `APS_AUTH_BASE_URL` | Optional auth origin override — absolute, or relative like `/emulate/aps` for an embedded emulator. Unset = real APS. |
| `SESSION_SECRET` | HMAC key for the session cookie. Required in production — the block refuses to start without it. |
| `ACC_AUTH_DEMO` | Set to `1` only for emulator-backed demos: allows the insecure fallback session secret in production. |

The default vault store is in-memory. For production, swap in a durable `VaultStore` (Upstash Redis + encryption) — two lines, see the [aec-auth README](https://github.com/mrestrepoj10/aec-auth).

## Development

```sh
pnpm install
pnpm dev              # apps/www on :3000 — landing, docs, registry, live demo
pnpm lint             # biome
pnpm typecheck
pnpm registry:build   # registry.json -> apps/www/public/r/*.json (committed)
pnpm e2e              # Playwright: full OAuth flow through the embedded emulator
```

### Repo layout

- `apps/www` — one Next.js app: landing, per-component docs, registry hosting (`public/r`), and the live demo.
- `apps/www/registry/` — **source of truth for all distributed code.** The site imports these files through tsconfig path fallbacks (`@/components/ui/*` resolves to `registry/ui/*` first), so docs and demos render exactly what consumers install.
- `apps/www/app/emulate/[...path]` — the APS OAuth emulator embedded via `@emulators/adapter-next`. Same-origin, so the demo works on any deployment URL. State is in-memory and resets when the server recycles.
- `vendor/@emulators/` — prebuilt `core` / `aps` / `adapter-next` vendored from the [emulate fork](https://github.com/mrestrepoj10/emulate) until the upstream PR publishes them to npm.
- `e2e/` — Playwright smoke test of the full sign-in flow.

### Caveats for contributors

- Running `shadcn add` in `apps/www` rewrites `tsconfig.json` `paths` to `{"@/*": ["./*"]}` — restore the fallback mappings afterwards (see git diff).
- `pnpm registry:build` output in `apps/www/public/r/` is committed; CI fails if it drifts from `registry/`.

## License

MIT. Vendored `@emulators/*` packages are Apache-2.0 (see `vendor/@emulators/LICENSE`).
