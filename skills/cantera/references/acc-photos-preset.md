# ACC Photos Preset (`@cantera/acc-photos-preset`)

Autodesk Construction Cloud Photos API adapter into the generic photo types: origin-module and media-kind normalization, the markup and logo filter, and the Autodesk Build deep link.

- Type: preset
- Install: `npx shadcn@latest add @cantera/acc-photos-preset`
- Docs: https://canteraui.vercel.app/components/acc-photos-preset
- Registry item: https://canteraui.vercel.app/r/acc-photos-preset.json
- Registry dependencies: @cantera/photo-types

Files written into the consumer project:

- `lib/acc-photos-preset.ts`

## Usage

Everything ACC-Photos-specific in one data-only item: the adapter from a Photos API media object into a cantera FieldPhoto, the origin-type and media-kind normalizers, the markup and logo filter, and the Autodesk Build deep link. ACC signed URLs expire in about a minute, so the adapter takes a thumbnail resolver — usually a proxy route of yours — instead of copying a URL that will be dead by render time. Fetching and tokens stay in your auth layer.

```tsx
import { fromAccPhoto, isVisibleAccPhoto } from '@/lib/acc-photos-preset'
import type { PhotoPage } from '@/lib/photo-types'

// POST /construction/photos/v1/projects/{projectId}/photos:filter, fetched by you.
const page: PhotoPage = {
  photos: response.results.filter(isVisibleAccPhoto).map((doc) =>
    fromAccPhoto(doc, projectId, {
      thumbnailUrl: (photoId) => `/api/projects/${projectId}/photos/${photoId}/thumbnail`,
    }),
  ),
  nextCursor: response.pagination?.nextPost?.body?.cursorState ?? null,
}
```

## Exports

- `fromAccPhoto` (`(doc: AccPhotoDoc, projectId: string, links: AccPhotoLinks) => FieldPhoto`) — Adapter from a Photos API media object. links.thumbnailUrl resolves each photo id to a URL that stays valid, usually your proxy route, since ACC signed URLs expire in about a minute; links.sourceUrl defaults to the Autodesk Build deep link.
- `isVisibleAccPhoto` (`(doc: AccPhotoDoc) => boolean`) — False for deleted media and for the MARKUP and LOGO origin types, which are project artifacts rather than field photos.
- `toPhotoCategory` (`(type?: string) => PhotoCategory`) — Normalizes the origin type across case and separator variants. A missing type reads as gallery — direct uploads carry none — and an unknown one as other.
- `toPhotoMediaType` (`(mediaType?: string) => PhotoMediaType`) — Normalizes NORMAL, VIDEO, PHOTOSPHERE, and INFRARED; anything else reads as photo.
- `accBuildPhotoUrl` (`(projectId: string, photoId: string) => string`) — Deep link into the Autodesk Build gallery. Not a documented URL shape; verified against ACC Build.
- `AccPhotoDoc / AccPhotoLinks / HIDDEN_ACC_PHOTO_TYPES` (`interface, interface, ReadonlySet<string>`) — The structural subset of a Photos API media object the adapter reads, the link resolvers it takes, and the origin types it hides.
