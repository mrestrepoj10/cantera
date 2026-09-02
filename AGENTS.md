# Agents

cantera is a shadcn registry for construction (AEC) UI — OAuth sign-in and connections, APS project data browsing, and an Autodesk Platform Services viewer. It is not an npm package: consumers copy the source with `npx shadcn@latest add @cantera/<item>` and own it from there, so there is no versioned API to protect — only code that must be correct the day it is copied. `README.md` covers the product surface, install, repo layout, and contributor caveats.

## Glossary

- **item** — one installable unit in `registry.json`. Its `type` decides where the CLI writes each file: `registry:ui` → `components/ui/`, `registry:component` → `components/`, `registry:lib` → `lib/`, `registry:block` → pages and routes with explicit `target`s, `registry:item` → cssVars merged into the consumer's CSS, `registry:example` → generated demo pages ("Open in v0").
- **kind** — the site-level taxonomy over `type`, carried in `meta.kind` on `registry:block` items: `block` (a page-sized surface) or `kit` (`acc-auth-routes`, the headless auth wiring blocks share). A block is a *page* when it ships a `registry:page` file — routes, `envVars`, the aec-auth glue — and a *screen* otherwise, the same surface over endpoints the consumer provides. `apps/www/lib/registry-kinds.ts` derives the three catalog groups — blocks, components, foundations — and the flavor from it; the site, skill, and llms artifacts all group that way. A **template** is a whole Next.js starter, the way every registry in the ecosystem uses the word; cantera ships none yet.
- **docs policy** — only pages and the kit carry a `docs` string, each at most 120 words in "installed at / Next / reference" form, because the CLI prints every `docs` in an install's closure as one block. Component and lib notes live in `installNotes` in `components/site/props-tables.ts` and render on the docs page, the markdown twin, the skill, and llms-full.txt. `verify-docs.mts` enforces both.
- **consumer** — a project that installs cantera items. Everything distributed renders on the consumer's shadcn primitives and theme, never ours.
- **showcase** — `apps/www`: landing, docs, registry hosting, live demo. It renders the registry sources directly and is not distributed.
- **the pattern** — every domain ships as generic types (a per-domain `registry:lib`, never one monolithic types item) + provider adapters (presets translating APS/ACC payloads into those types) + blocks (page-sized surfaces: screens over the consumer's endpoints, and pages that ship their routes and aec-auth glue).
- **preset / adapter** — the provider-specific half of the pattern (`aps-oauth-preset`, `aps-data-preset`).
- **emulator** — the vendored APS emulator mounted at `app/emulate/[...path]`. The demo runs real OAuth and Data Management flows against it, credential-free.

## Invariants

- `apps/www/registry/` is the only source of distributed code. The site reads it through tsconfig path fallbacks (`@/components/ui/*` resolves to `registry/ui/*` first; `@/lib/*` walks `registry/lib/*`, then block libs, then `lib/`), so docs and demos render exactly what consumers install. Never duplicate a registry file into `components/` or `lib/`; a block directory that installs into `components/` adds a tsconfig path entry (mirrored in `scripts/verify-tsconfig-paths.mts`).
- Distributed components are data-agnostic and style-agnostic: typed props in, callbacks out, no fetching, built only on the consumer's shadcn primitives.
- Generated output is committed and byte-verified. `registry:build` derives the example items, the server-only docs demo registry, `public/r/`, the llms.txt artifacts, and `skills/cantera/` from `registry.json` + `components/site/props-tables.ts`; every URL comes from `apps/www/lib/site.ts`. Generators stay deterministic — no timestamps, no unordered iteration — because `registry:verify` rebuilds into a scratch directory and compares byte for byte.
- The design contracts are shipping gates, not preferences (see below).
- aec-auth owns everything token-shaped (refresh, storage, rotation). cantera renders; a block ships thin route wiring at most.
- React 19 / Next.js App Router only.

## The ways to hurt yourself

- **Running `shadcn add` inside `apps/www`** rewrites `tsconfig.json` `paths` to `{"@/*": ["./*"]}`, silently breaking registry-first resolution. Restore the fallback mappings from git diff every time. `apps/www/components/ui/` itself holds harvested upstream base-nova primitives — never hand-edit them; refresh with `shadcn add <name> --overwrite`, then fix tsconfig.
- **Writing a registry import as `@/registry/...`.** That path exists only in this repo; the installed copy breaks in the consumer's project. Use installed specifiers (`@/components/ui/button`, `@/lib/oauth-types`). `pnpm typecheck` cannot catch this — the fallbacks resolve it here — only `registry:verify` can.
- **Shipping a suppression comment in registry sources.** `biome-ignore` is inert in a consumer's ESLint, an `eslint-disable` naming a plugin the consumer lacks is a hard error there, and the shadcn CLI strips leading file-level comments on install. Fix at source instead — the ESLint gate and the consumer sim in `registry:verify` both enforce zero suppressions.
- **Editing `vendor/@emulators/`** — prebuilt dists from the mrestrepoj10/emulate fork. Update by building in that repo, re-copying the dists, and noting the commit in `vendor/@emulators/README.md`.
- **Copying `ACC_AUTH_DEMO=1` anywhere that guards real accounts.** It disables the acc-sign-in block's fail-closed `SESSION_SECRET` check and exists only for the emulator-backed showcase (set in `next.config.ts`).
- The embedded emulator stores state in memory; demo connections reset when the server recycles. Expected, not a bug.

## Verifying

Use `pnpm` for everything. Run the smallest check that proves your change — CI runs the full suite on every PR and is the merge gate.

```sh
pnpm lint            # biome (single quotes, no semicolons, 100-col lines), the anti-slop oxlint
                     # plugin (.oxlintrc.json — type-laundering patterns; rules tuned there with
                     # reasons), and the consumer-dialect ESLint gate over apps/www/registry/**
                     # (eslint-config-next, zero warnings)
pnpm typecheck
pnpm registry:build  # REQUIRED after touching apps/www/registry/** or registry.json — commit its output
pnpm registry:verify # when registry:build ran: install closure, npm-dep coverage, drift, and the
                     # consumer sim (registry laid out at installed paths, eslint + strict tsc)
pnpm e2e             # light pass locally: viewer specs skipped
                     # (APS_E2E=1 opts in — they load the real Autodesk CDN and a model)
```

- Most changes need lint + typecheck plus the one e2e spec that covers them (`pnpm exec playwright test <file> -g "<pattern>"`).
- Do not run `pnpm --filter www build` or the full e2e matrix routinely — CI owns them (production server; viewer specs run when a PR touches viewer paths, and always on main).
- New item checklist: `registry.json`, source under `registry/`, `components/site/props-tables.ts`, `components/site/registry.ts`, and a conventionally named demo under `components/site/demos/` or `registry/examples/`; `registry:build` generates the server-only lazy lookup so docs pages keep one module per demo without a client-side import waterfall. Run `registry:build` + `registry:verify` and commit all output.

## Design contracts

Canonical text lives in `apps/www/lib/design-contracts.ts` — the llms.txt artifacts and `skills/cantera` render from it, so editing it means running `pnpm registry:build`. One line each:

- **Status vocabulary** — every status renders from `@cantera/status-tokens`; one color, one meaning; recoverable states are warning, never danger; solid fills, never low-alpha washes; never a generic badge variant for a status. New tokens land in `apps/www/app/globals.css` (`:root` and `.dark`), the `@theme inline` block (with a `var(--token, var(--fallback))` default), and the `status-tokens` item's `cssVars` in `registry.json` — all three, or the consumer install drifts from the showcase.
- **Async pending** — disabled-with-spinner-while-keeping-the-label; a pressed control never unmounts or changes element type; pending is consumer-drivable as a prop and promise-driven internally; `aria-disabled` over `disabled`.
- **Field density** — 44px primary touch targets (gloves, tablet, on site); comfortable by default, compact opt-in; 12px text floor.
- **A11y bar** — designed to meet WCAG A/AA: 3:1 focus indicators, name/role/state on every control, `aria-describedby` wiring, real headings, locale-neutral `Intl`. No automated gate — review by hand.

## Conventions

- Comments are freight. Registry sources ship verbatim into consumer projects, and every comment line rides along and rots there. Default to zero — names, types, and structure carry the meaning. A comment earns its line only when it states a constraint the code cannot express (a workaround's reason, an invariant that looks removable), tells the consumer what to replace (sample data in examples and blocks), or is a functional directive (`'use client'`, a lint suppression with its reason). Never narrate a line, restate a type, duplicate the docs or props tables, or reference this repo's history. The same default applies to showcase and test code.
- Motion and animations are implemented only when the maintainers or the user ask for them — never add animation work unprompted.
- End-user install instructions use `npx shadcn@latest add ...` as the canonical form — the default tab on the installation page and the only form in README, docs prose, and the llms outputs. The installation page may additionally offer pnpm/bun tabs.
- Prose uses em dashes, not `--` (CLI flags excepted). No emojis in code, docs, or output.

## Plans and work artifacts

- Do not commit implementation plans, research notes, roadmaps, or agent scratch files — keep working material outside the worktree.
- Planned work lives in GitHub issues; a merged PR is the implementation record. Do not maintain a second checklist in the repo.
- Durable facts about how the system works belong here or in `README.md`, present tense, updated when the product changes.

## If a rule here fights the task

Say so loudly and get a human sign-off before breaking it. These are good defaults, not laws; the maintainer's word overrides anything here.
