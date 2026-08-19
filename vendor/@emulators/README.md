# Vendored @emulators packages

Prebuilt dists of `@emulators/core`, `@emulators/aps`, and `@emulators/adapter-next`,
vendored from the [mrestrepoj10/emulate](https://github.com/mrestrepoj10/emulate) fork
(branch `add-aps-oauth-emulator`, commit `b2ab68c`). Apache-2.0 (see LICENSE).

Vendored because `@emulators/aps` is not yet published to npm (upstream PR to
vercel-labs/emulate pending) and its `workspace:*` dependency on `@emulators/core`
cannot resolve via a git subpath install. Replace with the npm packages once released.
