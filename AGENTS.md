# Agents

cantera is a shadcn registry for construction (AEC) UI, not an npm package. Consumers copy the code via `npx shadcn add @cantera/<item>`. Read `PLAN.md` for the design decisions and `README.md` for the product surface.

## Package manager and checks

Use `pnpm` for everything. Before calling any change done, from the repo root:

```sh
pnpm lint            # biome (single quotes, no semicolons, 100-col lines)
pnpm typecheck
pnpm registry:build  # required after touching apps/www/registry/** or registry.json;
                     # also regenerates the llms.txt artifacts under apps/www/public
pnpm --filter www build
pnpm e2e             # Playwright: OAuth flow, axe (WCAG A/AA, both themes), theme + pending contracts
```

CI fails if `apps/www/public/r/`, `apps/www/public/llms.txt`, or `apps/www/public/llms-full.txt` drifts from the registry sources — the build output is committed. The generator (`apps/www/scripts/build-llms.mts`) reads `registry.json` and `components/site/props-tables.ts`, and every URL in it comes from `apps/www/lib/site.ts`, the one place the public origin is decided.

## The registry is the source of truth

- All distributed code lives in `apps/www/registry/` (`ui/`, `lib/`, `blocks/`). The site imports it through tsconfig path fallbacks: `@/components/ui/*` resolves to `registry/ui/*` before `components/ui/*`, and `@/lib/*` walks `registry/lib/*`, then the acc-sign-in block lib, then `lib/`. Docs and demos therefore render exactly what consumers install. Never duplicate a registry file into `components/` or `lib/`.
- Write imports in registry files as their INSTALLED specifiers (`@/components/ui/button`, `@/lib/oauth-types`), never as `@/registry/...`.
- Registry items reference siblings with namespaced deps (`@cantera/oauth-types`) and shadcn primitives by plain name (`button`) in `registry.json`.
- Distributed components are data-agnostic and style-agnostic: plain typed props in, callbacks out, no fetching, built only on the consumer's shadcn primitives. New domains follow the locked pattern: generic types + provider adapters + wired blocks.

## Design standards

These are shipping requirements, not preferences. A component that misses one is not done.

**Status vocabulary.** Every status renders from the status tokens (`@cantera/status-tokens`): `--status-success`, `--status-warning`, `--status-danger`, `--status-neutral`, each with a `-foreground` (ink on the solid fill) and a `-surface` (soft background, which always carries `text-status-*` ink) companion. One color, one meaning — success is healthy, warning is recoverable and needs attention, danger is a failure the user must act on, neutral is absence. Never reach for a generic badge variant (`secondary`, `destructive`) to mean a status: `secondary` reads as gray nothing, and `destructive` collapses "expired" and "broken" into one color. Recoverable states — expired, expiring soon — are warning, not danger. Every rendered pair is contrast-verified: text on a surface at 4.5:1 or better, non-text fills at 3:1 or better, in both appearances. New tokens land in `apps/www/app/globals.css` (both `:root` and `.dark`), get wired into the `@theme inline` block with a `var(--token, var(--fallback))` default, and get mirrored into the `status-tokens` item's `cssVars` in `registry.json` so consumers install them with the component.

**Async-pending contract.** Every component with an async callback exposes a pending state, and pending means disabled-with-spinner-while-keeping-the-label — never a label swapped for "Loading…", never a collapsed control. A pressed control is never unmounted and never changes element type mid-action: no button that becomes a link, no row that becomes a skeleton under the cursor. Pending is a prop the consumer can drive as well as an internal state, so a server action and a client handler both work.

**Field density.** Primary actions have a 44px minimum touch target — this UI is used with gloves, on a tablet, on site. Comfortable density by default; compact is opt-in, never the default. Status uses solid fills, not low-alpha tints: a `bg-*/10` wash is invisible in direct sunlight. 12px is the text floor — no `text-[0.7rem]`, no `text-[10px]`, anywhere in the registry.

**A11y shipping bar.** Custom focus indicators are 3:1 against their surroundings — use the `focus-visible:border-ring` pattern or a full-alpha ring; `ring-ring/50` alone does not clear the bar. Every control has a name, a role, and its state exposed. Descriptions and error text are wired with `aria-describedby`, never left as orphan prose. Prefer `aria-disabled` over `disabled` when the control must stay focusable and discoverable (so a screen reader user can still find it and read why). Every block ships a real heading, not a styled `div`. `Intl` is locale-neutral: `Intl.RelativeTimeFormat(undefined, …)` / `Intl.DateTimeFormat(undefined, …)` with an optional `locale` prop, never a hardcoded `'en'`. This bar is enforced, not reviewed: `e2e/a11y.spec.ts` runs axe over the landing page, `/demo`, `/components`, and every `/components/<name>` docs page in both appearances, and fails on any WCAG A/AA violation. The docs pages render the registry sources, so an exclusion there is an exclusion for consumers — add one only for a node outside our code, with the reason inline.

**Motion grammar — exactly four moves.** (1) Icon and spinner crossfade, about 150ms ease-out. (2) Press feedback, delegated to the primitive's `active:translate-y-px`. (3) Status color transitions, via `transition-colors`. (4) Progressive-disclosure reveal: a rare, user-initiated expand/collapse (the landing page's `<details>`) may transition height at about 200ms, always gated behind `prefers-reduced-motion` — never on content a user toggles repeatedly. That is the whole vocabulary. No entrance animations on data-dense content — a connections list does not stagger in.

## Caveats that bite

- Running `shadcn add` inside `apps/www` rewrites `tsconfig.json` `paths` to `{"@/*": ["./*"]}`. Restore the fallback mappings from git diff afterwards.
- `apps/www/components/ui/` holds harvested upstream base-nova primitives. Do not hand-edit them; refresh with `shadcn add <name> --overwrite` (then fix tsconfig, above).
- `vendor/@emulators/` is prebuilt dist output vendored from the mrestrepoj10/emulate fork (branch `add-aps-oauth-emulator`) — never edit it. To update: build in the emulate repo, re-copy the dists, note the commit in `vendor/@emulators/README.md`. Replace with npm packages once upstream publishes.
- The embedded emulator (`app/emulate/[...path]`) stores state in memory; demo connections reset when the server recycles. That is expected.
- The acc-sign-in block fails closed without `SESSION_SECRET` in production. The showcase runs with `ACC_AUTH_DEMO=1` (set in `next.config.ts`); do not copy that flag anywhere that guards real accounts.

## Conventions

- End-user install instructions use `npx shadcn@latest add ...` as the canonical form — it is the default tab on the installation page and the only form in README, docs prose, and the llms outputs. The installation page may additionally offer pnpm/bun tabs. Repo development uses pnpm.
- Prose uses em dashes, not `--` (CLI flags excepted). No emojis in code, docs, or output.
- aec-auth owns everything token-shaped (refresh, storage, rotation). cantera renders; it never implements OAuth mechanics beyond the block's thin route wiring.
