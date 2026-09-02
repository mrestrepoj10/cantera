import { APS_BASE_URL, type TokenSource } from 'aec-auth'
import { apsOAuth, memoryVaultStore, vaultTokenSource } from 'aec-auth/vault'

import type { ModelTranslationStatus } from '@/lib/project-types'
import {
  displayObjectName,
  isOwnedUrn,
  issuedObjectKey,
  MAX_PARTS,
  objectIdFor,
  PART_SIZE,
  parseUploadRequest,
  type UploadFinishRequest,
  type UploadStartRequest,
} from './upload-request'

interface OssObject {
  objectKey?: string
  objectId?: string
  size?: number
}

interface SignedUploadResponse {
  uploadKey?: string
  urls?: string[]
}

interface ManifestMessage {
  type?: string
  code?: string
  message?: string | string[]
}

interface ManifestDerivative {
  messages?: ManifestMessage[]
  children?: { messages?: ManifestMessage[] }[]
}

interface ManifestResponse {
  status?: string
  progress?: string
  derivatives?: ManifestDerivative[]
}

interface TranslateFormat {
  type: 'svf2'
  views: ('2d' | '3d')[]
  advanced?: { generateMasterViews: boolean }
}

const UPLOAD_SCOPES = ['bucket:create', 'bucket:read', 'data:read', 'data:create', 'data:write']
const MANIFEST_CONCURRENCY = 6

// Vercel sets VERCEL_PROJECT_PRODUCTION_URL on every deployment, so a one-click
// deploy has a trusted origin before its owner knows the URL.
function deploymentOrigin(): string | undefined {
  if (process.env.APP_ORIGIN) return process.env.APP_ORIGIN
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL
  return vercel ? `https://${vercel}` : undefined
}

function apiBase(origin: string): string {
  const configured = process.env.APS_AUTH_BASE_URL
  if (!configured) return APS_BASE_URL
  if (!configured.startsWith('/')) return configured
  const trusted = deploymentOrigin()
  if (!trusted && process.env.NODE_ENV === 'production') {
    throw new Error('APP_ORIGIN is required with a relative APS_AUTH_BASE_URL in production')
  }
  return `${trusted ? new URL(trusted).origin : origin}${configured}`
}

function segment(value: string): string {
  return encodeURIComponent(value).replaceAll('%3A', ':')
}

/** The app's private bucket — like every OSS bucket key, globally unique per
 * client, so the default derives from the client id. */
function bucketKey(): string {
  const configured = process.env.APS_BUCKET
  if (configured) return configured
  const clientId = process.env.APS_CLIENT_ID ?? ''
  const safe = clientId.toLowerCase().replace(/[^-_.a-z0-9]/g, '')
  return `${safe.slice(0, 100)}-cantera-models`
}

const tokenSources = new Map<string, TokenSource>()

function uploadTokenSource(base: string): TokenSource {
  let source = tokenSources.get(base)
  if (source) return source
  const clientId = process.env.APS_CLIENT_ID
  const clientSecret = process.env.APS_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('APS credentials are not configured')
  source = vaultTokenSource({
    store: memoryVaultStore(),
    providers: {
      aps: apsOAuth({ clientId, clientSecret, baseUrl: base === APS_BASE_URL ? undefined : base }),
    },
  })
  tokenSources.set(base, source)
  return source
}

async function accessToken(base: string): Promise<string> {
  const token = await uploadTokenSource(base).getToken({
    provider: 'aps',
    subject: { type: 'app' },
    scopes: UPLOAD_SCOPES,
  })
  return token.token
}

async function apsRequest(
  base: string,
  path: string,
  init?: { method?: string; body?: unknown; headers?: Record<string, string> },
): Promise<Response> {
  let response: Response | undefined
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const headers = new Headers({
      Authorization: `Bearer ${await accessToken(base)}`,
      Accept: 'application/json',
    })
    if (init?.body !== undefined) headers.set('Content-Type', 'application/json')
    for (const [name, value] of Object.entries(init?.headers ?? {})) headers.set(name, value)
    response = await fetch(`${base}${path}`, {
      method: init?.method ?? 'GET',
      headers,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
    })
    // A recycled provider (the emulator resets between dev restarts)
    // invalidates cached app tokens: mint a fresh one and retry once.
    if (response.status !== 401 || attempt > 0) return response
    tokenSources.delete(base)
  }
  return response as Response
}

