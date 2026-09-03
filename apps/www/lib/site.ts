// Resolution order: VERCEL_PROJECT_PRODUCTION_URL first so a preview build still
// links the real registry (a v0 link to an expired preview 404s), then the
// NEXT_PUBLIC_SITE_URL override, then the hardcoded domain so `registry:build`
// emits byte-identical artifacts on any machine. Server-side only:
// VERCEL_PROJECT_PRODUCTION_URL is not NEXT_PUBLIC_, so a client component
// would silently fall through to the hardcoded origin.

// The deployment URL, not canteraui.xyz: the domain is registered and delegated
// to Vercel DNS but not attached to this project, so it has no certificate and
// every published install command pointed at it failed the TLS handshake. Point
// this back at the domain once it is attached.
/** Mirrors `homepage` in registry.json. */
const PRODUCTION_ORIGIN = 'https://canteraui.vercel.app'

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

export const repositoryUrl = 'https://github.com/mrestrepoj10/cantera'

export function issueUrlFor(name: string): string {
  const params = new URLSearchParams({
    title: `${name}: `,
    body: `Item: ${registryNamespace}/${name}\nDocs: ${docsUrl(name)}\n\nWhat happened:\n\nWhat you expected:\n`,
  })
  return `${repositoryUrl}/issues/new?${params.toString()}`
}

/** The paste-into-an-agent install, mirroring the steps a person follows by hand. */
export function installPromptFor(name: string, kind: string): string {
  return `Install the ${registryNamespace}/${name} ${kind} into this project.

Steps:
1. Install the shadcn skill if missing: npx skills add shadcn/ui
2. Ensure this is a shadcn project (has components.json). If not, run: npx shadcn@latest init
3. Add the ${registryNamespace} registry to components.json (if missing):
${registryConfigSnippet}
4. Run: ${installCommandFor(name)}
5. Read what the CLI prints after the file list: keys added to .env.local and a Next list. Fill the keys, then follow the list.

After install, summarize what was added, which environment keys still need values, and any next steps. Docs: ${docsUrl(name)}`
}

export const defaultBranch = 'main'

export function templateSourceUrl(name: string): string {
  return `${repositoryUrl}/tree/${defaultBranch}/templates/${name}`
}

interface EnvDescriptionByKey {
  [key: string]: string
}

/** Every environment key a template can ask for, in the words the README and the deploy prompt use. */
export const envDescriptions: EnvDescriptionByKey = {
  APS_CLIENT_ID: 'Client ID of your APS app (aps.autodesk.com).',
  APS_CLIENT_SECRET: 'Client secret of the same APS app.',
  SESSION_SECRET: 'HMAC key for the session cookie. Generate one with `openssl rand -base64 32`.',
  APP_ORIGIN:
    'Canonical public origin, such as https://app.example.com. On Vercel it defaults to the production URL.',
  APS_AUTH_BASE_URL:
    'Optional APS origin override, absolute or relative (/emulate/aps) for an embedded emulator. Leave unset for real APS.',
  APS_BUCKET: 'Optional OSS bucket key. Defaults to one derived from the client ID.',
  UPSTASH_REDIS_REST_URL:
    'Upstash Redis REST URL. With the token and VAULT_KEY set, grants persist across serverless instances instead of living in memory.',
  UPSTASH_REDIS_REST_TOKEN: 'Upstash Redis REST token, paired with the URL above.',
  VAULT_KEY:
    'AES-256 key that encrypts grants at rest in Upstash. Generate one with `openssl rand -base64 32`.',
}

const OPTIONAL_ENV_KEYS = new Set([
  'APP_ORIGIN',
  'APS_AUTH_BASE_URL',
  'APS_BUCKET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'VAULT_KEY',
])

export function requiredEnvKeys(keys: string[]): string[] {
  return keys.filter((key) => !OPTIONAL_ENV_KEYS.has(key))
}

/** Vercel's clone flow over the generated template directory, prompting for the keys that have no default. */
export function deployUrlFor(name: string, envKeys: string[]): string {
  const params = new URLSearchParams({
    'repository-url': templateSourceUrl(name),
    'project-name': `cantera-${name}`,
    'repository-name': `cantera-${name}`,
    env: requiredEnvKeys(envKeys).join(','),
    envDescription: 'APS app credentials and a session secret. The README explains each key.',
    envLink: docsUrl(name),
  })
  return `https://vercel.com/new/clone?${params.toString()}`
}
