import { createEmulateHandler, type EmulatorModule } from '@emulators/adapter-next'
import * as aps from '@emulators/aps'

// The APS OAuth emulator, embedded in the app: /emulate/aps/** serves the full
// stateful Autodesk authentication API (consent page, code exchange, single-use
// refresh rotation). Same-origin, so the demo works on any deployment URL with
// zero credentials.
//
// The emulator matches redirect URIs exactly (absolute), but our origin differs
// per deployment. This wrapper resolves relative redirect_uris in the seed
// against the runtime origin the adapter derives from the first request.
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
      seed: {
        users: [
          { name: 'Maria Renteria', email: 'maria@builders.example' },
          { name: 'Sam Ito', email: 'sam@builders.example' },
        ],
        clients: [
          {
            name: 'cantera demo',
            client_id: 'cantera-demo-client',
            client_secret: 'cantera-demo-secret',
            redirect_uris: ['/api/auth/callback/aps'],
          },
        ],
      } satisfies aps.ApsSeedConfig,
    },
  },
})
