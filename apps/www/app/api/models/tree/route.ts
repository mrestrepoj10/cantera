import { TokenError } from 'aec-auth'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

import { getSessionToken, openSession, SESSION_COOKIE } from '@/lib/acc-auth'
import { type HubTreeRequest, loadHubTreeNodes } from '@/lib/aps-tree-workflow'

const requiredParameters = {
  hubs: [],
  projects: ['hubId'],
  'top-folders': ['hubId', 'projectId'],
  'folder-contents': ['projectId', 'folderId'],
  versions: ['projectId', 'itemId'],
} as const

type HubTreeKind = keyof typeof requiredParameters

function treeRequest(searchParams: URLSearchParams): HubTreeRequest | string {
  const kind = searchParams.get('kind')
  if (!kind || !(kind in requiredParameters)) {
    return 'kind must be hubs, projects, top-folders, folder-contents, or versions.'
  }

  const typedKind = kind as HubTreeKind
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
