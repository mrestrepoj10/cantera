import { withEmulate } from '@emulators/adapter-next'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    // Demo defaults: the acc-sign-in block talks to the embedded APS emulator
    // (app/emulate/[...path]) with its seeded client. Real deployments of the
    // block set real APS credentials instead.
    APS_CLIENT_ID: process.env.APS_CLIENT_ID ?? 'cantera-demo-client',
    APS_CLIENT_SECRET: process.env.APS_CLIENT_SECRET ?? 'cantera-demo-secret',
    APS_AUTH_BASE_URL: process.env.APS_AUTH_BASE_URL ?? '/emulate/aps',
    // The showcase runs the block in demo mode: sessions guard nothing real
    // (emulator-backed fake users), so the insecure fallback secret is allowed.
    ACC_AUTH_DEMO: process.env.ACC_AUTH_DEMO ?? '1',
  },
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
