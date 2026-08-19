# Agents

cantera is a shadcn registry for construction (AEC) UI, not an npm package. Consumers copy the code via `npx shadcn add @cantera/<item>`. Read `PLAN.md` for the design decisions and `README.md` for the product surface.

## Package manager and checks

Use `pnpm` for everything. Before calling any change done, from the repo root:

```sh
pnpm lint            # biome (single quotes, no semicolons, 100-col lines)
pnpm typecheck
pnpm registry:build  # required after touching apps/www/registry/** or registry.json
pnpm --filter www build
pnpm e2e             # Playwright: full OAuth flow through the embedded emulator
```

CI fails if `apps/www/public/r/` drifts from the registry sources — the build output is committed.

## The registry is the source of truth

- All distributed code lives in `apps/www/registry/` (`ui/`, `lib/`, `blocks/`). The site imports it through tsconfig path fallbacks: `@/components/ui/*` resolves to `registry/ui/*` before `components/ui/*`, and `@/lib/*` walks `registry/lib/*`, then the acc-sign-in block lib, then `lib/`. Docs and demos therefore render exactly what consumers install. Never duplicate a registry file into `components/` or `lib/`.
- Write imports in registry files as their INSTALLED specifiers (`@/components/ui/button`, `@/lib/oauth-types`), never as `@/registry/...`.
- Registry items reference siblings with namespaced deps (`@cantera/oauth-types`) and shadcn primitives by plain name (`button`) in `registry.json`.
- Distributed components are data-agnostic and style-agnostic: plain typed props in, callbacks out, no fetching, built only on the consumer's shadcn primitives. New domains follow the locked pattern: generic types + provider adapters + wired blocks.

## Caveats that bite

- Running `shadcn add` inside `apps/www` rewrites `tsconfig.json` `paths` to `{"@/*": ["./*"]}`. Restore the fallback mappings from git diff afterwards.
- `apps/www/components/ui/` holds harvested upstream base-nova primitives. Do not hand-edit them; refresh with `shadcn add <name> --overwrite` (then fix tsconfig, above).
- `vendor/@emulators/` is prebuilt dist output vendored from the mrestrepoj10/emulate fork (branch `add-aps-oauth-emulator`) — never edit it. To update: build in the emulate repo, re-copy the dists, note the commit in `vendor/@emulators/README.md`. Replace with npm packages once upstream publishes.
- The embedded emulator (`app/emulate/[...path]`) stores state in memory; demo connections reset when the server recycles. That is expected.
- The acc-sign-in block fails closed without `SESSION_SECRET` in production. The showcase runs with `ACC_AUTH_DEMO=1` (set in `next.config.ts`); do not copy that flag anywhere that guards real accounts.

## Conventions

- End-user install instructions use `npx shadcn@latest add ...`; repo development uses pnpm.
- Prose uses em dashes, not `--` (CLI flags excepted). No emojis in code, docs, or output.
- aec-auth owns everything token-shaped (refresh, storage, rotation). cantera renders; it never implements OAuth mechanics beyond the block's thin route wiring.
