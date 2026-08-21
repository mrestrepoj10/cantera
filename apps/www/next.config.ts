import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { withEmulate } from '@emulators/adapter-next'
import type { NextConfig } from 'next'

// Next loads env files from the app directory, while this monorepo keeps its
// ignored developer credentials at the repository root. Load that file into
// the server process without using nextConfig.env, which would inline secrets
// into client bundles.
const repositoryEnv = fileURLToPath(new URL('../../.env', import.meta.url))
if (existsSync(repositoryEnv)) process.loadEnvFile?.(repositoryEnv)

// Showcase-only emulator defaults. Production deployments replace these with
// platform environment variables; none are exposed through NEXT_PUBLIC_*.
process.env.APS_CLIENT_ID ??= 'cantera-demo-client'
process.env.APS_CLIENT_SECRET ??= 'cantera-demo-secret'
process.env.APS_AUTH_BASE_URL ??= '/emulate/aps'
process.env.ACC_AUTH_DEMO ??= '1'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // The markdown twin of each docs page is served at `/components/<name>.md`.
      // App Router dynamic segments cannot carry a file extension — `[name].md`
      // is read as a literal directory — so the extension is matched here and
      // rewritten onto the route handler's own segment. A rewrite, not a
      // redirect: the URL that claims `.md` is the one that answers with
      // markdown.
      { source: '/components/:name.md', destination: '/components/:name/md' },
    ]
  },
}

export default withEmulate(nextConfig)
