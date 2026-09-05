# Photo Types (`@cantera/photo-types`)

Generic field-photo types for cantera components: categories, media kinds, the photo record with optional geolocation, and cursor pages. The lingua franca photo adapters translate into.

- Type: types
- Install: `npx shadcn@latest add @cantera/photo-types`
- Docs: https://canteraui.vercel.app/components/photo-types
- Registry item: https://canteraui.vercel.app/r/photo-types.json

Files written into the consumer project:

- `lib/photo-types.ts`

## Usage

The lingua franca for field photos — the record with its origin category, media kind, capture time, optional geolocation, and always-valid thumbnail — plus cursor pages for progressive loading. Components take these shapes as props and never fetch; adapters translate provider payloads into them.

```tsx
import { hasLocation, photoCapturedAt, photoCoverage } from '@/lib/photo-types'
import type { FieldPhoto } from '@/lib/photo-types'

const photos: FieldPhoto[] = await loadPhotos()
const { located, total } = photoCoverage(photos)

const pins = photos.filter(hasLocation).map((photo) => ({
  id: photo.id,
  position: [photo.longitude, photo.latitude],
  at: photoCapturedAt(photo),
}))
```

## Exports

- `FieldPhoto` (`interface`) — One photo: id, nullable title, category, media type, takenAt and createdAt as ISO strings, nullable latitude and longitude, a thumbnailUrl that always resolves, and a nullable sourceUrl deep link.
- `PhotoCategory / PHOTO_CATEGORIES / PHOTO_CATEGORY_LABELS` (`union, tuple, record`) — The origin module a photo was added with — field report, issue, form, RFI, gallery, asset, meeting, submittal, other — with display labels.
- `PhotoMediaType / PHOTO_MEDIA_TYPES` (`union, tuple`) — The capture kind: photo, video, photosphere, infrared.
- `PhotoPage` (`interface`) — One page of a listing: photos plus an opaque nextCursor, null on the last page, for progressive loading over serial cursors.
- `photoCapturedAt` (`(photo: Pick<FieldPhoto, 'takenAt' | 'createdAt'>) => number | null`) — The moment a photo represents as epoch milliseconds: EXIF capture time when known, creation time otherwise, null when neither parses.
- `hasLocation` (`(photo: FieldPhoto) => photo is LocatedPhoto`) — Narrows to photos with both coordinates.
- `photoCoverage` (`(photos: FieldPhoto[]) => PhotoCoverage`) — The located and total counts a surface shows together, so the photos that cannot be placed are never silently dropped.
