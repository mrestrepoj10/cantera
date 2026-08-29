'use client'

import { Building2Icon, LoaderCircleIcon, LogOutIcon, TriangleAlertIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { APSViewer } from '@/components/ui/aps-viewer/aps-viewer'
import { Button } from '@/components/ui/button'
import type { FinderEntry } from '@/components/ui/finder'
import { HubSidebar } from '@/components/ui/hub-sidebar'
import type { HubTreeBranchNode, HubTreeNode, HubTreeVersionNode } from '@/components/ui/hub-tree'
import { ModelStatusCard } from '@/components/ui/model-status-card'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { statusInkClasses, statusToneClasses } from '@/components/ui/token-status'
import { UserAccountBadge } from '@/components/ui/user-account-badge'
import type { OAuthAccount } from '@/lib/oauth-types'
import type { BrowsePathSegment, Item, ItemVersion } from '@/lib/project-types'
import { cn } from '@/lib/utils'
import { AEC_STARTER_EXTENSIONS } from '@/lib/viewer-extension-types'
import type { GetAccessToken } from '@/lib/viewer-types'
import { useModelFinder } from './model-finder'

interface TreeResponse {
  nodes?: HubTreeNode[]
  error?: string
}

export interface ModelBrowserProps {
  account: OAuthAccount
  initialNodes?: HubTreeNode[]
  treeEndpoint?: string
  viewerTokenEndpoint?: string
  signOutHref?: string
  embedded?: boolean
}

interface TreeRequest {
  kind: 'projects' | 'top-folders' | 'folder-contents' | 'versions'
  hubId?: string
  projectId?: string
  folderId?: string
  itemId?: string
}

interface PathResponse {
  segments?: BrowsePathSegment[]
  error?: string
}

interface TreeIssue {
  message: string
  /** The session can no longer reach Autodesk — offer the reconnect action. */
  reconnect: boolean
}

interface ViewerIssue {
  kind: 'unviewable' | 'error'
  detail: string
}

class TreeRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

function treeIssueFor(error: unknown, fallback: string): TreeIssue {
  if (error instanceof TreeRequestError) {
    return { message: error.message, reconnect: error.status === 401 }
  }
  return { message: error instanceof Error ? error.message : fallback, reconnect: false }
}

function viewerIssueFor(error: Error): ViewerIssue {
  // Document.load code 5 is "file not found" and a loaded manifest can still
  // carry no default geometry: both mean the version has nothing viewable,
  // which is an expected state for untranslated formats.
  const unviewable =
    /Document\.load failed \(5\)/.test(error.message) ||
    /\b404\b/.test(error.message) ||
    error.message.includes('document has no viewable geometry')
  return { kind: unviewable ? 'unviewable' : 'error', detail: error.message }
}

function replaceChildren(
  nodes: HubTreeNode[],
  parentId: string,
  children: HubTreeNode[],
): HubTreeNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      if (node.type === 'item') {
        return {
          ...node,
          children: children.filter(
            (child): child is HubTreeVersionNode => child.type === 'version',
          ),
          hasChildren: children.some((child) => child.type === 'version'),
        }
      }
      if (node.type === 'version') return node
      return { ...node, children, hasChildren: children.length > 0 }
    }
    if (node.type === 'item' || node.type === 'version') return node
    if (!node.children?.length) return node
    const next = replaceChildren(node.children, parentId, children)
    return next === node.children ? node : { ...node, children: next }
  })
}

function findPath(nodes: HubTreeNode[], targetId: string): HubTreeNode[] | undefined {
  for (const node of nodes) {
    if (node.id === targetId) return [node]
    const descendants = node.children && findPath(node.children, targetId)
    if (descendants) return [node, ...descendants]
  }
  return undefined
}

function requestFor(node: HubTreeBranchNode, path: HubTreeNode[]): TreeRequest {
  const hub = path.find((entry) => entry.type === 'hub')
  const project = path.find((entry) => entry.type === 'project')
  if (node.type === 'hub') return { kind: 'projects', hubId: node.value.id }
  if (node.type === 'project') {
    return {
      kind: 'top-folders',
      hubId: node.value.hubId ?? (hub?.type === 'hub' ? hub.value.id : undefined),
      projectId: node.value.id,
    }
  }
  if (node.type === 'folder') {
    return {
      kind: 'folder-contents',
      projectId: project?.type === 'project' ? project.value.id : undefined,
      folderId: node.value.id,
    }
  }
  return {
    kind: 'versions',
    projectId: project?.type === 'project' ? project.value.id : undefined,
    itemId: node.value.id,
  }
}