async function apsFetch<T>(
  base: string,
  path: string,
  init?: { method?: string; body?: unknown; headers?: Record<string, string> },
): Promise<T> {
  const response = await apsRequest(base, path, init)
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim())
  return (await response.json()) as T
}

async function ensureBucket(base: string): Promise<string> {
  const bucket = bucketKey()
  const response = await apsRequest(base, `/oss/v2/buckets/${segment(bucket)}/details`)
  if (response.ok) return bucket
  if (response.status !== 404) {
    throw new Error(`${response.status} ${response.statusText}`.trim())
  }
  // Two first requests can race here; the loser's 409 still means the bucket exists.
  const created = await apsRequest(base, '/oss/v2/buckets', {
    method: 'POST',
    body: { bucketKey: bucket, policyKey: 'persistent' },
  })
  if (!created.ok && created.status !== 409) {
    throw new Error(`${created.status} ${created.statusText}`.trim())
  }
  return bucket
}

function base64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

async function manifestStatus(base: string, urn: string): Promise<ModelTranslationStatus> {
  const response = await apsRequest(base, `/modelderivative/v2/designdata/${segment(urn)}/manifest`)
  if (!response.ok) return 'pending'
  const manifest = (await response.json()) as ManifestResponse
  const known: ModelTranslationStatus[] = ['pending', 'inprogress', 'success', 'failed', 'timeout']
  return known.find((value) => value === manifest.status) ?? 'pending'
}

async function mapWithConcurrency<T, Result>(
  values: T[],
  concurrency: number,
  transform: (value: T) => Promise<Result>,
): Promise<Result[]> {
  const results: Result[] = Array.from({ length: values.length })
  let nextValue = 0
  async function worker(): Promise<void> {
    for (;;) {
      const index = nextValue
      nextValue += 1
      const value = values[index]
      if (value === undefined) return
      results[index] = await transform(value)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()))
  return results
}

async function listModels(base: string): Promise<Response> {
  const bucket = await ensureBucket(base)
  const listing = await apsFetch<{ items?: OssObject[] }>(
    base,
    `/oss/v2/buckets/${segment(bucket)}/objects?limit=100`,
  )
  const objects = (listing.items ?? []).filter(
    (object): object is OssObject & { objectKey: string; objectId: string } =>
      Boolean(object.objectKey && object.objectId),
  )
  const models = await mapWithConcurrency(objects, MANIFEST_CONCURRENCY, async (object) => {
    const urn = base64Url(object.objectId)
    return {
      name: displayObjectName(object.objectKey),
      urn,
      size: object.size,
      status: await manifestStatus(base, urn),
    }
  })
  return Response.json({ models }, { headers: { 'Cache-Control': 'no-store' } })
}

