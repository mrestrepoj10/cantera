/** The origin module a photo was added with, normalized across providers. */
export const PHOTO_CATEGORIES = [
  'field-report',
  'issue',
  'form',
  'rfi',
  'gallery',
  'asset',
  'meeting',
  'submittal',
  'other',
] as const

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number]

export const PHOTO_CATEGORY_LABELS = {
  'field-report': 'Field report',
  issue: 'Issue',
  form: 'Form',
  rfi: 'RFI',
  gallery: 'Gallery',
  asset: 'Asset',
  meeting: 'Meeting',
  submittal: 'Submittal',
  other: 'Other',
} satisfies Record<PhotoCategory, string>

/** The capture kind, normalized across providers. */
export const PHOTO_MEDIA_TYPES = ['photo', 'video', 'photosphere', 'infrared'] as const

export type PhotoMediaType = (typeof PHOTO_MEDIA_TYPES)[number]

export interface FieldPhoto {
  id: string
  title: string | null
  category: PhotoCategory
  mediaType: PhotoMediaType
  /** ISO datetime the photo was captured (EXIF-derived), when known. */
  takenAt: string | null
  /** ISO datetime the record was created in the system of record. */
  createdAt: string
  /** WGS84 decimal degrees; null when the provider has no geolocation. */
  latitude: number | null
  longitude: number | null
  /** A URL that resolves to a viewable thumbnail whenever it is read — a
   * static asset, or a proxy route that refreshes short-lived signed URLs. */
  thumbnailUrl: string
  /** Deep link into the system of record; null when there is none. */
  sourceUrl: string | null
}

/** One page of a photo listing, shaped for cursor-driven progressive loading. */
export interface PhotoPage {
  photos: FieldPhoto[]
  /** Opaque cursor for the next page; null on the last page. */
  nextCursor: string | null
}

/** The moment a photo represents: EXIF capture time when the device recorded
 * one, the record's creation time otherwise. Null when neither parses, so
 * time-based views can drop the photo rather than date it to the epoch. */
export function photoCapturedAt(photo: Pick<FieldPhoto, 'takenAt' | 'createdAt'>): number | null {
  const taken = photo.takenAt === null ? Number.NaN : Date.parse(photo.takenAt)
  if (Number.isFinite(taken)) return taken
  const created = Date.parse(photo.createdAt)
  return Number.isFinite(created) ? created : null
}

export type LocatedPhoto = FieldPhoto & { latitude: number; longitude: number }

export function hasLocation(photo: FieldPhoto): photo is LocatedPhoto {
  return photo.latitude !== null && photo.longitude !== null
}

export interface PhotoCoverage {
  located: number
  total: number
}

/** How many photos can be placed on a map. Surfaces show both numbers: the
 * honest count is the one that says how many cannot. */
export function photoCoverage(photos: FieldPhoto[]): PhotoCoverage {
  let located = 0
  for (const photo of photos) {
    if (hasLocation(photo)) located += 1
  }
  return { located, total: photos.length }
}
