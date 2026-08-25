import { createEmulateHandler, type EmulatorModule } from '@emulators/adapter-next'
import * as aps from '@emulators/aps'

import { apsDemoSeed } from '@/lib/aps-demo-seed'

// Same-origin APS OAuth emulator at /emulate/aps/**: zero credentials on any
// deployment. It matches redirect URIs exactly, so relative redirect_uris in
// the seed are resolved against the runtime origin derived from the first
// request.
const apsEmulator: EmulatorModule = {
  ...aps,
  seedFromConfig(store, baseUrl, config) {
    const origin = new URL(baseUrl).origin
    const seed = config as aps.ApsSeedConfig
    aps.seedFromConfig(store, baseUrl, {
      ...seed,
      clients: seed.clients?.map((client) => ({
        ...client,
        redirect_uris: client.redirect_uris.map((uri) =>
          uri.startsWith('/') ? `${origin}${uri}` : uri,
        ),
      })),
    })
  },
}

export const { GET, POST, PUT, PATCH, DELETE } = createEmulateHandler({
  services: {
    aps: {
      emulator: apsEmulator,
      seed: apsDemoSeed,
    },
  },
})
