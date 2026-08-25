// Resolution order: VERCEL_PROJECT_PRODUCTION_URL first so a preview build still
// links the real registry (a v0 link to an expired preview 404s), then the
// NEXT_PUBLIC_SITE_URL override, then the hardcoded domain so `registry:build`
// emits byte-identical artifacts on any machine. Server-side only:
// VERCEL_PROJECT_PRODUCTION_URL is not NEXT_PUBLIC_, so a client component
// would silently fall through to the hardcoded origin.

/** Mirrors `homepage` in registry.json. */
const PRODUCTION_ORIGIN = 'https://canteraui.xyz'

function resolveSiteUrl(): string {
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProduction) return `https://${vercelProduction.replace(/\/+$/, '')}`
  const configured = process.env.NEXT_PUBLIC_SITE_URL
  if (configured) return configured.replace(/\/+$/, '')
  return PRODUCTION_ORIGIN
}

export const siteUrl = resolveSiteUrl()

export const registryNamespace = '@cantera'

export function installCommandFor(name: string): string {
  return `npx shadcn@latest add ${registryNamespace}/${name}`
}

export function registryItemUrl(name: string): string {
  return `${siteUrl}/r/${name}.json`
}

export function docsUrl(name: string): string {
  return `${siteUrl}/components/${name}`
}

/** Relative on purpose: the link has to work on a preview deployment too. */
export function markdownPathFor(name: string): string {
  return `/components/${name}.md`
}

export function markdownUrlFor(name: string): string {
  return `${siteUrl}${markdownPathFor(name)}`
}

export function v0Url(name: string): string {
  return `https://v0.dev/chat/api/open?url=${encodeURIComponent(registryItemUrl(name))}`
}

export const registryConfigSnippet = `{
  "registries": {
    "${registryNamespace}": "${siteUrl}/r/{name}.json"
  }
}`