function selectedTreeId(
  nodes: HubTreeNode[],
  item: Item,
  version?: ItemVersion,
): string | undefined {
  for (const node of nodes) {
    if (version && node.type === 'version' && node.value.id === version.id) return node.id
    if (!version && node.type === 'item' && node.value.id === item.id) return node.id
    const nested = node.children && selectedTreeId(node.children, item, version)
    if (nested) return nested
  }
  return undefined
}

function paramsFor(request: TreeRequest): URLSearchParams {
  const params = new URLSearchParams({ kind: request.kind })
  if (request.hubId) params.set('hubId', request.hubId)
  if (request.projectId) params.set('projectId', request.projectId)
  if (request.folderId) params.set('folderId', request.folderId)
  if (request.itemId) params.set('itemId', request.itemId)
  return params
}

function ModelBrowser({
  account,
  initialNodes = [],
  treeEndpoint = '/api/models/tree',
  viewerTokenEndpoint = '/api/viewer-token',
  signOutHref = '/api/auth/signout?next=/sign-in',
  embedded = false,
}: ModelBrowserProps) {
  const [nodes, setNodes] = useState(initialNodes)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string>()
  const [pendingId, setPendingId] = useState<string>()
  const [rootPending, setRootPending] = useState(initialNodes.length === 0)
  const [treeIssue, setTreeIssue] = useState<TreeIssue>()
  const [selection, setSelection] = useState<{ item: Item; version?: ItemVersion }>()
  const [viewerIssue, setViewerIssue] = useState<ViewerIssue>()
  const finder = useModelFinder({ nodes, treeEndpoint })

  // Callers set rootPending before invoking; the first load relies on its
  // initializer so the effect never writes state synchronously.
  const loadRoots = useCallback(
    (signal?: AbortSignal) =>
      fetch(`${treeEndpoint}?kind=hubs`, { cache: 'no-store', signal })
        .then(async (response) => {
          const body = (await response.json()) as TreeResponse
          if (!response.ok || !body.nodes) {
            throw new TreeRequestError(body.error ?? 'Hubs could not be loaded.', response.status)
          }
          setNodes(body.nodes)
          setTreeIssue(undefined)
        })
        .catch((error) => {
          if (!signal?.aborted) setTreeIssue(treeIssueFor(error, 'Hubs could not be loaded.'))
        })
        .finally(() => {
          if (!signal?.aborted) setRootPending(false)
        }),
    [treeEndpoint],
  )

  useEffect(() => {
    if (initialNodes.length > 0) return
    const controller = new AbortController()
    void loadRoots(controller.signal)
    return () => controller.abort()
  }, [initialNodes.length, loadRoots])

  const getAccessToken = useCallback<GetAccessToken>(async () => {
    const response = await fetch(viewerTokenEndpoint, { cache: 'no-store' })
    if (!response.ok) throw new Error('The viewer token is unavailable.')
    return (await response.json()) as Awaited<ReturnType<GetAccessToken>>
  }, [viewerTokenEndpoint])

  async function loadChildren(
    node: HubTreeBranchNode,
    path: HubTreeNode[],
  ): Promise<HubTreeNode[]> {
    const response = await fetch(`${treeEndpoint}?${paramsFor(requestFor(node, path))}`, {
      cache: 'no-store',
    })
    const body = (await response.json()) as TreeResponse
    if (!response.ok || !body.nodes) {
      throw new TreeRequestError(body.error ?? `${node.name} could not be loaded.`, response.status)
    }
    setNodes((current) => replaceChildren(current, node.id, body.nodes ?? []))
    return body.nodes
  }

  async function expand(node: HubTreeBranchNode): Promise<void> {
    const path = findPath(nodes, node.id)
    if (!path) return
    if (node.children !== undefined) {
      finder.updateScope(node, path, node.children)
      setExpandedIds((current) => (current.includes(node.id) ? current : [...current, node.id]))
      return
    }
    finder.updateScope(node, path, undefined)
    setPendingId(node.id)
    setTreeIssue(undefined)
    try {
      const children = await loadChildren(node, path)
      finder.updateScope(node, path, children)
      setExpandedIds((current) => (current.includes(node.id) ? current : [...current, node.id]))
    } catch (error) {
      setTreeIssue(treeIssueFor(error, `${node.name} could not be loaded.`))
    } finally {
      setPendingId(undefined)
    }
  }

  async function revealEntry(entry: FinderEntry): Promise<void> {
    if (!entry.path?.length) return
    let working = nodes
    const expandIds: string[] = []
    let ancestors: HubTreeNode[] = []
    let level: HubTreeNode[] = working
    let segments = [...entry.path]

    try {
      for (let index = 0; index < segments.length; index += 1) {
        const seg = segments[index]
        const node = level.find(
          (candidate) => candidate.type === seg?.type && candidate.value.id === seg.id,
        )
        if (!seg || !node || node.type === 'item' || node.type === 'version') break
        expandIds.push(node.id)
        const children = node.children ?? (await loadChildren(node, [...ancestors, node]))
        working = replaceChildren(working, node.id, children)
        ancestors = [...ancestors, node]
        level = children

        const last = index === segments.length - 1
        const found = children.some(
          (child) => child.type === 'item' && child.value.id === entry.item.id,
        )
        if (last && !found && seg.type === 'folder') {
          const project = segments.find((candidate) => candidate.type === 'project')
          if (!project || segments.length > entry.path.length) break
          const params = new URLSearchParams({
            kind: 'path',
            projectId: project.id,
            itemId: entry.item.id,
            topFolderId: seg.id,
          })
          const response = await fetch(`${treeEndpoint}?${params}`, { cache: 'no-store' })
          const body = (await response.json()) as PathResponse
          if (!response.ok || !body.segments) break
          segments = [...segments, ...body.segments]
        }
      }
    } catch {
      // Best-effort: the entry already opened; reveal as far as the tree loaded.
    }

    const versionRowId = entry.version
      ? selectedTreeId(working, entry.item, entry.version)
      : undefined
    const itemRowId = selectedTreeId(working, entry.item)
    if (versionRowId && itemRowId) expandIds.push(itemRowId)
    setExpandedIds((current) => [...current, ...expandIds.filter((id) => !current.includes(id))])
    setSelectedId(versionRowId ?? itemRowId)
  }

  function openItem(item: Item, version?: ItemVersion): void {
    setSelection({ item, version })
    setSelectedId(selectedTreeId(nodes, item, version))
    setViewerIssue(undefined)
  }

  async function openFinderEntry(entry: FinderEntry): Promise<void> {
    setSelection({ item: entry.item, version: entry.version })
    setViewerIssue(undefined)
    await revealEntry(entry)
  }

  const urn = selection
    ? ((selection.version ? selection.version.derivativeUrn : selection.item.tip?.derivativeUrn) ??
      undefined)
    : undefined

  const selectionLabel = selection
    ? selection.version
      ? `${selection.item.name} · v${selection.version.versionNumber}`
      : selection.item.name
    : undefined

  const reconnectAction = (
    <form action={signOutHref} method="post">
      <Button
        type="submit"
        variant="outline"
        size="sm"
        className="relative after:absolute after:-inset-y-2 after:inset-x-0"
      >
        Reconnect Autodesk
      </Button>
    </form>
  )

  const treeEmpty = rootPending ? (
    <output className="flex min-h-11 items-center justify-center gap-2 px-2 py-6 text-muted-foreground text-xs">
      <LoaderCircleIcon aria-hidden className="size-3.5 animate-spin" />
      Loading hubs
    </output>
  ) : treeIssue ? (
    <div role="alert" className="flex flex-col items-center gap-3 px-3 py-8 text-center">
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-full',
          statusToneClasses.warning,
        )}
      >
        <TriangleAlertIcon aria-hidden className="size-4" />
      </span>
      <p className="text-sm">{treeIssue.message}</p>
      {treeIssue.reconnect ? (
        reconnectAction
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="relative after:absolute after:-inset-y-2 after:inset-x-0"
          onClick={() => {
            setRootPending(true)
            void loadRoots()
          }}
        >
          Retry
        </Button>
      )}
    </div>
  ) : undefined

  const treeAlert =
    nodes.length > 0 && treeIssue ? (
      <div
        role="alert"
        className="flex flex-col gap-2 rounded-lg border border-border p-2.5 text-xs group-data-[collapsible=icon]:hidden"
      >
        <span className="flex items-start gap-1.5">
          <TriangleAlertIcon
            aria-hidden
            className={cn('mt-0.5 size-3.5 shrink-0', statusInkClasses.warning)}
          />
          <span>{treeIssue.message}</span>
        </span>
        {treeIssue.reconnect && reconnectAction}
      </div>
    ) : undefined

  return (
    <SidebarProvider
      className={
        embedded
          ? 'relative h-[36rem] min-h-[36rem] overflow-hidden bg-background'
          : 'h-svh min-h-[32rem] overflow-hidden bg-background'
      }
    >
      <HubSidebar
        finder={{
          query: finder.query,
          onQueryChange: finder.setQuery,
          groups: finder.groups,
          onItemOpen: openFinderEntry,
          onReveal: (entry) => {
            void revealEntry(entry)
          },
          placeholder: finder.placeholder,
          emptyLabel: finder.emptyLabel,
          scope: finder.scope?.label,
        }}
        tree={{
          nodes,
          expandedIds,
          selectedId,
          pendingId,
          empty: treeEmpty,
          onExpand: expand,
          onCollapse: (node) => setExpandedIds((current) => current.filter((id) => id !== node.id)),
          onItemOpen: openItem,
        }}
        header={treeAlert}
        collapsible="icon"
        className={
          embedded ? 'border-border border-r md:absolute md:h-full' : 'border-border border-r'
        }
      />

      <SidebarInset
        className={
          embedded
            ? 'h-full min-h-0 min-w-0 overflow-hidden'
            : 'h-svh min-h-0 min-w-0 overflow-hidden'
        }
      >
        <header className="flex min-h-16 shrink-0 items-center gap-3 border-b bg-background px-2 sm:px-4">
          <SidebarTrigger className="size-11 shrink-0" />
          <span className="hidden size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground sm:grid">
            <Building2Icon aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-heading font-medium text-sm sm:text-base">Model viewer</h1>
            <p className="truncate text-muted-foreground text-xs">
              {selection?.item.name ?? 'Autodesk project models'}
            </p>
          </div>
          <UserAccountBadge account={account} size="sm" className="hidden max-w-52 sm:flex" />
          <form action={signOutHref} method="post" className="shrink-0">
            <Button
              type="submit"
              variant="ghost"
              className="size-11 gap-1.5 px-0 sm:w-auto sm:px-3"
              aria-label="Sign out of Autodesk"
            >
              <LogOutIcon aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </form>
        </header>

        <section className="relative min-h-0 min-w-0 flex-1 bg-muted" aria-label="Model viewer">
          {urn && !viewerIssue ? (
            <APSViewer
              urn={urn}
              getAccessToken={getAccessToken}
              extensions={AEC_STARTER_EXTENSIONS}
              profile="aec"
              toolbar="native"
              radius={0}
              className="size-full"
              onViewerReady={(viewer) => viewer.prefs.set('openPropertiesOnSelect', true)}
              onError={(error) => setViewerIssue(viewerIssueFor(error))}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center overflow-y-auto p-6">
              {selection ? (
                viewerIssue?.kind === 'error' ? (
                  <ModelStatusCard
                    translation={{
                      urn: urn ?? selection.item.id,
                      name: selectionLabel,
                      status: 'failed',
                      error: viewerIssue.detail,
                    }}
                    className="max-w-lg"
                  />
                ) : (
                  <div role="status" className="max-w-sm text-center">
                    <h2 className="font-heading font-medium text-xl">No preview for this file</h2>
                    <p className="mt-2 break-words text-muted-foreground text-sm">
                      Autodesk has not produced a viewable version of “{selectionLabel}”. Choose
                      another file or version.
                    </p>
                    {viewerIssue && (
                      <details className="mt-4 text-left">
                        <summary className="w-fit text-muted-foreground text-xs">
                          Technical details
                        </summary>
                        <p className="mt-1 break-all font-mono text-muted-foreground text-xs">
                          {viewerIssue.detail}
                        </p>
                      </details>
                    )}
                  </div>
                )
              ) : (
                <div className="max-w-sm text-center">
                  <h2 className="font-heading font-medium text-xl">Choose a model</h2>
                  <p className="mt-2 text-muted-foreground text-sm">
                    Expand a hub, project, and folder, then open an item to load its tip version.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </SidebarInset>
    </SidebarProvider>
  )
}

export { ModelBrowser }
