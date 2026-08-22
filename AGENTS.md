# Agents

cantera is a shadcn registry for construction (AEC) UI — OAuth sign-in and connections, APS project data browsing, and an Autodesk Platform Services viewer. It is not an npm package: consumers copy the source with `npx shadcn@latest add @cantera/<item>` and own it from there, so there is no versioned API to protect — only code that must be correct the day it is copied. `README.md` covers the product surface, install, repo layout, and contributor caveats.

## Glossary

- **item** — one installable unit in `registry.json`. Its `type` decides where the CLI writes each file: `registry:ui` → `components/ui/`, `registry:component` → `components/`, `registry:lib` → `lib/`, `registry:block` → pages and routes with explicit `target`s, `registry:item` → cssVars merged into the consumer's CSS, `registry:example` → generated demo pages ("Open in v0").
- **consumer** — a project that installs cantera items. Everything distributed renders on the consumer's shadcn primitives and theme, never ours.
- **showcase** — `apps/www`: landing, docs, registry hosting, live demo. It renders the registry sources directly and is not distributed.
- **the pattern** — every domain ships as generic types (a per-domain `registry:lib`, never one monolithic types item) + provider adapters (presets translating APS/ACC payloads into those types) + wired blocks (pages and routes composing the components with aec-auth).
- **preset / adapter** — the provider-specific half of the pattern (`aps-oauth-preset`, `aps-data-preset`).
- **emulator** — the vendored APS emulator mounted at `app/emulate/[...path]`. The demo runs real OAuth and Data Management flows against it, credential-free.

## Invariants

- `apps/www/registry/` is the only source of distributed code. The site reads it through tsconfig path fallbacks (`@/components/ui/*` resolves to `registry/ui/*` first; `@/lib/*` walks `registry/lib/*`, then block libs, then `lib/`), so docs and demos render exactly what consumers install. Never duplicate a registry file into `components/` or `lib/`; a block with its own `components/` folder adds a tsconfig path entry.
- Distributed components are data-agnostic and style-agnostic: typed props in, callbacks out, no fetching, built only on the consumer's shadcn primitives.
- Generated output is committed and byte-verified. `registry:build` derives the example items, `public/r/`, the llms.txt artifacts, and `skills/cantera/` from `registry.json` + `components/site/props-tables.ts`; every URL comes from `apps/www/lib/site.ts`. Generators stay deterministic — no timestamps, no unordered iteration — because `registry:verify` rebuilds into a scratch directory and compares byte for byte.
- The design contracts are shipping gates, not preferences (see below).
- aec-auth owns everything token-shaped (refresh, storage, rotation). cantera renders; a block ships thin route wiring at most.
- React 19 / Next.js App Router only.

## The ways to hurt yourself

- **Running `shadcn add` inside `apps/www`** rewrites `tsconfig.json` `paths` to `{"@/*": ["./*"]}`, silently breaking registry-first resolution. Restore the fallback mappings from git diff every time. `apps/www/components/ui/` itself holds harvested upstream base-nova primitives — never hand-edit them; refresh with `shadcn add <name> --overwrite`, then fix tsconfig.
- **Writing a registry import as `@/registry/...`.** That path exists only in this repo; the installed copy breaks in the consumer's project. Use installed specifiers (`@/components/ui/button`, `@/lib/oauth-types`). `pnpm typecheck` cannot catch this — the fallbacks resolve it here — only `registry:verify` can.
- **Editing `vendor/@emulators/`** — prebuilt dists from the mrestrepoj10/emulate fork. Update by building in that repo, re-copying the dists, and noting the commit in `vendor/@emulators/README.md`.
- **Copying `ACC_AUTH_DEMO=1` anywhere that guards real accounts.** It disables the acc-sign-in block's fail-closed `SESSION_SECRET` check and exists only for the emulator-backed showcase (set in `next.config.ts`).
- The embedded emulator stores state in memory; demo connections reset when the server recycles. Expected, not a bug.

## Verifying

Use `pnpm` for everything. Run the smallest check that proves your change — CI runs the full suite on every PR and is the merge gate.

```sh
pnpm lint            # biome (single quotes, no semicolons, 100-col lines)
pnpm typecheck
pnpm registry:build  # REQUIRED after touching apps/www/registry/** or registry.json — commit its output
pnpm registry:verify # when registry:build ran: install closure, npm-dep coverage, drift
pnpm e2e             # light pass locally: light-theme axe only, viewer specs skipped
                     # (APS_E2E=1 opts in — they load the real Autodesk CDN and a model)
```

- Most changes need lint + typecheck plus the one e2e spec that covers them (`pnpm exec playwright test <file> -g "<pattern>"`).
- Do not run `pnpm --filter www build` or the full e2e matrix routinely — CI owns them (both appearances on a production server; viewer specs run when a PR touches viewer paths, and always on main).
- New item checklist: `registry.json`, source under `registry/`, `components/site/props-tables.ts`, `components/site/registry.ts`, a demo module under `components/site/demos/` plus its `dynamic()` entry in `components/site/demos.tsx` (one module per demo — the map keeps docs pages from bundling the whole demo graph), then `registry:build` + `registry:verify`, all committed.

## Design contracts

Canonical text lives in `apps/www/lib/design-contracts.ts` — the llms.txt artifacts and `skills/cantera` render from it, so editing it means running `pnpm registry:build`. One line each:

- **Status vocabulary** — every status renders from `@cantera/status-tokens`; one color, one meaning; recoverable states are warning, never danger; solid fills, never low-alpha washes; never a generic badge variant for a status. New tokens land in `apps/www/app/globals.css` (`:root` and `.dark`), the `@theme inline` block (with a `var(--token, var(--fallback))` default), and the `status-tokens` item's `cssVars` in `registry.json` — all three, or the consumer install drifts from the showcase.
- **Async pending** — disabled-with-spinner-while-keeping-the-label; a pressed control never unmounts or changes element type; pending is consumer-drivable as a prop and promise-driven internally; `aria-disabled` over `disabled`.
- **Field density** — 44px primary touch targets (gloves, tablet, on site); comfortable by default, compact opt-in; 12px text floor.
- **A11y bar** — 3:1 focus indicators, name/role/state on every control, `aria-describedby` wiring, real headings, locale-neutral `Intl`. Enforced by `e2e/a11y.spec.ts`: axe over the docs pages, which render the registry sources — an exclusion there is an exclusion for consumers, so add one only for a node outside our code, with the reason inline.
- **Motion grammar** — exactly four moves: icon/spinner crossfade (~150ms ease-out), press feedback via the primitive's `active:translate-y-px`, status `transition-colors`, and a rare user-initiated disclosure reveal (~200ms, gated on `prefers-reduced-motion`). No entrance animations on data-dense content.

## Conventions

- End-user install instructions use `npx shadcn@latest add ...` as the canonical form — the default tab on the installation page and the only form in README, docs prose, and the llms outputs. The installation page may additionally offer pnpm/bun tabs.
- Prose uses em dashes, not `--` (CLI flags excepted). No emojis in code, docs, or output.

## Plans and work artifacts

- Do not commit implementation plans, research notes, roadmaps, or agent scratch files — keep working material outside the worktree.
- Planned work lives in GitHub issues; a merged PR is the implementation record. Do not maintain a second checklist in the repo.
- Durable facts about how the system works belong here or in `README.md`, present tense, updated when the product changes.

## If a rule here fights the task

Say so loudly and get a human sign-off before breaking it. These are good defaults, not laws; the maintainer's word overrides anything here.
