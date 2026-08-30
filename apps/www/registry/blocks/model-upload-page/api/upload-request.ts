export const PART_SIZE = 10 * 1024 * 1024
export const MAX_PARTS = 25
export const MAX_UPLOAD_BYTES = PART_SIZE * MAX_PARTS

const ISSUED_OBJECT_KEY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}--(.+)$/i

function hasControlCharacters(value: string): boolean {
  for (const character of value) {
    const code = character.codePointAt(0)
    if (code !== undefined && (code <= 31 || code === 127)) return true
  }
  return false
}

export interface UploadStartRequest {
  kind: 'start'
  name: string
  size: number
}

export interface UploadFinishRequest {
  kind: 'finish'
  name: string
  objectKey: string
  objectId: string
  uploadKey: string
  views: ('2d' | '3d')[]
  masterViews?: boolean
  zipEntrypoint?: string
}

export type UploadRequest = UploadStartRequest | UploadFinishRequest

export type UploadRequestResult =
  | { ok: true; value: UploadRequest }
  | { ok: false; error: string; status?: number }

interface UntrustedUploadRequest {
  kind?: unknown
  name?: unknown
  size?: unknown
  objectKey?: unknown
  objectId?: unknown
  uploadKey?: unknown
  views?: unknown
  masterViews?: unknown
  zipEntrypoint?: unknown
}

function objectRecord(value: unknown): UntrustedUploadRequest | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UntrustedUploadRequest)
    : undefined
}

function validFileName(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 255 &&
    value !== '.' &&
    value !== '..' &&
    !value.includes('/') &&
    !value.includes('\\') &&
    !hasControlCharacters(value)
  )
}

function validZipEntrypoint(value: unknown): value is string | undefined {
  if (value === undefined) return true
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 1024 ||
    value.startsWith('/') ||
    value.includes('\\') ||
    hasControlCharacters(value)
  ) {
    return false
  }
  return value.split('/').every((segment) => segment.length > 0 && segment !== '..')
}

export function issuedObjectKey(name: string, id = crypto.randomUUID()): string {
  return `${id}--${name}`
}

export function displayObjectName(objectKey: string): string {
  return ISSUED_OBJECT_KEY.exec(objectKey)?.[1] ?? objectKey
}

export function objectIdFor(bucket: string, objectKey: string): string {
  return `urn:adsk.objects:os.object:${bucket}/${objectKey}`
}

export function isOwnedUrn(urn: string, bucket: string): boolean {
  if (urn.length === 0 || urn.length > 2048) return false
  try {
    const objectId = Buffer.from(urn, 'base64url').toString('utf8')
    return objectId.startsWith(`urn:adsk.objects:os.object:${bucket}/`)
  } catch {
    return false
  }
}

export function parseUploadRequest(value: unknown, bucket: string): UploadRequestResult {
  const body = objectRecord(value)
  if (!body) return { ok: false, error: 'The request body must be a JSON object.' }

  if (body.kind === 'start') {
    if (!validFileName(body.name)) return { ok: false, error: 'name must be a valid file name.' }
    if (!Number.isSafeInteger(body.size) || (body.size as number) <= 0) {
      return { ok: false, error: 'size must be a positive integer.' }
    }
    if ((body.size as number) > MAX_UPLOAD_BYTES) {
      return {
        ok: false,
        error: `Files over ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB are not supported.`,
        status: 413,
      }
    }
    return { ok: true, value: { kind: 'start', name: body.name, size: body.size as number } }
  }

  if (body.kind === 'finish') {
    if (!validFileName(body.name)) return { ok: false, error: 'name must be a valid file name.' }
    if (typeof body.objectKey !== 'string' || displayObjectName(body.objectKey) !== body.name) {
      return { ok: false, error: 'objectKey was not issued for this file.' }
    }
    if (
      typeof body.objectId !== 'string' ||
      body.objectId !== objectIdFor(bucket, body.objectKey)
    ) {
      return { ok: false, error: 'objectId does not belong to this upload bucket.' }
    }
    if (
      typeof body.uploadKey !== 'string' ||
      body.uploadKey.length === 0 ||
      body.uploadKey.length > 2048
    ) {
      return { ok: false, error: 'uploadKey is required.' }
    }
    if (!Array.isArray(body.views) || body.views.length === 0) {
      return { ok: false, error: 'views must contain 2d, 3d, or both.' }
    }
    const views = [...new Set(body.views)]
    if (views.some((view) => view !== '2d' && view !== '3d')) {
      return { ok: false, error: 'views must contain only 2d or 3d.' }
    }
    if (body.masterViews !== undefined && typeof body.masterViews !== 'boolean') {
      return { ok: false, error: 'masterViews must be a boolean.' }
    }
    if (!validZipEntrypoint(body.zipEntrypoint)) {
      return { ok: false, error: 'zipEntrypoint must be a relative path inside the archive.' }
    }
    return {
      ok: true,
      value: {
        kind: 'finish',
        name: body.name,
        objectKey: body.objectKey,
        objectId: body.objectId,
        uploadKey: body.uploadKey,
        views: views as ('2d' | '3d')[],
        masterViews: body.masterViews,
        zipEntrypoint: body.zipEntrypoint,
      },
    }
  }

  return { ok: false, error: 'kind must be start or finish.' }
}
