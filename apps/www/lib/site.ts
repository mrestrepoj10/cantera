/**
 * The one place the site's public origin is decided.
 *
 * Everything that has to name the deployment from the outside — the registry
 * URLs consumers paste into `components.json`, the docs links in the generated
 * `llms.txt` files, the "Open in v0" href — reads from here, so a domain change
 * is a one-line change.
 *
 * Resolution order, matching how the registry is actually served:
 * 1. `VERCEL_PROJECT_PRODUCTION_URL` — set on every Vercel deployment and always
 *    the production domain, so a preview build still links at the real registry
 *    (a v0 link to a preview URL would 404 the moment the preview expires).
 * 2. `NEXT_PUBLIC_SITE_URL` — the explicit override, for local runs and forks.
 * 3. The production domain, hardcoded, so a plain `pnpm registry:build` on any
 *    machine emits byte-identical committed artifacts.
 *
 * Server-side only. `VERCEL_PROJECT_PRODUCTION_URL` is not `NEXT_PUBLIC_`, so a
 * client component would silently fall through to the hardcoded origin — keep
 * the consumers of this module server-rendered.
 */

/** The domain the registry is served from. Mirrors `homepage` in registry.json. */
const PRODUCTION_ORIGIN = 'https://canteraui.xyz'

function resolveSiteUrl(): string {
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProduction) return `https://${vercelProduction.replace(/\/+$/, '')}`
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/+$/, '')
  return PRODUCTION_ORIGIN
}

export const siteUrl = resolveSiteUrl()

/** The namespace consumers register the registry under. */
export const registryNamespace = '@cantera'

/** The shadcn CLI command that installs one item. */
export function installCommandFor(name: string): string {
  return `npx shadcn@latest add ${registryNamespace}/${name}`
}

/** The static registry item the CLI (and v0) fetches. */
export function registryItemUrl(name: string): string {
  return `${siteUrl}/r/${name}.json`
}

/** The docs page for one item. */
export function docsUrl(name: string): string {
  return `${siteUrl}/components/${name}`
}

/**
 * The framed live preview for one item: the demo, no chrome.
 *
 * Absolute on purpose. The docs site is its own deployment on its own origin,
 * so a relative `src` would resolve against the docs domain and 404. This is
 * also why the origin has to be the production one rather than a preview URL —
 * see the resolution order above.
 */
export function embedUrl(name: string): string {
  return `${siteUrl}/embed/${name}`
}

/**
 * The markdown twin of the docs page — the same URL plus an extension, served
 * by `app/(site)/components/[name]/md` through the rewrite in next.config.
 * Relative on purpose: a link to it has to work on a preview deployment too.
 */
export function markdownPathFor(name: string): string {
  return `/components/${name}.md`
}

/**
 * The absolute markdown URL, for the prompt links that hand a page to a model —
 * those need a URL the model can fetch, not one relative to the reader's tab.
 */
export function markdownUrlFor(name: string): string {
  return `${siteUrl}${markdownPathFor(name)}`
}

/** v0's open endpoint, which imports a registry item into a new chat. */
export function v0Url(name: string): string {
  return `https://v0.dev/chat/api/open?url=${encodeURIComponent(registryItemUrl(name))}`
}

/** The one-time `components.json` edit, rendered from the resolved origin. */
export const registryConfigSnippet = `{
  "registries": {
    "${registryNamespace}": "${siteUrl}/r/{name}.json"
  }
}`
