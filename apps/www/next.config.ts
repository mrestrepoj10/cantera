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
}

export default withEmulate(nextConfig)
