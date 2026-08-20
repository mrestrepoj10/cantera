/**
 * Ambient types for the build-time environment the islands compile against.
 *
 * Blume generates and drives a hidden Astro project, so `import.meta.env` is
 * Vite's — but `astro` is a transitive dependency of `blume` rather than a
 * direct one here, so `astro/client` is not resolvable from this package. Rather
 * than pin a second copy of Astro just for its ambient types, this declares the
 * one variable the islands actually read.
 */

interface ImportMetaEnv {
  /**
   * Origin to frame live previews from, overriding the production URL baked
   * into the generated MDX. Set this to a local `apps/www` while developing:
   * `PUBLIC_EMBED_ORIGIN=http://localhost:3000 pnpm dev`.
   */
  readonly PUBLIC_EMBED_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
