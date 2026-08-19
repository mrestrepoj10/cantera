# cantera — Implementation Plan

**The construction UI registry.** shadcn-compatible components for AEC data — ACC-ready, source-agnostic. Distributed via the shadcn CLI from canteraui.xyz. MIT, maintained at `github.com/mrestrepoj10/cantera` (public from the first commit).

This plan is the output of a grill session (2026-08-18). Every section below records a settled decision; nothing here is a silent assumption.

---

## 1. Positioning

- Name: **cantera**. Registry namespace: **`@cantera`**. Domain: **canteraui.xyz** (bought; connected via Vercel CLI at M4).
- Pitch: open-source, copy-paste-owned components for construction data. Compatible with ACC APIs (OAuth, Issues, Model Derivative, …) but never constrained to them — any user with data can use every component.
- Ecosystem: cantera is the UI layer over [`aec-auth`](https://github.com/mrestrepoj10/aec-auth) (token layer, npm) and demos against the [emulate fork](https://github.com/mrestrepoj10/emulate)'s APS emulator. cantera itself is **pure registry — no npm package**. Release model: latest-wins registry items, git tags + CHANGELOG for history.
- cantera *is* the "shadcn-style init scaffolder" from aec-auth's roadmap: `npx shadcn add @cantera/acc-sign-in`.

## 2. Architecture decisions

| Decision | Choice |
| --- | --- |
| Repo shape | Single Next.js app `apps/www` = landing + component docs + registry host + live demo. `apps/app` (dashboards) added later. No `packages/` until something must live outside www. |
| Component base | Base UI-flavored shadcn primitives, **style-agnostic**: cantera items declare shadcn primitives (`button`, `card`, `dialog`, …) as `registryDependencies` and inherit the consumer's configured base/style/theme. We never ship restyled primitives. Optional cantera theme item: post-v1. |
| Framework scope | React 19 / Next.js App Router only. Item boundaries keep a future Vue/universal port possible, not promised. |
| Registry serving | Static: `registry.json` + `shadcn build` → `public/r/*.json`, committed and CI-verified. Consumers configure `"registries": { "@cantera": "https://canteraui.xyz/r/{name}.json" }`. Dynamic route handlers (search/auth) are a non-breaking later upgrade. |
| aec-auth coupling | **Layered.** Pure presentational components take plain props/callbacks, zero deps. `registry:block` items compose them *with* aec-auth (routes, vault, session) for the batteries-included ACC path. |
| Data-agnostic pattern | **Types + adapters** (the rule for every future domain): cantera defines generic domain types (`Connection`, `Scope`, …); components take them as props; separate registry items ship adapters translating ACC/APS (later Procore, anything) into them. |
| Item granularity | Per-domain `registry:lib` items (`oauth-types`, `aps-oauth-preset`) — never a monolithic types item. Components pull them via `registryDependencies`. |
| Tooling | pnpm + Turborepo + TypeScript + Tailwind v4 + Biome (aec-auth's stack). Vitest for lib/adapters. One Playwright smoke test for the OAuth demo flow. CI: lint, typecheck, tests, `shadcn build` output valid + committed. |
| Deployment | Vercel, personal account. `cantera.vercel.app` until M4 connects canteraui.xyz. |

## 3. Repo tree (v1)

```
cantera/
├── apps/www/                      # Next.js App Router (landing + docs + registry + demo)
│   ├── app/
│   │   ├── (site)/                # landing, components/[name]
│   │   ├── demo/                  # wired acc-sign-in flow
│   │   └── api/
│   │       ├── auth/…             # demo auth routes (aec-auth vault, memory store)
│   │       └── emulator/[[...]]/  # @emulators/aps mounted via @emulators/adapter-next
│   ├── registry/                  # SOURCE OF TRUTH for distributed code
│   │   ├── ui/                    #   provider-sign-in-button.tsx, sign-in-card.tsx, …
│   │   ├── blocks/acc-sign-in/    #   block: page + routes + lib wiring
│   │   └── lib/                   #   oauth-types.ts, aps-oauth-preset.ts
│   ├── registry.json
│   └── public/r/                  # shadcn build output (committed, CI-verified)
├── e2e/                           # Playwright: OAuth flow smoke test
├── turbo.json  pnpm-workspace.yaml  biome.json
└── README.md
```

Showcase pages import from `@/registry/*` so demos render the exact distributed code — no drift (shadcn/registry-template pattern).

**Emulator dependency:** `pnpm add github:mrestrepoj10/emulate#path:packages/@emulators/aps` (pnpm resolves monorepo subpaths). Switch to npm `@emulators/aps` when the upstream vercel-labs PR ships.

## 4. v1 registry items

### `registry:lib`

- **`oauth-types`** — the lingua franca:
  ```ts
  type Provider   = { id: string; name: string; icon?: ReactNode }
  type Scope      = { id: string; label: string; description?: string; required?: boolean }
  type Connection = { provider: Provider; status: 'connected'|'expired'|'error'|'disconnected';
                     account?: { name?: string; email?: string; avatarUrl?: string };
                     scopes?: string[]; expiresAt?: Date }
  ```
- **`aps-oauth-preset`** — `apsProvider`, `apsScopeCatalog` (built from aec-auth's `apsScopes` recipes: viewer, dataRead, dataWrite, accountAdmin + the APS scope list), `fromApsConnection()` adapters.

### `registry:item`

- **`status-tokens`** — the semantic status palette: `--status-success` / `-warning` / `-danger` / `-neutral`, each with a `-foreground` (ink on the solid fill) and a `-surface` (soft background) companion, in light and dark. Shipped as `cssVars` rather than a file, so `npx shadcn add @cantera/status-tokens` merges the variables and the `@theme inline` mappings straight into the consumer's CSS. Every component that renders status declares it as a `registryDependency`; the `@theme` mappings carry `var(--token, var(--fallback))` defaults so a theme that drops the variables degrades instead of rendering invisible.

### `registry:component` (pure, controlled, data-in-props)

| Item | API sketch |
| --- | --- |
| `provider-sign-in-button` | `provider`, `onSignIn` (fn or href), `loading?` |
| `sign-in-card` | `providers`, `onSignIn(id)`, `title?`, `description?`, `footer?` |
| `scope-picker` | `scopes: Scope[]`, `value: string[]`, `onChange`, `presets?` — verified viable end-to-end: aec-auth exports scope recipes with descriptions; the APS emulator validates 16 scopes + granular `data:read:<urn>`, rejects with `invalid_scope`, advertises `scopes_supported` |
| `connection-card` | `connection`, `onDisconnect?`, `onReconnect?` |
| `token-status` | `connection`, `showScopes?`, `showExpiry?` |
| `user-account-badge` | `account`, `provider` |

APIs are the working contract — props get refined in implementation; shape and philosophy are locked.

### `registry:block`

- **`acc-sign-in`** — sign-in page + `/api/auth` route handlers on aec-auth (vault or Connect backend), composing the components above. The 5-minute ACC path.
- **`connections-page`** — fast-follow after v1 (manage APS/Procore grants).

## 5. Live demo architecture

- **Deployed showcase embeds the APS emulator** (`@emulators/aps` via `@emulators/adapter-next`): visitors run the *actual* stateful OAuth flow — consent page, code exchange, single-use refresh rotation — in production, zero credentials. Dogfoods cantera + aec-auth + emulate at once.
- Local dev: `npx emulate --service aps` also works.
- Fallback if the fork dep gets awkward: `aec-auth/mock` fixtures (static/simulated demos).
- Known risk: the emulator store is in-memory; on serverless the demo state can reset between invocations. Fluid Compute instance reuse makes this mostly invisible; a mid-flow reset just restarts the demo. Acceptable for v1 — revisit only if it annoys in practice.

## 6. apps/www (v1 scope: minimal, code-driven)

- **`/`** — one screen that is the pitch: hero ("Construction UI. shadcn-native."), copyable install command (`npx shadcn add @cantera/sign-in-card`), the live OAuth demo inline, component grid, and an ecosystem strip linking aec-auth + emulate.
- **`/components/[name]`** — live preview, install command, source view, props table — rendered from registry source, no MDX engine (prose guides post-v1).
- **`/demo`** — the full wired `acc-sign-in` flow against the embedded emulator.
- Aesthetic: emulate-`apps/web` school — Geist fonts, mostly monochrome, generous whitespace. Quality bar: vercel-labs `web-interface-guidelines`. Next.js patterns reference: `next-beats`.

## 7. Milestones

1. **M0 Scaffold** — public repo, pnpm + turbo + Biome, apps/www boots, Vercel project deployed to `cantera.vercel.app`.
2. **M1 Registry core** — `oauth-types`, 6 components, `aps-oauth-preset`, `registry.json`, `shadcn build` green; items installable cross-project from the deployed URL. *(Before M2, so the site always documents something real.)*
3. **M2 www** — landing + component pages rendering registry source.
4. **M3 Live demo** — embedded emulator + `acc-sign-in` block + `/demo` + Playwright smoke test.
5. **M4 Launch** — connect canteraui.xyz via Vercel CLI + README. **Nothing else.**

**"v1 launched"** = M4 complete: any shadcn project can `npx shadcn add @cantera/sign-in-card` from canteraui.xyz, and the site demos the full OAuth flow credential-free.

## 8. Post-v1 (deliberately out of scope)

- shadcn registry directory/index submission — **after we review the live registry**, not part of v1.
- `connections-page` block; cantera theme item; MDX prose guides; dynamic registry routes (search/auth); "Open in v0".
- `apps/app` — dashboards for construction data: issues, RFIs, submittals, model viewers (APS Viewer via aps-viewer-react learnings). Each new domain follows the locked pattern: **types + adapters + blocks**. Domain schemas get designed when their slice starts, not before.
- Procore preset (`procore-oauth-preset`) once aec-auth ships Procore support.

## 9. Design roadmap (from the 2026-08-19 design review)

Design work from the review. Each item is a contract for whoever picks it up; none block v1 launch. Shipped items keep their contract text so the decision stays readable.

- **Done — `scope-picker` custom-scope escape hatch.** Shipped as `allowCustomScopes` / `customScopeLabel`: a labelled field (Enter or Add) appends any string as a scope, custom scopes render with a `custom` badge and a remove button, and they round-trip through `value` / `onChange` in insertion order after the catalog scopes. The original contract: the catalog covers the documented APS scopes, but the emulator already validates granular scopes (`data:read:<urn>`) and providers add scopes faster than a preset can track. `scope-picker` needs a way to enter a scope that is not in the catalog — an "Add scope" affordance producing an `OAuthScope` with the raw string as both `id` and `label` — so a locked catalog never becomes a dead end. Custom scopes render distinguishably from catalog scopes and round-trip through `value` / `onChange` like any other.
- **Empty, error, and loading states for the `connections-page` block.** The block ships all four states or it does not ship: **empty** (no connections yet — the provider chooser is the empty state, not a message about nothingness), **loading** (skeleton rows that match the real row geometry, no layout shift on resolve, no stagger), **error** (the failure is on the row that failed, with a retry that follows the async-pending contract, and a page-level error only when the whole fetch failed), and **partial** (one provider errored while the others are fine — the healthy rows still render). Guidance lives with the block; the presentational components stay data-agnostic and take these as props.
- **Done — provider icon sizing contract.** Settled on the default: preset marks carry their own `className="size-4"`, so one renders correctly wherever it is dropped, and a `[&_svg]:size-*` wrapper still wins on specificity where a surface wants another size. Documented on `OAuthProvider.icon` in `oauth-types`. The original contract: preset icons (`apsProvider.icon` and every future provider mark) are unsized SVGs: they inherit size only inside a `[&_svg]:size-*` wrapper, so dropping one into arbitrary markup renders it at the intrinsic or collapsed size. Settle this one of two ways and document the choice in `oauth-types`: either every consumer surface declares a `[&_svg]:size-*` wrapper (documented on `OAuthProvider.icon`), or preset icons carry a default `className="size-4"` that a wrapper can still override. Prefer the default — it fails visibly correct rather than invisibly wrong — and keep the wrapper pattern working either way.

## 10. Risks & watch items

- **Fork dependency**: `@emulators/aps` unpublished; git-subpath dep until the upstream PR lands. Fallback path exists (mock fixtures).
- **Serverless emulator state**: in-memory store may reset between invocations (see §5).
- **shadcn surface churn**: registries/CLI evolved fast through 2026 (namespaces, universal items, dynamic search). Static `/r/{name}.json` is the stable core; re-check the changelog at M1 before finalizing `registry.json`.
