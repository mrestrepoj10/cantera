import { cookies, headers } from 'next/headers'

import { getSessionToken, openSession, SESSION_COOKIE } from '@/lib/acc-auth'
import { apsApiBaseUrl, apsGet, segment } from '@/lib/acc-workflow'
import {
  type ApsFolderDoc,
  type ApsHubDoc,
  type ApsItemDoc,
  type ApsProjectDoc,
  type ApsVersionDoc,
  fromApsHub,
  fromApsItem,
  fromApsProject,
} from '@/lib/aps-data-preset'
import type { BrowsePathSegment, Item } from '@/lib/project-types'

// One recursive `folders/{id}/search` per scope root — the unit APS offers;
// there is no cross-hub search.

interface JsonApiDocument<T> {
  data?: T
}

type WithParent = { relationships?: { parent?: { data?: { id?: string } } } }
type FolderDoc = ApsFolderDoc & WithParent & { attributes?: { displayName?: string } }
type ItemDoc = ApsItemDoc & WithParent
type SearchVersionDoc = ApsVersionDoc & {
  relationships?: ApsVersionDoc['relationships'] & { item?: { data?: { id?: string } } }
}

interface SearchDocument {
  data?: SearchVersionDoc[]
  included?: ItemDoc[]
}

export interface DemoSearchEntry {
  item: Item
  path: BrowsePathSegment[]
}

const PAGE_LIMIT = 8
const MAX_DEPTH = 10

async function requestOrigin(): Promise<string> {
  const headerList = await headers()
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  return `${proto}://${host}`
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim() ?? ''
  const hubId = url.searchParams.get('hub')
  const projectId = url.searchParams.get('project')
  const folderId = url.searchParams.get('folder')
  if (!query || !hubId || !projectId) return Response.json({ entries: [] })

  const cookieStore = await cookies()
  const session = await openSession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!session) return Response.json({ entries: [], error: 'Signed out.' }, { status: 401 })

  try {
    const origin = await requestOrigin()
    const token = await getSessionToken(origin, session)
    const base = apsApiBaseUrl(origin)
    const project = segment(projectId)

    const roots = folderId
      ? [folderId]
      : ((
          await apsGet<JsonApiDocument<FolderDoc[]>>(
            `${base}/project/v1/hubs/${segment(hubId)}/projects/${project}/topFolders`,
            token,
          )
        ).data?.map((doc) => doc.id) ?? [])

    const seen = new Set<string>()
    const matches: { item: ItemDoc; tip: SearchVersionDoc }[] = []
    for (const root of roots) {
      if (matches.length >= PAGE_LIMIT) break
      const found = await apsGet<SearchDocument>(
        `${base}/data/v1/projects/${project}/folders/${segment(root)}/search?filter[attributes.displayName]-contains=${encodeURIComponent(query)}&page[limit]=${PAGE_LIMIT}`,
        token,
      )
      const includedItems = new Map((found.included ?? []).map((doc) => [doc.id, doc]))
      for (const doc of found.data ?? []) {
        const itemDoc = includedItems.get(doc.relationships?.item?.data?.id ?? '')
        if (itemDoc && !seen.has(itemDoc.id)) {
          seen.add(itemDoc.id)
          matches.push({ item: itemDoc, tip: doc })
        }
      }
    }

    const [hubDoc, projectDoc] = await Promise.all([
      apsGet<JsonApiDocument<ApsHubDoc>>(`${base}/project/v1/hubs/${segment(hubId)}`, token),
      apsGet<JsonApiDocument<ApsProjectDoc>>(
        `${base}/project/v1/hubs/${segment(hubId)}/projects/${project}`,
        token,
      ),
    ])
    const hub = hubDoc.data ? fromApsHub(hubDoc.data) : { id: hubId, name: hubId }
    const proj = projectDoc.data
      ? fromApsProject(projectDoc.data)
      : { id: projectId, name: projectId }
    const rootSegments: BrowsePathSegment[] = [
      { id: hub.id, name: hub.name, type: 'hub' },
      { id: proj.id, name: proj.name, type: 'project' },
    ]

    const folderCache = new Map<string, Promise<FolderDoc | undefined>>()
    function readFolder(id: string): Promise<FolderDoc | undefined> {
      let cached = folderCache.get(id)
      if (!cached) {
        cached = apsGet<JsonApiDocument<FolderDoc>>(
          `${base}/data/v1/projects/${project}/folders/${segment(id)}`,
          token,
        ).then((doc) => doc.data)
        folderCache.set(id, cached)
      }
      return cached
    }

    async function folderChain(startId: string | undefined): Promise<BrowsePathSegment[]> {
      const chain: BrowsePathSegment[] = []
      let currentId = startId
      for (let depth = 0; currentId && depth < MAX_DEPTH; depth += 1) {
        const doc = await readFolder(currentId)
        if (!doc) break
        chain.unshift({
          id: doc.id,
          name: doc.attributes?.displayName ?? doc.id,
          type: 'folder',
        })
        currentId = doc.relationships?.parent?.data?.id
      }
      return chain
    }

    const entries: DemoSearchEntry[] = await Promise.all(
      matches.slice(0, PAGE_LIMIT).map(async ({ item, tip }) => ({
        item: fromApsItem(item, tip),
        path: [...rootSegments, ...(await folderChain(item.relationships?.parent?.data?.id))],
      })),
    )
    return Response.json({ entries })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed.'
    return Response.json({ entries: [], error: message }, { status: 502 })
  }
}