async function startUpload(base: string, request: UploadStartRequest): Promise<Response> {
  const parts = Math.max(1, Math.ceil(request.size / PART_SIZE))
  if (parts > MAX_PARTS) {
    return Response.json(
      { error: `Files over ${(PART_SIZE * MAX_PARTS) / (1024 * 1024)} MB are not supported.` },
      { status: 413, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  const bucket = await ensureBucket(base)
  const objectKey = issuedObjectKey(request.name)
  const signed = await apsFetch<SignedUploadResponse>(
    base,
    `/oss/v2/buckets/${segment(bucket)}/objects/${segment(objectKey)}/signeds3upload?parts=${parts}&firstPart=1`,
  )
  if (!signed.uploadKey || !signed.urls?.length) {
    throw new Error('The signed upload could not be created.')
  }
  return Response.json(
    {
      objectKey,
      objectId: objectIdFor(bucket, objectKey),
      uploadKey: signed.uploadKey,
      urls: signed.urls,
      partSize: PART_SIZE,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

async function finishUpload(base: string, request: UploadFinishRequest): Promise<Response> {
  const bucket = bucketKey()
  await apsFetch(
    base,
    `/oss/v2/buckets/${segment(bucket)}/objects/${segment(request.objectKey)}/signeds3upload`,
    { method: 'POST', body: { uploadKey: request.uploadKey } },
  )

  const urn = base64Url(request.objectId)
  const format: TranslateFormat = { type: 'svf2', views: request.views }
  if (request.masterViews) format.advanced = { generateMasterViews: true }
  await apsFetch(base, '/modelderivative/v2/designdata/job', {
    method: 'POST',
    headers: { 'x-ads-force': 'true' },
    body: {
      input: {
        urn,
        compressedUrn: Boolean(request.zipEntrypoint),
        rootFilename: request.zipEntrypoint,
      },
      output: { formats: [format] },
    },
  })
  return Response.json({ name: request.name, urn }, { headers: { 'Cache-Control': 'no-store' } })
}

function collectMessages(manifest: ManifestResponse): string[] {
  const lines: string[] = []
  for (const derivative of manifest.derivatives ?? []) {
    const groups = [
      derivative.messages ?? [],
      ...(derivative.children ?? []).map((c) => c.messages ?? []),
    ]
    for (const message of groups.flat()) {
      const text = Array.isArray(message.message) ? message.message.join(' ') : message.message
      if (!text) continue
      const line = message.code ? `${message.code}: ${text}` : text
      if (!lines.includes(line)) lines.push(line)
    }
  }
  return lines
}

async function translationStatus(base: string, urn: string): Promise<Response> {
  const response = await apsRequest(base, `/modelderivative/v2/designdata/${segment(urn)}/manifest`)
  // The manifest appears only once the job is picked up: not-yet is pending.
  if (response.status === 404) {
    return Response.json(
      { status: 'pending' satisfies ModelTranslationStatus },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim())
  const manifest = (await response.json()) as ManifestResponse
  const known: ModelTranslationStatus[] = ['pending', 'inprogress', 'success', 'failed', 'timeout']
  const status = known.find((value) => value === manifest.status) ?? 'pending'
  return Response.json(
    { status, progress: manifest.progress, messages: collectMessages(manifest) },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

function errorResponse(error: unknown): Response {
  if (error instanceof Error && error.message === 'APS credentials are not configured') {
    return Response.json(
      { error: 'APS credentials are not configured.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  console.error('Model upload request failed', error)
  return Response.json(
    { error: 'The Autodesk request failed. Try again.' },
    { status: 502, headers: { 'Cache-Control': 'no-store' } },
  )
}

/**
 * Two-legged upload endpoint over the app's own OSS bucket — no user sign-in.
 * Anyone who can reach these routes can read and write the bucket, so protect
 * the deployment (or this route) with your own access control before shipping.
 *
 * GET  /api/models/upload?kind=models
 * GET  /api/models/upload?kind=status&urn=...
 * POST /api/models/upload  { kind: 'start', name, size }
 * POST /api/models/upload  { kind: 'finish', name, objectId, uploadKey, views,
 *                            masterViews, zipEntrypoint }
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const kind = url.searchParams.get('kind')
  try {
    const base = apiBase(url.origin)
    if (kind === 'models') return await listModels(base)
    if (kind === 'status') {
      const urn = url.searchParams.get('urn')
      if (!urn) return Response.json({ error: 'urn is required.' }, { status: 400 })
      if (!isOwnedUrn(urn, bucketKey())) {
        return Response.json(
          { error: 'urn does not belong to this upload bucket.' },
          { status: 400 },
        )
      }
      return await translationStatus(base, urn)
    }
    return Response.json({ error: 'Unknown upload request.' }, { status: 400 })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url)
  let value: unknown
  try {
    value = await request.json()
  } catch {
    return Response.json({ error: 'The request body must be JSON.' }, { status: 400 })
  }
  const parsed = parseUploadRequest(value, bucketKey())
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: parsed.status ?? 400 })
  }
  try {
    const base = apiBase(url.origin)
    if (parsed.value.kind === 'start') return await startUpload(base, parsed.value)
    return await finishUpload(base, parsed.value)
  } catch (error) {
    return errorResponse(error)
  }
}
