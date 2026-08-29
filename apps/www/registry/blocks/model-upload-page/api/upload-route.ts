import { APS_BASE_URL, authHeaders, TokenError } from 'aec-auth'
import { cookies } from 'next/headers'

import { getSessionToken, openSession, SESSION_COOKIE } from '@/lib/acc-auth'
import {
  type ApsFolderDoc,
  type ApsHubDoc,
  type ApsProjectDoc,
  fromApsFolder,
  fromApsHub,
  fromApsProject,
} from '@/lib/aps-data-preset'
import type { Folder, Hub, ModelTranslationStatus, Project } from '@/lib/project-types'

interface JsonApiDocument<T> {
  data?: T
  links?: { next?: unknown }
}

interface TypedDoc {
  type?: string
  id?: string
  attributes?: { displayName?: string; name?: string }
}

interface SignedUploadResponse {
  uploadKey?: string
  urls?: string[]
}

interface ManifestResponse {
  status?: string
  progress?: string
}

type SessionToken = Awaited<ReturnType<typeof getSessionToken>>

export interface UploadStartRequest {
  kind: 'start'
  projectId: string
  folderId: string
  name: string
  size: number
}

export interface UploadFinishRequest {
  kind: 'finish'
  projectId: string
  folderId: string
  name: string
  objectId: string
  uploadKey: string
  /** Model Derivative views to produce — sheets are the 2D views. */
  views: ('2d' | '3d')[]
  /** Revit only: also export the phase-based master views. */
  masterViews?: boolean
  /** Hub region ("US", "EMEA", ...) — derivatives land beside the source. */
  region?: string
}

interface TranslateFormat {
  type: 'svf2'
  views: ('2d' | '3d')[]
  advanced?: { generateMasterViews: boolean }
}

interface TranslateOutput {
  formats: TranslateFormat[]
  destination?: { region: string }
}

class MissingParameterError extends Error {}

const PART_SIZE = 10 * 1024 * 1024
const MAX_PARTS = 25
const MAX_FOLDER_PAGES = 20

function apiBase(origin: string): string {
  const configured = process.env.APS_AUTH_BASE_URL
  if (!configured) return APS_BASE_URL
  return configured.startsWith('/') ? `${origin}${configured}` : configured
}

function segment(value: string): string {
  return encodeURIComponent(value).replaceAll('%3A', ':')
}

function required(params: URLSearchParams, name: string): string {
  const value = params.get(name)
  if (!value) throw new MissingParameterError(`Missing required query parameter: ${name}`)
  return value
}

