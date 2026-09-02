# Viewer Types (`@cantera/viewer-types`)

Typed surface for the Autodesk Viewer global runtime — Autodesk's official @types/forge-viewer definitions re-exported under stable APS* names, plus domain types for cameras, properties, extensions, and promise-based token callbacks.

- Type: types
- Install: `npx shadcn@latest add @cantera/viewer-types`
- Docs: https://canteraui.vercel.app/components/viewer-types
- Registry item: https://canteraui.vercel.app/r/viewer-types.json

Files written into the consumer project:

- `lib/viewer-types.ts`
- `lib/forge-viewer.d.ts`

## Notes

Types come from Autodesk's official @types/forge-viewer package (installed as a dev dependency), which declares the global Autodesk namespace plus a bundled minimal THREE namespace. lib/forge-viewer.d.ts adds the few members the official definitions miss (Profile, ProfileSettings, setProfile). If your tsconfig sets an explicit "types" array, add "forge-viewer" to it.

## Usage

The Autodesk Viewer ships as a browser global rather than an ESM package. These types re-export Autodesk's official @types/forge-viewer definitions (a dev dependency — the full Autodesk.Viewing namespace, typed) under stable APS* names, plus cantera's domain types for cameras, properties, and token callbacks.

```tsx
import type { GetAccessToken } from '@/lib/viewer-types'

const getAccessToken: GetAccessToken = async () => {
  const response = await fetch('/api/viewer-token')
  if (!response.ok) throw new Error('Viewer token unavailable')
  return response.json()
}
```

## Exports

- `GetAccessToken` (`() => Promise<{ accessToken: string; expiresInSeconds: number }>`) — Promise-based backend token supplier adapted by APSViewer to the Autodesk callback contract.
- `APSViewer3D / APSModel / APSDocument` (`interface`) — Structural subsets of the Viewer global objects used by the component and hooks.
- `APSViewerExtension / APSViewingNamespace / AutodeskGlobal` (`interface`) — Public extension and global-runtime surfaces, including the extension manager and toolbar lifecycle.
- `APSCameraState / APSPropertyResult / APSContextMenuItem` (`interface`) — Typed values returned by the camera, property, and context-menu hooks.
