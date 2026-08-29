import type { AccessToken } from 'aec-auth'

import type { HubTreeNode } from '@/components/ui/hub-tree'
import { apsApiBaseUrl, apsGet, segment } from '@/lib/acc-workflow'
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
import type { BrowsePathSegment, Item, ItemVersion } from '@/lib/project-types'

interface JsonApiDocument<T> {
  data?: T
  included?: ApsVersionDoc[]
  links?: { next?: { href?: string } | string }
}

interface TypedFolderDoc extends ApsFolderDoc {
  type: 'folders'
}

interface TypedItemDoc extends ApsItemDoc {
  type: 'items'
}

interface SearchVersionDoc extends ApsVersionDoc {
  relationships?: ApsVersionDoc['relationships'] & {
    item?: { data?: { id?: string } | null }
  }
}

interface ItemParentDoc extends ApsItemDoc {
  relationships?: ApsItemDoc['relationships'] & {
    parent?: { data?: { id?: string } | null }
  }
}

interface FolderParentDoc extends ApsFolderDoc {
  relationships?: {
    parent?: { data?: { id?: string } | null }
  }
}

export interface HubTreeSearchEntry {
  item: Item
  version: ItemVersion
  /** Top folder the match was found under, for path display and reveal. */
  folder?: BrowsePathSegment
}

export type HubTreeRequest =
  | { kind: 'hubs' }
  | { kind: 'projects'; hubId: string }
  | { kind: 'top-folders'; hubId: string; projectId: string }
  | { kind: 'folder-contents'; projectId: string; folderId: string }
  | { kind: 'versions'; projectId: string; itemId: string }

function nodeId(type: HubTreeNode['type'], ...ids: string[]): string {
  return [type, ...ids].join(':')
}

function nextHref(document: JsonApiDocument<unknown>): string | undefined {
  const next = document.links?.next
  return typeof next === 'string' ? next : next?.href
}

function absolutePageUrl(href: string, base: string): string {
  return new URL(href, `${base}/`).toString()
}

const MAX_FOLDER_PAGES = 20
const MAX_PATH_DEPTH = 20
const SEARCH_MIN_QUERY_LENGTH = 2
const MAX_SEARCH_MATCHES = 50

// APS's displayName filters match case- and diacritic-sensitively ("cana"
// misses "CAÑA"), so the recursive listing is filtered here instead.
function searchNormalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLocaleLowerCase()
}

async function loadPages<Doc>(
  firstUrl: string,
  base: string,
  token: AccessToken,
): Promise<JsonApiDocument<Doc[]>[]> {
  const pages: JsonApiDocument<Doc[]>[] = []
  let url: string | undefined = firstUrl
  for (let page = 0; url && page < MAX_FOLDER_PAGES; page += 1) {
    const document: JsonApiDocument<Doc[]> = await apsGet<JsonApiDocument<Doc[]>>(url, token)
    pages.push(document)
    const href = nextHref(document)
    url = href ? absolutePageUrl(href, base) : undefined
  }
  return pages
}

function hubNode(doc: ApsHubDoc): HubTreeNode {
  const value = fromApsHub(doc)
  return {
    id: nodeId('hub', value.id),
    name: value.name,
    type: 'hub',
    value,
    hasChildren: true,
  }
}

function projectNode(doc: ApsProjectDoc, hubId: string): HubTreeNode {
  const value = fromApsProject(doc)
  return {
    id: nodeId('project', hubId, value.id),
    name: value.name,
    type: 'project',
    value: { ...value, hubId: value.hubId ?? hubId },
    hasChildren: true,
  }
}

function folderNode(doc: ApsFolderDoc, projectId: string): HubTreeNode {
  const value = fromApsFolder(doc)
  return {
    id: nodeId('folder', projectId, value.id),
    name: value.name,
    type: 'folder',
    value,
    hasChildren: true,
  }
}

function itemNode(doc: ApsItemDoc, tip: ApsVersionDoc | undefined, projectId: string): HubTreeNode {
  const value = fromApsItem(doc, tip)
  return {
    id: nodeId('item', projectId, value.id),
    name: value.name,
    type: 'item',
    value,
    hasChildren: true,
  }
}

function versionNode(doc: ApsVersionDoc, itemId: string): HubTreeNode {
  const value = fromApsVersion(doc)
  return {
    id: nodeId('version', itemId, value.id),
    name: value.displayName,
    type: 'version',
    value,
    hasChildren: false,
  }
}