async function apsFetch<T>(
  url: string,
  token: SessionToken,
  init?: { method?: string; body?: unknown; headers?: Record<string, string> },
): Promise<T> {
  const headers = new Headers({ ...authHeaders(token), Accept: 'application/json' })
  if (init?.body !== undefined) headers.set('Content-Type', 'application/json')
  for (const [name, value] of Object.entries(init?.headers ?? {})) headers.set(name, value)
  const response = await fetch(url, {
    method: init?.method ?? 'GET',
    headers,
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`.trim())
  }
  return (await response.json()) as T
}

/** `urn:adsk.objects:os.object:<bucket>/<key>` — the key may itself contain `/`. */
function parseObjectId(objectId: string) {
  const path = objectId.slice(objectId.lastIndexOf(':') + 1)
  const slash = path.indexOf('/')
  if (slash <= 0) throw new Error(`Unexpected storage object id: ${objectId}`)
  return { bucketKey: path.slice(0, slash), objectKey: path.slice(slash + 1) }
}

function base64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url')
}

/** ACC and BIM 360 project ids are `b.`-prefixed and take the bim360 extension
 * types; everything else takes the core types. */
function extensionTypes(projectId: string) {
  const flavor = projectId.startsWith('b.') ? 'bim360' : 'core'
  return {
    item: `items:autodesk.${flavor}:File`,
    version: `versions:autodesk.${flavor}:File`,
  }
}

async function findItemIdByName(
  base: string,
  token: SessionToken,
  projectId: string,
  folderId: string,
  name: string,
): Promise<string | undefined> {
  for (let page = 0; page < MAX_FOLDER_PAGES; page += 1) {
    const document = await apsFetch<JsonApiDocument<TypedDoc[]>>(
      `${base}/data/v1/projects/${segment(projectId)}/folders/${segment(folderId)}/contents?page[number]=${page}&page[limit]=200`,
      token,
    )
    const match = (document.data ?? []).find(
      (doc) => doc.type === 'items' && doc.attributes?.displayName === name,
    )
    if (match?.id) return match.id
    if (!document.links?.next) return undefined
  }
  return undefined
}

async function startUpload(
  base: string,
  token: SessionToken,
  request: UploadStartRequest,
): Promise<Response> {
  const parts = Math.max(1, Math.ceil(request.size / PART_SIZE))
  if (parts > MAX_PARTS) {
    return Response.json(
      { error: `Files over ${(PART_SIZE * MAX_PARTS) / (1024 * 1024)} MB are not supported.` },
      { status: 413, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const storage = await apsFetch<JsonApiDocument<{ id?: string }>>(
    `${base}/data/v1/projects/${segment(request.projectId)}/storage`,
    token,
    {
      method: 'POST',
      body: {
        jsonapi: { version: '1.0' },
        data: {
          type: 'objects',
          attributes: { name: request.name },
          relationships: {
            target: { data: { type: 'folders', id: request.folderId } },
          },
        },
      },
    },
  )
  const objectId = storage.data?.id
  if (!objectId) throw new Error('The storage object could not be created.')
  const { bucketKey, objectKey } = parseObjectId(objectId)

  const signed = await apsFetch<SignedUploadResponse>(
    `${base}/oss/v2/buckets/${segment(bucketKey)}/objects/${segment(objectKey)}/signeds3upload?parts=${parts}&firstPart=1`,
    token,
  )
  if (!signed.uploadKey || !signed.urls?.length) {
    throw new Error('The signed upload could not be created.')
  }

  return Response.json(
    { objectId, uploadKey: signed.uploadKey, urls: signed.urls, partSize: PART_SIZE },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

async function finishUpload(
  base: string,
  token: SessionToken,
  request: UploadFinishRequest,
): Promise<Response> {
  const { bucketKey, objectKey } = parseObjectId(request.objectId)
  await apsFetch(
    `${base}/oss/v2/buckets/${segment(bucketKey)}/objects/${segment(objectKey)}/signeds3upload`,
    token,
    { method: 'POST', body: { uploadKey: request.uploadKey } },
  )

  const types = extensionTypes(request.projectId)
  const existingItemId = await findItemIdByName(
    base,
    token,
    request.projectId,
    request.folderId,
    request.name,
  )

  let itemId = existingItemId
  let versionId: string | undefined
  if (existingItemId) {
    const version = await apsFetch<JsonApiDocument<{ id?: string }>>(
      `${base}/data/v1/projects/${segment(request.projectId)}/versions`,
      token,
      {
        method: 'POST',
        body: {
          jsonapi: { version: '1.0' },
          data: {
            type: 'versions',
            attributes: { name: request.name, extension: { type: types.version, version: '1.0' } },
            relationships: {
              item: { data: { type: 'items', id: existingItemId } },
              storage: { data: { type: 'objects', id: request.objectId } },
            },
          },
        },
      },
    )
    versionId = version.data?.id
  } else {
    const item = await apsFetch<
      JsonApiDocument<{ id?: string }> & { included?: { id?: string }[] }
    >(`${base}/data/v1/projects/${segment(request.projectId)}/items`, token, {
      method: 'POST',
      body: {
        jsonapi: { version: '1.0' },
        data: {
          type: 'items',
          attributes: {
            displayName: request.name,
            extension: { type: types.item, version: '1.0' },
          },
          relationships: {
            tip: { data: { type: 'versions', id: '1' } },
            parent: { data: { type: 'folders', id: request.folderId } },
          },
        },
        included: [
          {
            type: 'versions',
            id: '1',
            attributes: { name: request.name, extension: { type: types.version, version: '1.0' } },
            relationships: { storage: { data: { type: 'objects', id: request.objectId } } },
          },
        ],
      },
    })
    itemId = item.data?.id
    versionId = item.included?.[0]?.id
  }
  if (!itemId || !versionId) throw new Error('The item version could not be created.')

  // Model Derivative addresses the design by its storage object, not the
  // Data Management version.
  const urn = base64Url(request.objectId)
  const views = request.views.length > 0 ? request.views : ['2d' as const, '3d' as const]
  const format: TranslateFormat = { type: 'svf2', views }
  if (request.masterViews) format.advanced = { generateMasterViews: true }
  const output: TranslateOutput = { formats: [format] }
  if (request.region) output.destination = { region: request.region.toLowerCase() }
  await apsFetch(`${base}/modelderivative/v2/designdata/job`, token, {
    method: 'POST',
    headers: { 'x-ads-force': 'true' },
    body: { input: { urn }, output },
  })

  return Response.json({ itemId, versionId, urn }, { headers: { 'Cache-Control': 'no-store' } })
}

async function translationStatus(
  base: string,
  token: SessionToken,
  urn: string,
): Promise<Response> {
  const response = await fetch(`${base}/modelderivative/v2/designdata/${segment(urn)}/manifest`, {
    headers: { ...authHeaders(token), Accept: 'application/json' },
    cache: 'no-store',
  })
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
    { status, progress: manifest.progress },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

async function browse(
  kind: 'hubs' | 'projects' | 'folders',
  params: URLSearchParams,
  base: string,
  token: SessionToken,
): Promise<Response> {
  if (kind === 'hubs') {
    const document = await apsFetch<JsonApiDocument<ApsHubDoc[]>>(`${base}/project/v1/hubs`, token)
    const hubs: Hub[] = (document.data ?? []).map(fromApsHub)
    return Response.json({ hubs }, { headers: { 'Cache-Control': 'no-store' } })
  }
  if (kind === 'projects') {
    const hubId = required(params, 'hubId')
    const document = await apsFetch<JsonApiDocument<ApsProjectDoc[]>>(
      `${base}/project/v1/hubs/${segment(hubId)}/projects`,
      token,
    )
    const projects: Project[] = (document.data ?? []).map((doc) => {
      const project = fromApsProject(doc)
      return { ...project, hubId: project.hubId ?? hubId }
    })
    return Response.json({ projects }, { headers: { 'Cache-Control': 'no-store' } })
  }

  const projectId = required(params, 'projectId')
  const folderId = params.get('folderId')
  if (folderId) {
    const folders: Folder[] = []
    for (let page = 0; page < MAX_FOLDER_PAGES; page += 1) {
      const document = await apsFetch<JsonApiDocument<(ApsFolderDoc & { type?: string })[]>>(
        `${base}/data/v1/projects/${segment(projectId)}/folders/${segment(folderId)}/contents?page[number]=${page}&page[limit]=200`,
        token,
      )
      folders.push(
        ...(document.data ?? []).filter((doc) => doc.type === 'folders').map(fromApsFolder),
      )
      if (!document.links?.next) break
    }
    return Response.json({ folders }, { headers: { 'Cache-Control': 'no-store' } })
  }
  const hubId = required(params, 'hubId')
  const document = await apsFetch<JsonApiDocument<ApsFolderDoc[]>>(
    `${base}/project/v1/hubs/${segment(hubId)}/projects/${segment(projectId)}/topFolders`,
    token,
  )
  const folders: Folder[] = (document.data ?? []).map(fromApsFolder)
  return Response.json({ folders }, { headers: { 'Cache-Control': 'no-store' } })
}

function errorResponse(error: unknown): Response {
  if (error instanceof MissingParameterError) {
    return Response.json({ error: error.message }, { status: 400 })
  }
  if (
    (error instanceof TokenError &&
      (error.code === 'consent_required' || error.code === 'grant_invalid')) ||
    (error instanceof Error && /\b401\b/.test(error.message))
  ) {
    return Response.json(
      { error: 'Reconnect Autodesk to upload models.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  if (error instanceof Error && /\b403\b/.test(error.message)) {
    return Response.json(
      { error: 'Your Autodesk connection is missing the Manage files access level.' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  console.error('Model upload request failed', error)
  return Response.json(
    { error: 'The Autodesk request failed. Try again.' },
    { status: 502, headers: { 'Cache-Control': 'no-store' } },
  )
}

async function sessionTokenFor(origin: string): Promise<SessionToken | Response> {
  const cookieStore = await cookies()
  const session = await openSession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!session) {
    return Response.json(
      { error: 'Sign in with Autodesk to upload models.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  return getSessionToken(origin, session)
}

/**
 * Session-authenticated upload endpoint: destination browsing, the signed-S3
 * storage dance, item or version creation, and translation tracking.
 *
 * GET  /api/models/upload?kind=hubs
 * GET  /api/models/upload?kind=projects&hubId=...
 * GET  /api/models/upload?kind=folders&hubId=...&projectId=...            (top folders)
 * GET  /api/models/upload?kind=folders&projectId=...&folderId=...        (subfolders)
 * GET  /api/models/upload?kind=status&urn=...
 * POST /api/models/upload  { kind: 'start', projectId, folderId, name, size }
 * POST /api/models/upload  { kind: 'finish', projectId, folderId, name, objectId,
 *                            uploadKey, views, masterViews }
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const kind = url.searchParams.get('kind')
  if (!kind || !['hubs', 'projects', 'folders', 'status'].includes(kind)) {
    return Response.json({ error: 'Unknown upload request.' }, { status: 400 })
  }
  try {
    const token = await sessionTokenFor(url.origin)
    if (token instanceof Response) return token
    const base = apiBase(url.origin)
    if (kind === 'status') {
      return await translationStatus(base, token, required(url.searchParams, 'urn'))
    }
    return await browse(kind as 'hubs' | 'projects' | 'folders', url.searchParams, base, token)
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url)
  let body: UploadStartRequest | UploadFinishRequest
  try {
    body = (await request.json()) as UploadStartRequest | UploadFinishRequest
  } catch {
    return Response.json({ error: 'The request body must be JSON.' }, { status: 400 })
  }
  if (body.kind !== 'start' && body.kind !== 'finish') {
    return Response.json({ error: 'Unknown upload request.' }, { status: 400 })
  }
  if (!body.projectId || !body.folderId || !body.name) {
    return Response.json({ error: 'projectId, folderId, and name are required.' }, { status: 400 })
  }
  try {
    const token = await sessionTokenFor(url.origin)
    if (token instanceof Response) return token
    const base = apiBase(url.origin)
    return body.kind === 'start'
      ? await startUpload(base, token, body)
      : await finishUpload(base, token, body)
  } catch (error) {
    return errorResponse(error)
  }
}
