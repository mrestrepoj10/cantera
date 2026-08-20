import { defineMeta } from 'blume'

/**
 * Top-level sidebar order. Authored — unlike `components/meta.ts`, which is
 * generated from `registry.json` by `apps/www/scripts/build-docs.mts`.
 *
 * Read in the order a newcomer needs it: what this is, how to get it, then the
 * reference for each item.
 */
export default defineMeta({
  pages: ['index', 'installation', 'components'],
})