export async function loadHubTreeNodes(
  origin: string,
  token: AccessToken,
  request: HubTreeRequest,
): Promise<HubTreeNode[]> {
  const base = apsApiBaseUrl(origin)

  if (request.kind === 'hubs') {
    const document = await apsGet<JsonApiDocument<ApsHubDoc[]>>(`${base}/project/v1/hubs`, token)
    return (document.data ?? []).map(hubNode)
  }

  if (request.kind === 'projects') {
    const document = await apsGet<JsonApiDocument<ApsProjectDoc[]>>(
      `${base}/project/v1/hubs/${segment(request.hubId)}/projects`,
      token,
    )
    return (document.data ?? []).map((doc) => projectNode(doc, request.hubId))
  }

  if (request.kind === 'top-folders') {
    const document = await apsGet<JsonApiDocument<ApsFolderDoc[]>>(
      `${base}/project/v1/hubs/${segment(request.hubId)}/projects/${segment(request.projectId)}/topFolders`,
      token,
    )
    return (document.data ?? []).map((doc) => folderNode(doc, request.projectId))
  }

  if (request.kind === 'folder-contents') {
    const pages = await loadPages<TypedFolderDoc | TypedItemDoc>(
      `${base}/data/v1/projects/${segment(request.projectId)}/folders/${segment(request.folderId)}/contents?page[limit]=200`,
      base,
      token,
    )
    const tips = new Map(
      pages.flatMap((page) => page.included ?? []).map((tip) => [tip.id, tip] as const),
    )
    return pages.flatMap((page) =>
      (page.data ?? []).map((doc) =>
        doc.type === 'folders'
          ? folderNode(doc, request.projectId)
          : itemNode(doc, tips.get(doc.relationships?.tip?.data?.id ?? ''), request.projectId),
      ),
    )
  }

  const document = await apsGet<JsonApiDocument<ApsVersionDoc[]>>(
    `${base}/data/v1/projects/${segment(request.projectId)}/items/${segment(request.itemId)}/versions?page[limit]=200`,
    token,
  )
  return (document.data ?? []).map((doc) => versionNode(doc, request.itemId))
}

export async function searchHubTreeItems(
  origin: string,
  token: AccessToken,
  projectId: string,
  folderId: string,
  query: string,
): Promise<HubTreeSearchEntry[]> {
  if (query.trim().length < SEARCH_MIN_QUERY_LENGTH) return []
  const base = apsApiBaseUrl(origin)
  const needle = searchNormalize(query.trim())
  const entries: HubTreeSearchEntry[] = []
  let url: string | undefined =
    `${base}/data/v1/projects/${segment(projectId)}/folders/${segment(folderId)}/search?page[limit]=200`
  for (
    let page = 0;
    url && page < MAX_FOLDER_PAGES && entries.length < MAX_SEARCH_MATCHES;
    page += 1
  ) {
    const document: JsonApiDocument<SearchVersionDoc[]> = await apsGet(url, token)
    const href = nextHref(document)
    url = href ? absolutePageUrl(href, base) : undefined
    for (const doc of document.data ?? []) {
      if (entries.length >= MAX_SEARCH_MATCHES) break
      const itemId = doc.relationships?.item?.data?.id
      if (!itemId) continue
      const version = fromApsVersion(doc)
      if (!searchNormalize(version.displayName).includes(needle)) continue
      entries.push({
        item: {
          id: itemId,
          name: version.displayName,
          type: 'item' as const,
          tip: version,
          translationStatus: version.derivativeUrn ? ('success' as const) : ('pending' as const),
        },
        version,
      })
    }
  }
  return entries
}

export async function searchHubTreeProject(
  origin: string,
  token: AccessToken,
  hubId: string,
  projectId: string,
  query: string,
): Promise<HubTreeSearchEntry[]> {
  if (query.trim().length < SEARCH_MIN_QUERY_LENGTH) return []
  const base = apsApiBaseUrl(origin)
  const document = await apsGet<JsonApiDocument<ApsFolderDoc[]>>(
    `${base}/project/v1/hubs/${segment(hubId)}/projects/${segment(projectId)}/topFolders`,
    token,
  )
  const folders = (document.data ?? []).map(fromApsFolder)
  const results = await Promise.all(
    folders.map(async (folder) => {
      const entries = await searchHubTreeItems(origin, token, projectId, folder.id, query)
      return entries.map((entry) => ({
        ...entry,
        folder: { id: folder.id, name: folder.name, type: 'folder' as const },
      }))
    }),
  )
  return results.flat()
}

export async function loadItemFolderPath(
  origin: string,
  token: AccessToken,
  projectId: string,
  itemId: string,
  topFolderId: string,
): Promise<BrowsePathSegment[] | undefined> {
  const base = apsApiBaseUrl(origin)
  const itemDocument = await apsGet<JsonApiDocument<ItemParentDoc>>(
    `${base}/data/v1/projects/${segment(projectId)}/items/${segment(itemId)}`,
    token,
  )
  let folderId = itemDocument.data?.relationships?.parent?.data?.id
  const segments: BrowsePathSegment[] = []
  for (let depth = 0; folderId && folderId !== topFolderId && depth < MAX_PATH_DEPTH; depth += 1) {
    const folderDocument = await apsGet<JsonApiDocument<FolderParentDoc>>(
      `${base}/data/v1/projects/${segment(projectId)}/folders/${segment(folderId)}`,
      token,
    )
    if (!folderDocument.data) return undefined
    const folder = fromApsFolder(folderDocument.data)
    segments.unshift({ id: folder.id, name: folder.name, type: 'folder' })
    folderId = folderDocument.data.relationships?.parent?.data?.id
  }
  return folderId === topFolderId ? segments : undefined
}
