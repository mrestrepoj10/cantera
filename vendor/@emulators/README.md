# Vendored @emulators packages

Prebuilt dists of `@emulators/core`, `@emulators/aps`, and `@emulators/adapter-next`,
vendored from the [mrestrepoj10/emulate](https://github.com/mrestrepoj10/emulate) fork
(branch `aps-modelcoordination`, commit `2524084`). Apache-2.0 (see LICENSE).

Beyond the OAuth flow, this build emulates read surfaces for ACC workflows:
the full Data Management folder, item, and version tree; Model Derivative;
Model Coordination; Issues; expanded RFIs; Sheets; and webhooks. Data is seeded
via `DEFAULT_DATA_SEED` / `ApsSeedConfig`.

Vendored because `@emulators/aps` is not yet published to npm (upstream PR to
vercel-labs/emulate pending) and its `workspace:*` dependency on `@emulators/core`
cannot resolve via a git subpath install. Replace with the npm packages once released.
