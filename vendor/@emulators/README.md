# Vendored @emulators packages

Prebuilt dists of `@emulators/core`, `@emulators/aps`, and `@emulators/adapter-next`,
vendored from the [mrestrepoj10/emulate](https://github.com/mrestrepoj10/emulate) fork
(branch `acc-workflow-core`, commit `e9379ca`). Apache-2.0 (see LICENSE).

Beyond the OAuth flow, this build emulates read surfaces for ACC workflows:
Data Management (hubs, projects), Model Derivative (formats, manifests),
Issues, RFIs, and Sheets, all seeded via `DEFAULT_DATA_SEED` / `ApsSeedConfig`.

Vendored because `@emulators/aps` is not yet published to npm (upstream PR to
vercel-labs/emulate pending) and its `workspace:*` dependency on `@emulators/core`
cannot resolve via a git subpath install. Replace with the npm packages once released.
