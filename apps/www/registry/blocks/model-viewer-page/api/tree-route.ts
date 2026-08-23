import { APS_BASE_URL, authHeaders, TokenError } from 'aec-auth'
import { cookies } from 'next/headers'

import type {
  HubTreeFolderNode,
  HubTreeHubNode,
  HubTreeItemNode,
  HubTreeNode,
  HubTreeProjectNode,
  HubTreeVersionNode,
} from '@/components/ui/hub-tree'
import { getSessionToken, openSession, SESSION_COOKIE } from '@/lib/acc-auth'
import {
  type ApsFolderDoc,
  type ApsHubDoc,
  type ApsItemDoc,
  type ApsProjectDoc,
  type ApsVersionDoc,
  fromApsFolder,
  fromApsHub,
  fromApsItem,
  fromApsProject,
  fromApsVersion,
} from '@/lib/aps-data-preset'

interface JsonApiDocument<T> {
  data?: T
  included?: ApsVersionDoc[]
  links?: { next?: unknown }
}

interface TypedFolderDoc extends ApsFolderDoc {
  type: 'folders'
}

interface TypedItemDoc extends ApsItemDoc {
  type: 'items'
}

type TreeKind = 'hubs' | 'projects' | 'top-folders' | 'folder-contents' | 'versions'

class MissingQueryParameterError extends Error {}

const FOLDER_PAGE_LIMIT = 200
const MAX_FOLDER_PAGES = 20

function apiBase(origin: string): string {
  const configured = process.env.APS_AUTH_BASE_URL
  if (!configured) return APS_BASE_URL
  return configured.startsWith('/') ? `${origin}${configured}` : configured
}

function segment(value: string): string {
  return encodeURIComponent(value).replaceAll('%3A', ':')
}

