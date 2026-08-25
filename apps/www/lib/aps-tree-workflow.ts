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

async function loadFolderPages(
  firstUrl: string,
  base: string,
  token: AccessToken,
): Promise<JsonApiDocument<(TypedFolderDoc | TypedItemDoc)[]>[]> {
  const pages: JsonApiDocument<(TypedFolderDoc | TypedItemDoc)[]>[] = []
  let url: string | undefined = firstUrl
  for (let page = 0; url && page < MAX_FOLDER_PAGES; page += 1) {
    const document: JsonApiDocument<(TypedFolderDoc | TypedItemDoc)[]> = await apsGet<
      JsonApiDocument<(TypedFolderDoc | TypedItemDoc)[]>
    >(url, token)
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
    const pages = await loadFolderPages(
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
