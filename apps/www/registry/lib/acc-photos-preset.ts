import type { FieldPhoto, PhotoCategory, PhotoMediaType } from '@/lib/photo-types'

// Data translation, not a client — fetching and token handling belong to your
// auth layer. The input interface is the structural subset the adapter reads
// from the ACC Photos API (photos:filter and photos/{id}).

export interface AccPhotoDoc {
  id: string
  title?: string | null
  type?: string
  mediaType?: string
  createdAt: string
  takenAt?: string | null
  deletedAt?: string | null
  latitude?: number | null
  longitude?: number | null
}

/** Origin types hidden by default — markups and logos are project artifacts,
 * not field photos. */
export const HIDDEN_ACC_PHOTO_TYPES: ReadonlySet<string> = new Set(['MARKUP', 'LOGO'])

const CATEGORY_BY_TYPE = new Map<string, PhotoCategory>([
  ['FIELD-REPORT', 'field-report'],
  ['ISSUE', 'issue'],
  ['FORM', 'form'],
  ['RFI', 'rfi'],
  ['GALLERY', 'gallery'],
  ['ASSET', 'asset'],
  ['MEETING', 'meeting'],
  ['SUBMITTAL', 'submittal'],
])

const MEDIA_TYPE_BY_NAME = new Map<string, PhotoMediaType>([
  ['NORMAL', 'photo'],
  ['VIDEO', 'video'],
  ['PHOTOSPHERE', 'photosphere'],
  ['INFRARED', 'infrared'],
])

// Older clients vary case and separator ("Field_Report", "field report").
function normalizedEnum(value: string | undefined): string {
  return (
    value
      ?.trim()
      .toUpperCase()
      .replace(/[\s_]+/g, '-') ?? ''
  )
}

/** ACC omits `type` for media uploaded straight to the gallery, so a missing
 * type reads as "gallery" while an unknown one reads as "other". */
export function toPhotoCategory(type: string | undefined): PhotoCategory {
  const normalized = normalizedEnum(type)
  if (!normalized) return 'gallery'
  return CATEGORY_BY_TYPE.get(normalized) ?? 'other'
}

export function toPhotoMediaType(mediaType: string | undefined): PhotoMediaType {
  return MEDIA_TYPE_BY_NAME.get(normalizedEnum(mediaType)) ?? 'photo'
}

export function isVisibleAccPhoto(doc: AccPhotoDoc): boolean {
  return !doc.deletedAt && !HIDDEN_ACC_PHOTO_TYPES.has(normalizedEnum(doc.type))
}

/** Deep link into the Autodesk Build photo gallery. Not a documented URL
 * shape — verified against ACC Build; degrade to the project gallery if it
 * drifts. */
export function accBuildPhotoUrl(projectId: string, photoId: string): string {
  return `https://acc.autodesk.com/build/photos/projects/${projectId}?photoId=${photoId}`
}

/** Where the photo's bytes are served from. ACC's signed URLs expire in about
 * a minute, so the thumbnail is usually a proxy route of yours, resolved
 * per photo id. */
export interface AccPhotoLinks {
  thumbnailUrl: (photoId: string) => string
  /** Defaults to the Autodesk Build deep link. */
  sourceUrl?: (photoId: string) => string | null
}

export function fromAccPhoto(
  doc: AccPhotoDoc,
  projectId: string,
  links: AccPhotoLinks,
): FieldPhoto {
  return {
    id: doc.id,
    title: doc.title?.trim() || null,
    category: toPhotoCategory(doc.type),
    mediaType: toPhotoMediaType(doc.mediaType),
    takenAt: doc.takenAt ?? null,
    createdAt: doc.createdAt,
    latitude: doc.latitude ?? null,
    longitude: doc.longitude ?? null,
    thumbnailUrl: links.thumbnailUrl(doc.id),
    sourceUrl: links.sourceUrl ? links.sourceUrl(doc.id) : accBuildPhotoUrl(projectId, doc.id),
  }
}
