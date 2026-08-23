# Vendored @emulators packages

Prebuilt dists of `@emulators/core`, `@emulators/aps`, and `@emulators/adapter-next`,
vendored from the [mrestrepoj10/emulate](https://github.com/mrestrepoj10/emulate) fork
(branch `aps-dm-search`, commit `d304737`). Apache-2.0 (see LICENSE). The fork
gitignores `dist/`, so dists are rebuilt at vendor time (`pnpm build` in the fork)
and committed here — the commit hash above is the source they were built from.

Beyond the OAuth flow, this build emulates read surfaces for ACC workflows —
the full Data Management folder, item, and version tree; Model Derivative;
Model Coordination; Issues; expanded RFIs; Sheets; and webhooks — plus the
ingestion chain: storage objects, signed S3 multipart upload, item and version
creation, recursive folder search (`filter[attributes.displayName]`,
`filter[fileType]`), Model Derivative job submission, and time-simulated translation
(pending → inprogress → success/failed, with `extraction.finished` webhooks).
Data is seeded via `DEFAULT_DATA_SEED` / `ApsSeedConfig`; upload and
translation behavior via the `upload` / `translation` config keys.

Vendored because `@emulators/aps` is not yet published to npm (upstream PR to
vercel-labs/emulate pending) and its `workspace:*` dependency on `@emulators/core`
cannot resolve via a git subpath install. Replace with the npm packages once released.
