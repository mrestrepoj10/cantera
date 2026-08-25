'use client'

import { LoaderCircleIcon, LogOutIcon } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { APSViewer } from '@/components/ui/aps-viewer/aps-viewer'
import { Button } from '@/components/ui/button'
import {
  HubTree,
  type HubTreeBranchNode,
  type HubTreeNode,
  type HubTreeVersionNode,
} from '@/components/ui/hub-tree'
import { ModelStatusCard } from '@/components/ui/model-status-card'
import { UserAccountBadge } from '@/components/ui/user-account-badge'
import type { OAuthAccount } from '@/lib/oauth-types'
import type { Item, ItemVersion, ModelTranslation } from '@/lib/project-types'
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
}

interface TreeRequest {
  kind: 'projects' | 'top-folders' | 'folder-contents' | 'versions'
  hubId?: string
  projectId?: string
  folderId?: string
  itemId?: string
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
}: ModelBrowserProps) {
  const [nodes, setNodes] = useState(initialNodes)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string>()
  const [pendingId, setPendingId] = useState<string>()
  const [rootPending, setRootPending] = useState(initialNodes.length === 0)
  const [treeError, setTreeError] = useState<string>()
  const [selection, setSelection] = useState<{ item: Item; version?: ItemVersion }>()
  const [viewerError, setViewerError] = useState<string>()

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

  return (
    <main className="grid h-svh min-h-[32rem] w-full grid-cols-[20rem_minmax(0,1fr)] overflow-hidden bg-background">
      <aside className="z-10 flex min-w-0 flex-col border-r bg-background shadow-sm">
        <header className="flex min-h-16 items-center border-b px-4">
          <div className="min-w-0">
            <h1 className="truncate font-heading font-medium text-lg">Models</h1>
            <p className="truncate text-muted-foreground text-xs">Autodesk project files</p>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {rootPending ? (
            <output className="flex min-h-11 items-center gap-2 px-3 text-muted-foreground text-xs">
              <span aria-hidden className="grid size-3.5 animate-spin place-items-center">
                <LoaderCircleIcon className="size-3.5" />
              </span>
              Loading hubs
            </output>
          ) : (
            <HubTree
              nodes={nodes}
              expandedIds={expandedIds}
              selectedId={selectedId}
              pendingId={pendingId}
              onExpand={expand}
              onCollapse={(node) =>
                setExpandedIds((current) => current.filter((id) => id !== node.id))
              }
              onItemOpen={openItem}
            />
          )}
          {treeError && (
            <p role="alert" className="px-3 py-3 text-status-danger text-xs">
              {treeError}
            </p>
          )}
        </div>
      </aside>

      <section className="relative min-w-0 bg-muted" aria-label="Model viewer">
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

        <div className="absolute top-4 right-4 z-20 flex items-center gap-3 rounded-xl border bg-background/95 p-2 shadow-sm backdrop-blur">
          <UserAccountBadge account={account} size="sm" />
          <form action={signOutHref} method="post">
            <Button
              type="submit"
              variant="ghost"
              className="min-h-11 gap-1.5 px-3"
              aria-label="Sign out of Autodesk"
            >
              <LogOutIcon aria-hidden />
              Sign out
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}

export { ModelBrowser }
