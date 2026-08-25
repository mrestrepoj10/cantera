'use client'

import { Building2Icon, LoaderCircleIcon, LogOutIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { APSViewer } from '@/components/ui/aps-viewer/aps-viewer'
import { Button } from '@/components/ui/button'
import { HubSidebar } from '@/components/ui/hub-sidebar'
import type { HubTreeBranchNode, HubTreeNode, HubTreeVersionNode } from '@/components/ui/hub-tree'
import { ModelStatusCard } from '@/components/ui/model-status-card'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { UserAccountBadge } from '@/components/ui/user-account-badge'
import type { OAuthAccount } from '@/lib/oauth-types'
import type { BrowsePathSegment, Item, ItemVersion, ModelTranslation } from '@/lib/project-types'
import { AEC_STARTER_EXTENSIONS } from '@/lib/viewer-extension-types'
import type { GetAccessToken } from '@/lib/viewer-types'

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

interface LoadedFinderEntry {
  item: Item
  version?: ItemVersion
  path: BrowsePathSegment[]
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

function loadedFinderEntries(
  nodes: HubTreeNode[],
  path: BrowsePathSegment[] = [],
  parentItem?: Item,
): LoadedFinderEntry[] {
  const entries: LoadedFinderEntry[] = []
  for (const node of nodes) {
    if (node.type === 'version') {
      if (parentItem) entries.push({ item: parentItem, version: node.value, path })
      continue
    }
    if (node.type === 'item') {
      entries.push({ item: node.value, path })
      if (node.children?.length) {
        entries.push(...loadedFinderEntries(node.children, path, node.value))
      }
      continue
    }
    const nextPath = [...path, { id: node.value.id, name: node.name, type: node.type }]
    if (node.children?.length) entries.push(...loadedFinderEntries(node.children, nextPath))
  }
  return entries
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
  const [treeError, setTreeError] = useState<string>()
  const [selection, setSelection] = useState<{ item: Item; version?: ItemVersion }>()
  const [viewerError, setViewerError] = useState<string>()
  const [finderQuery, setFinderQuery] = useState('')

  useEffect(() => {
    if (initialNodes.length > 0) return
    const controller = new AbortController()
    // rootPending initializes true when there are no initialNodes, so the
    // effect does not need to set it before this first fetch.
    fetch(`${treeEndpoint}?kind=hubs`, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as TreeResponse
        if (!response.ok || !body.nodes) throw new Error(body.error ?? 'Hubs could not be loaded.')
        setNodes(body.nodes)
        setTreeError(undefined)
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setTreeError(error instanceof Error ? error.message : 'Hubs could not be loaded.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setRootPending(false)
      })
    return () => controller.abort()
  }, [initialNodes.length, treeEndpoint])

  const getAccessToken = useCallback<GetAccessToken>(async () => {
    const response = await fetch(viewerTokenEndpoint, { cache: 'no-store' })
    if (!response.ok) throw new Error('The viewer token is unavailable.')
    return (await response.json()) as Awaited<ReturnType<GetAccessToken>>
  }, [viewerTokenEndpoint])

  async function expand(node: HubTreeBranchNode): Promise<void> {
    if (node.children !== undefined) {
      setExpandedIds((current) => (current.includes(node.id) ? current : [...current, node.id]))
      return
    }
    const path = findPath(nodes, node.id)
    if (!path) return
    setPendingId(node.id)
    setTreeError(undefined)
    try {
      const response = await fetch(`${treeEndpoint}?${paramsFor(requestFor(node, path))}`, {
        cache: 'no-store',
      })
      const body = (await response.json()) as TreeResponse
      if (!response.ok || !body.nodes) {
        throw new Error(body.error ?? `${node.name} could not be loaded.`)
      }
      setNodes((current) => replaceChildren(current, node.id, body.nodes ?? []))
      setExpandedIds((current) => (current.includes(node.id) ? current : [...current, node.id]))
    } catch (error) {
      setTreeError(error instanceof Error ? error.message : `${node.name} could not be loaded.`)
    } finally {
      setPendingId(undefined)
    }
  }

  function openItem(item: Item, version?: ItemVersion): void {
    setSelection({ item, version })
    setSelectedId(selectedTreeId(nodes, item, version))
    setViewerError(undefined)
  }

  const translation = useMemo<ModelTranslation | undefined>(() => {
    if (!selection) return undefined
    const version = selection.version ?? selection.item.tip
    const urn = version?.derivativeUrn
    if (urn && !viewerError) {
      return {
        urn,
        name: selection.item.name,
        status: 'success',
        outputs: ['svf2'],
      }
    }
    return {
      urn: urn ?? selection.item.id,
      name: selection.item.name,
      status: viewerError ? 'failed' : 'pending',
      error:
        viewerError ??
        'This item version has no translated geometry. Choose another item or version.',
    }
  }, [selection, viewerError])

  const urn = selection
    ? ((selection.version ? selection.version.derivativeUrn : selection.item.tip?.derivativeUrn) ??
      undefined)
    : undefined

  const finderEntries = useMemo(() => {
    const query = finderQuery.trim().toLocaleLowerCase()
    if (!query) return []
    return loadedFinderEntries(nodes).filter((entry) => {
      const location = entry.path.map((segment) => segment.name).join(' ')
      return `${entry.item.name} ${entry.version?.displayName ?? ''} ${location}`
        .toLocaleLowerCase()
        .includes(query)
    })
  }, [finderQuery, nodes])

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
          query: finderQuery,
          onQueryChange: setFinderQuery,
          groups: [{ id: 'loaded', label: 'Loaded project files', entries: finderEntries }],
          onItemOpen: ({ item, version }) => openItem(item, version),
          placeholder: 'Find a loaded file',
          emptyLabel: 'No loaded files match.',
        }}
        tree={{
          nodes,
          expandedIds,
          selectedId,
          pendingId,
          onExpand: expand,
          onCollapse: (node) => setExpandedIds((current) => current.filter((id) => id !== node.id)),
          onItemOpen: openItem,
        }}
        footer={
          rootPending ? (
            <output className="flex min-h-11 items-center gap-2 px-2 text-muted-foreground text-xs">
              <LoaderCircleIcon aria-hidden className="size-3.5 animate-spin" />
              <span className="group-data-[collapsible=icon]:hidden">Loading hubs</span>
            </output>
          ) : treeError ? (
            <p role="alert" className="px-2 py-2 text-status-danger text-xs">
              {treeError}
            </p>
          ) : null
        }
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
          {urn && !viewerError ? (
            <APSViewer
              urn={urn}
              getAccessToken={getAccessToken}
              extensions={AEC_STARTER_EXTENSIONS}
              profile="aec"
              toolbar="native"
              radius={0}
              className="size-full"
              onViewerReady={(viewer) => viewer.prefs.set('openPropertiesOnSelect', true)}
              onError={(error) => setViewerError(error.message)}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center p-6">
              {translation ? (
                <ModelStatusCard translation={translation} className="max-w-lg" />
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
