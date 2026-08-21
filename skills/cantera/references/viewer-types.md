# Viewer Types (`@cantera/viewer-types`)

Zero-dependency structural types for the Autodesk Viewer global runtime, documents, models, extensions, and promise-based token callbacks.

- Type: lib
- Install: `npx shadcn@latest add @cantera/viewer-types`
- Docs: https://canteraui.xyz/components/viewer-types
- Registry item: https://canteraui.xyz/r/viewer-types.json

Files written into the consumer project:

- `lib/viewer-types.ts`

## Usage

The Autodesk Viewer ships as a browser global rather than an ESM package. These zero-dependency structural types describe only the public surface cantera touches, so your callback, extension, and hook code stays typed without coupling to a separate runtime package.

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
