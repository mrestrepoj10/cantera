import { TokenError } from 'aec-auth'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

import { getSessionToken, openSession, SESSION_COOKIE } from '@/lib/acc-auth'
import {
  type HubTreeRequest,
  loadHubTreeNodes,
  loadItemFolderPath,
  searchHubTreeItems,
  searchHubTreeProject,
} from '@/lib/aps-tree-workflow'

const requiredParameters = {
  hubs: [],
  projects: ['hubId'],
  'top-folders': ['hubId', 'projectId'],
  'folder-contents': ['projectId', 'folderId'],
  versions: ['projectId', 'itemId'],
  search: ['projectId', 'q'],
  path: ['projectId', 'itemId', 'topFolderId'],
} as const

type TreeKind = keyof typeof requiredParameters

type TreeRouteRequest =
  | HubTreeRequest
  | { kind: 'search'; projectId: string; q: string; folderId?: string; hubId?: string }
  | { kind: 'path'; projectId: string; itemId: string; topFolderId: string }

function treeRequest(searchParams: URLSearchParams): TreeRouteRequest | string {
  const kind = searchParams.get('kind')
  if (!kind || !(kind in requiredParameters)) {
    return 'kind must be hubs, projects, top-folders, folder-contents, versions, search, or path.'
  }

  const typedKind = kind as TreeKind
  for (const parameter of requiredParameters[typedKind]) {
    if (!searchParams.get(parameter)) return `${parameter} is required for ${typedKind}.`
  }

  if (typedKind === 'hubs') return { kind: typedKind }
  if (typedKind === 'projects') {
    return { kind: typedKind, hubId: searchParams.get('hubId') as string }
  }
  if (typedKind === 'top-folders') {
    return {
      kind: typedKind,
      hubId: searchParams.get('hubId') as string,
      projectId: searchParams.get('projectId') as string,
    }
  }
  if (typedKind === 'folder-contents') {
    return {
      kind: typedKind,
      projectId: searchParams.get('projectId') as string,
      folderId: searchParams.get('folderId') as string,
    }
  }
  if (typedKind === 'search') {
    const folderId = searchParams.get('folderId')
    const hubId = searchParams.get('hubId')
    if (!folderId && !hubId) return 'folderId or hubId is required for search.'
    return {
      kind: typedKind,
      projectId: searchParams.get('projectId') as string,
      q: searchParams.get('q') as string,
      folderId: folderId ?? undefined,
      hubId: hubId ?? undefined,
    }
  }
  if (typedKind === 'path') {
    return {
      kind: typedKind,
      projectId: searchParams.get('projectId') as string,
      itemId: searchParams.get('itemId') as string,
      topFolderId: searchParams.get('topFolderId') as string,
    }
  }
  return {
    kind: typedKind,
    projectId: searchParams.get('projectId') as string,
    itemId: searchParams.get('itemId') as string,
  }
}

export async function GET(request: NextRequest): Promise<Response> {
  const parsed = treeRequest(request.nextUrl.searchParams)
  if (typeof parsed === 'string') {
    return Response.json({ error: parsed }, { status: 400 })
  }

  const cookieStore = await cookies()
  const session = await openSession(cookieStore.get(SESSION_COOKIE)?.value)
  if (!session) {
    return Response.json(
      { error: 'Sign in with Autodesk to browse models.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  try {
    const token = await getSessionToken(request.nextUrl.origin, session)
    if (parsed.kind === 'search') {
      const entries = parsed.folderId
        ? await searchHubTreeItems(
            request.nextUrl.origin,
            token,
            parsed.projectId,
            parsed.folderId,
            parsed.q,
          )
        : await searchHubTreeProject(
            request.nextUrl.origin,
            token,
            parsed.hubId as string,
            parsed.projectId,
            parsed.q,
          )
      return Response.json({ entries }, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (parsed.kind === 'path') {
      const segments = await loadItemFolderPath(
        request.nextUrl.origin,
        token,
        parsed.projectId,
        parsed.itemId,
        parsed.topFolderId,
      )
      if (!segments) {
        return Response.json(
          { error: 'The item location could not be resolved.' },
          { status: 404, headers: { 'Cache-Control': 'no-store' } },
        )
      }
      return Response.json({ segments }, { headers: { 'Cache-Control': 'no-store' } })
    }
    const nodes = await loadHubTreeNodes(request.nextUrl.origin, token, parsed)
    return Response.json({ nodes }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
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
      { error: 'The model tree could not be loaded. Reconnect and try again.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }
}
