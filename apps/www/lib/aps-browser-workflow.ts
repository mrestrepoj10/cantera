import type { AccessToken } from 'aec-auth'
import { apsApiBaseUrl, apsGet, failureMessage, segment } from '@/lib/acc-workflow'
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
import type { BrowsePathSegment, FolderEntry, ItemVersion } from '@/lib/project-types'

interface JsonApiDocument<T> {
  data?: T
  included?: ApsVersionDoc[]
  links?: { next?: { href?: string } }
}

interface TypedFolderDoc extends ApsFolderDoc {
  type: 'folders'
}

interface TypedItemDoc extends ApsItemDoc {
  type: 'items'
}

export interface HubBrowserWorkflowData {
  path: BrowsePathSegment[]
  entries: FolderEntry[]
  status: 'ready' | 'error'
  error?: string
  hasMore: boolean
  page: number
  versions?: {
    itemId: string
    status: 'ready' | 'error'
    versions: ItemVersion[]
  }
}

export interface HubBrowserWorkflowSelection {
  hubId?: string
  projectId?: string
  folderIds?: string[]
  page?: number
  versionsItemId?: string
}

const PAGE_LIMIT = 5

async function loadVersions(
  base: string,
  token: AccessToken,
  projectId: string,
  itemId: string | undefined,
): Promise<HubBrowserWorkflowData['versions']> {
  if (!itemId) return undefined
  try {
    const document = await apsGet<JsonApiDocument<ApsVersionDoc[]>>(
      `${base}/data/v1/projects/${segment(projectId)}/items/${segment(itemId)}/versions?page[limit]=200`,
      token,
    )
    return { itemId, status: 'ready', versions: (document.data ?? []).map(fromApsVersion) }
  } catch {
    return { itemId, status: 'error', versions: [] }
  }
}

/**
 * Server wiring for the live /demo browser. Every response is adapted before
 * crossing the RSC boundary; failures become component state, never throws.
 */
export async function loadHubBrowserWorkflow(
  origin: string,
  token: AccessToken,
  selection: HubBrowserWorkflowSelection,
): Promise<HubBrowserWorkflowData> {
  const base = apsApiBaseUrl(origin)
  const empty = { path: [], entries: [], status: 'ready' as const, hasMore: false, page: 0 }

  if (!selection.hubId) {
    try {
      const document = await apsGet<JsonApiDocument<ApsHubDoc[]>>(`${base}/project/v1/hubs`, token)
      return { ...empty, entries: (document.data ?? []).map(fromApsHub) }
    } catch (error) {
      return { ...empty, status: 'error', error: failureMessage(error, 'Hubs') }
    }
  }

  let hub: ReturnType<typeof fromApsHub>
  try {
    const document = await apsGet<JsonApiDocument<ApsHubDoc>>(
      `${base}/project/v1/hubs/${segment(selection.hubId)}`,
      token,
    )
    if (!document.data) throw new Error('The response did not include a hub.')
    hub = fromApsHub(document.data)
  } catch (error) {
    return { ...empty, status: 'error', error: failureMessage(error, 'Hub') }
  }

  const hubPath: BrowsePathSegment[] = [{ id: hub.id, name: hub.name, type: 'hub' }]
  if (!selection.projectId) {
    try {
      const document = await apsGet<JsonApiDocument<ApsProjectDoc[]>>(
        `${base}/project/v1/hubs/${segment(hub.id)}/projects`,
        token,
      )
      return { ...empty, path: hubPath, entries: (document.data ?? []).map(fromApsProject) }
    } catch (error) {
      return {
        ...empty,
        path: hubPath,
        status: 'error',
        error: failureMessage(error, 'Projects'),
      }
    }
  }

  let project: ReturnType<typeof fromApsProject>
  try {
    const document = await apsGet<JsonApiDocument<ApsProjectDoc>>(
      `${base}/project/v1/hubs/${segment(hub.id)}/projects/${segment(selection.projectId)}`,
      token,
    )
    if (!document.data) throw new Error('The response did not include a project.')
    project = fromApsProject(document.data)
  } catch (error) {
    return {
      ...empty,
      path: hubPath,
      status: 'error',
      error: failureMessage(error, 'Project'),
    }
  }

  const projectPath: BrowsePathSegment[] = [
    ...hubPath,
    { id: project.id, name: project.name, type: 'project' },
  ]
  const folderIds = selection.folderIds ?? []
  if (folderIds.length === 0) {
    try {
      const [document, versions] = await Promise.all([
        apsGet<JsonApiDocument<ApsFolderDoc[]>>(
          `${base}/project/v1/hubs/${segment(hub.id)}/projects/${segment(project.id)}/topFolders`,
          token,
        ),
        loadVersions(base, token, project.id, selection.versionsItemId),
      ])
      return {
        ...empty,
        path: projectPath,
        entries: (document.data ?? []).map(fromApsFolder),
        versions,
      }
    } catch (error) {
      return {
        ...empty,
        path: projectPath,
        status: 'error',
        error: failureMessage(error, 'Top folders'),
      }
    }
  }

  const page = Math.max(0, selection.page ?? 0)
  try {
    const folderDocumentsPromise = Promise.all(
      folderIds.map((folderId) =>
        apsGet<JsonApiDocument<ApsFolderDoc>>(
          `${base}/data/v1/projects/${segment(project.id)}/folders/${segment(folderId)}`,
          token,
        ),
      ),
    )
    const contentDocumentsPromise = Promise.all(
      Array.from({ length: page + 1 }, (_, pageNumber) =>
        apsGet<JsonApiDocument<(TypedFolderDoc | TypedItemDoc)[]>>(
          `${base}/data/v1/projects/${segment(project.id)}/folders/${segment(folderIds.at(-1) ?? '')}/contents?page[number]=${pageNumber}&page[limit]=${PAGE_LIMIT}`,
          token,
        ),
      ),
    )
    const [folderDocuments, contentDocuments, versions] = await Promise.all([
      folderDocumentsPromise,
      contentDocumentsPromise,
      loadVersions(base, token, project.id, selection.versionsItemId),
    ])
    const folders = folderDocuments.map((document) => {
      if (!document.data) throw new Error('A folder response did not include the folder.')
      return fromApsFolder(document.data)
    })
    const tips = new Map(
      contentDocuments.flatMap((document) => document.included ?? []).map((tip) => [tip.id, tip]),
    )
    const resources = contentDocuments.flatMap((document) => document.data ?? [])
    const entries = resources.map((resource) =>
      resource.type === 'folders'
        ? fromApsFolder(resource)
        : fromApsItem(resource, tips.get(resource.relationships?.tip?.data?.id ?? '')),
    )
    const lastPage = contentDocuments.at(-1)
    return {
      path: [
        ...projectPath,
        ...folders.map((folder) => ({ id: folder.id, name: folder.name, type: 'folder' as const })),
      ],
      entries,
      status: 'ready',
      hasMore: Boolean(lastPage?.links?.next?.href),
      page,
      versions,
    }
  } catch (error) {
    return {
      ...empty,
      path: projectPath,
      status: 'error',
      error: failureMessage(error, 'Folder contents'),
    }
  }
}