async function apsGet<T>(url: string, token: Awaited<ReturnType<typeof getSessionToken>>) {
  const response = await fetch(url, {
    headers: { ...authHeaders(token), Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim())
  return (await response.json()) as T
}

function required(searchParams: URLSearchParams, name: string): string {
  const value = searchParams.get(name)
  if (!value) throw new MissingQueryParameterError(`Missing required query parameter: ${name}`)
  return value
}

function hubNode(doc: ApsHubDoc): HubTreeHubNode {
  const value = fromApsHub(doc)
  return { id: `hub:${value.id}`, name: value.name, type: 'hub', value, hasChildren: true }
}

function projectNode(doc: ApsProjectDoc, hubId: string): HubTreeProjectNode {
  const adapted = fromApsProject(doc)
  const value = { ...adapted, hubId: adapted.hubId ?? hubId }
  return {
    id: `project:${hubId}:${value.id}`,
    name: value.name,
    type: 'project',
    value,
    hasChildren: true,
  }
}

function folderNode(doc: ApsFolderDoc, projectId: string): HubTreeFolderNode {
  const value = fromApsFolder(doc)
  return {
    id: `folder:${projectId}:${value.id}`,
    name: value.name,
    type: 'folder',
    value,
    hasChildren: true,
  }
}

function itemNode(doc: ApsItemDoc, projectId: string, tip?: ApsVersionDoc): HubTreeItemNode {
  const value = fromApsItem(doc, tip)
  return {
    id: `item:${projectId}:${value.id}`,
    name: value.name,
    type: 'item',
    value,
    hasChildren: true,
  }
}

function versionNode(doc: ApsVersionDoc, projectId: string, itemId: string): HubTreeVersionNode {
  const value = fromApsVersion(doc)
  return {
    id: `version:${projectId}:${itemId}:${value.id}`,
    name: value.displayName,
    type: 'version',
    value,
    hasChildren: false,
  }
}

async function loadFolderContents(
  base: string,
  token: Awaited<ReturnType<typeof getSessionToken>>,
  projectId: string,
  folderId: string,
): Promise<HubTreeNode[]> {
  const documents: JsonApiDocument<(TypedFolderDoc | TypedItemDoc)[]>[] = []
  for (let page = 0; page < MAX_FOLDER_PAGES; page += 1) {
    const document = await apsGet<JsonApiDocument<(TypedFolderDoc | TypedItemDoc)[]>>(
      `${base}/data/v1/projects/${segment(projectId)}/folders/${segment(folderId)}/contents?page[number]=${page}&page[limit]=${FOLDER_PAGE_LIMIT}`,
      token,
    )
    documents.push(document)
    if (!document.links?.next) break
  }

  const tips = new Map(
    documents.flatMap((document) => document.included ?? []).map((tip) => [tip.id, tip]),
  )
  return documents.flatMap((document) =>
    (document.data ?? []).map((resource) =>
      resource.type === 'folders'
        ? folderNode(resource, projectId)
        : itemNode(resource, projectId, tips.get(resource.relationships?.tip?.data?.id ?? '')),
    ),
  )
}

async function loadNodes(
  kind: TreeKind,
  searchParams: URLSearchParams,
  base: string,
  token: Awaited<ReturnType<typeof getSessionToken>>,
): Promise<HubTreeNode[]> {
  if (kind === 'hubs') {
    const document = await apsGet<JsonApiDocument<ApsHubDoc[]>>(`${base}/project/v1/hubs`, token)
    return (document.data ?? []).map(hubNode)
  }

  const hubId = kind === 'projects' || kind === 'top-folders' ? required(searchParams, 'hubId') : ''
  const projectId = kind === 'projects' ? '' : required(searchParams, 'projectId')

  if (kind === 'projects') {
    const document = await apsGet<JsonApiDocument<ApsProjectDoc[]>>(
      `${base}/project/v1/hubs/${segment(hubId)}/projects`,
      token,
    )
    return (document.data ?? []).map((doc) => projectNode(doc, hubId))
  }

  if (kind === 'top-folders') {
    const document = await apsGet<JsonApiDocument<ApsFolderDoc[]>>(
      `${base}/project/v1/hubs/${segment(hubId)}/projects/${segment(projectId)}/topFolders`,
      token,
    )
    return (document.data ?? []).map((doc) => folderNode(doc, projectId))
  }

  if (kind === 'folder-contents') {
    return loadFolderContents(base, token, projectId, required(searchParams, 'folderId'))
  }

  const itemId = required(searchParams, 'itemId')
  const document = await apsGet<JsonApiDocument<ApsVersionDoc[]>>(
    `${base}/data/v1/projects/${segment(projectId)}/items/${segment(itemId)}/versions?page[limit]=200`,
    token,
  )
  return (document.data ?? []).map((doc) => versionNode(doc, projectId, itemId))
}

/**
 * Lazy, session-authenticated Data Management tree endpoint.
 *
 * GET /api/models/tree?kind=hubs
 * GET /api/models/tree?kind=projects&hubId=...
 * GET /api/models/tree?kind=top-folders&hubId=...&projectId=...
 * GET /api/models/tree?kind=folder-contents&projectId=...&folderId=...
 * GET /api/models/tree?kind=versions&projectId=...&itemId=...
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const kind = url.searchParams.get('kind') as TreeKind | null
  if (!kind || !['hubs', 'projects', 'top-folders', 'folder-contents', 'versions'].includes(kind)) {
    return Response.json({ error: 'Unknown tree request.' }, { status: 400 })
  }

  try {
    const cookieStore = await cookies()
    const session = await openSession(cookieStore.get(SESSION_COOKIE)?.value)
    if (!session) {
      return Response.json({ error: 'Sign in with Autodesk to browse models.' }, { status: 401 })
    }
    const token = await getSessionToken(url.origin, session)
    const nodes = await loadNodes(kind, url.searchParams, apiBase(url.origin), token)
    return Response.json({ nodes }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof MissingQueryParameterError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    if (
      error instanceof TokenError &&
      (error.code === 'consent_required' || error.code === 'grant_invalid')
    ) {
      return Response.json(
        { error: 'Reconnect Autodesk to browse models.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } },
      )
    }
    console.error('Model tree request failed', error)
    return Response.json(
      { error: 'The Autodesk project tree could not be loaded.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
