# Viewer Extension Types (`@cantera/viewer-extension-types`)

A typed catalog of the Autodesk Viewer's public extensions: every loadExtension id, the options each one actually reads, and the flags that decide whether loading it can work — verified against the shipped viewer source.

- Type: lib
- Install: `npx shadcn@latest add @cantera/viewer-extension-types`
- Docs: https://canteraui.vercel.app/components/viewer-extension-types
- Registry item: https://canteraui.vercel.app/r/viewer-extension-types.json

Files written into the consumer project:

- `lib/viewer-extension-types.ts`

## Install notes

Pure types and data — no runtime dependency on the viewer. Pair with @cantera/aps-viewer: pass viewerExtension(...) entries to the extensions prop, or use AEC_STARTER_EXTENSIONS as a field-tested default for AEC models. Entries marked deprecated or removedIn should not ship in new code.

## Usage

The Autodesk Viewer grows real capability through extensions, but the SDK leaves their ids as bare strings and their options as untyped bags — and ids circulating in old blog posts include extensions that no longer exist. This catalog types both, verified against the shipped viewer source, so a wrong id or option is a compile error instead of a silent runtime 404.

```tsx
import { viewerExtension } from '@/lib/viewer-extension-types'
import { APSViewer } from '@/components/ui/aps-viewer'

<APSViewer
  urn={urn}
  getAccessToken={getAccessToken}
  profile="aec"
  extensions={[
    viewerExtension('Autodesk.AEC.LevelsExtension', { ifcLevelsEnabled: true }),
    viewerExtension('Autodesk.Viewing.MarkupsGui'),
    'MyProject.CustomExtension',
  ]}
/>
```

## Exports

- `VIEWER_EXTENSIONS` (`Record<KnownViewerExtensionId, ViewerExtensionInfo>`) — The catalog: every public extension id with what it adds, whether GuiViewer3D auto-loads it, toolbar and 2D/3D flags, AEC-model-data requirements, and deprecated/removedIn markers.
- `viewerExtension(id, options?)` (`ViewerExtensionEntry`) — Typed entry builder for the APSViewer extensions prop: the id is checked against the catalog and the options against that extension’s interface.
- `ViewerExtensionOptionsMap` (`interface`) — Extension id to the options loadExtension actually reads — MeasureExtensionOptions, LevelsExtensionOptions, DocumentBrowserExtensionOptions, and the rest.
- `AEC_STARTER_EXTENSIONS` (`readonly ViewerExtensionEntry[]`) — A field-tested starter set for AEC models: levels, measurement, markup, and the sheet browser, ordered so options can reach auto-loaded dependencies.
- `KnownViewerExtensionId / ViewerExtensionInfo / ViewerExtensionEntry` (`types`) — The catalog’s id union, per-extension metadata shape, and the { id, options } entry shape the viewer accepts.
