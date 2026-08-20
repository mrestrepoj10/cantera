import { defineConfig } from 'blume'

/**
 * The cantera documentation site.
 *
 * Its own app, and its own Vercel project on `docs.canteraui.xyz`, but not its
 * own repo: the reference pages under `content/components/` are generated from
 * `apps/www/registry.json` and `components/site/props-tables.ts` by
 * `pnpm registry:build`, and `pnpm registry:verify` rebuilds them into a
 * scratch directory and compares byte for byte. That check is only possible
 * while the generator, its sources, and its output share a commit — which is
 * the whole reason the docs live here rather than in a repo of their own.
 *
 * Live previews are framed from `apps/www` (`/embed/<name>`) rather than
 * imported. See `islands/ComponentPreview.tsx` for why.
 */
export default defineConfig({
  title: 'cantera',
  description:
    'Construction UI. shadcn-native. Components for AEC data — ACC-ready, source-agnostic.',

  content: {
    root: 'content',
  },

  github: {
    owner: 'mrestrepoj10',
    repo: 'cantera',
    branch: 'main',
    // Edit links have to point at the app, not the repo root, or every "edit
    // this page" lands one directory above the file it means.
    dir: 'apps/docs',
  },

  navigation: {
    repo: true,
    featured: [
      { label: 'Live demo', href: 'https://canteraui.xyz/demo', icon: 'play' },
      { label: 'Registry', href: 'https://canteraui.xyz/r/registry.json', icon: 'package' },
    ],
  },

  theme: {
    // Monochrome-leaning, matching the www aesthetic: the accent carries links
    // and focus, and the status vocabulary owns every other color on the page.
    accent: 'blue',
    radius: 'md',
    mode: 'system',
    fonts: {
      body: 'geist',
      display: 'geist',
      mono: 'geist-mono',
    },
  },

  markdown: {
    code: { icons: true, wrap: false },
  },

  search: {
    provider: 'pagefind',
  },

  ai: {
    // The registry ships its own llms.txt artifacts from `apps/www/public/`,
    // built by `scripts/build-llms.mts` and pinned by the drift verifier. These
    // are the docs-site twins — same content, indexed for this origin — and the
    // two stay distinct surfaces until the cutover decides which one is
    // canonical.
    llmsTxt: true,
  },

  seo: {
    sitemap: true,
    robots: true,
  },

  deployment: {
    output: 'static',
    site: 'https://docs.canteraui.xyz',
  },
})
