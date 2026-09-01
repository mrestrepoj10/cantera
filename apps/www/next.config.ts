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

// Showcase-only emulator defaults. Production deployments opt in with
// ACC_AUTH_DEMO=1 or provide real platform environment variables; none are
// exposed through NEXT_PUBLIC_*.
//
// An empty string counts as unset, not as an override: CI hands every job the
// APS secrets, and on a fork-originated pull request GitHub hands those
// through as empty strings. `??=` would keep the empty value and take the
// emulator's own sign-in flow down with it.
function envDefault(key: string, value: string): void {
  if (!process.env[key]) process.env[key] = value
}

const emulatorDefaults = process.env.NODE_ENV !== 'production' || process.env.ACC_AUTH_DEMO === '1'
if (emulatorDefaults) {
  envDefault('APS_CLIENT_ID', 'cantera-demo-client')
  envDefault('APS_CLIENT_SECRET', 'cantera-demo-secret')
  envDefault('APS_AUTH_BASE_URL', '/emulate/aps')
  if (process.env.NODE_ENV !== 'production') envDefault('ACC_AUTH_DEMO', '1')
}

const nextConfig: NextConfig = {
  // Next 16.3 can prefetch one reusable shell per route. Runtime data stays
  // behind the app's existing Suspense boundaries and streams after navigation.
  cacheComponents: true,
  partialPrefetching: true,
  async rewrites() {
    return [
      // The markdown twin of each docs page is served at `/components/<name>.md`.
      // App Router dynamic segments cannot carry a file extension — `[name].md`
      // is read as a literal directory — so the extension is matched here and
      // rewritten onto the route handler's own segment. A rewrite, not a
      // redirect: the URL that claims `.md` is the one that answers with
      // markdown.
      { source: '/components/:name.md', destination: '/components/:name/md' },
      // The vendored emulator signs upload and blob URLs against the origin,
      // dropping its /emulate/aps mount (new URL('/path', base) discards the
      // base path). Route those origin-rooted paths back onto the mount.
      {
        source: '/oss/v2/signed-upload/:path*',
        destination: '/emulate/aps/oss/v2/signed-upload/:path*',
      },
      { source: '/_aps/:path*', destination: '/emulate/aps/_aps/:path*' },
    ]
  },
}

export default withEmulate(nextConfig)
