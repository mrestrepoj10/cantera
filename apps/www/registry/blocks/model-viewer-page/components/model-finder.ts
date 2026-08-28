'use client'

import { useEffect, useMemo, useState } from 'react'

import type { FinderGroup } from '@/components/ui/finder'
import type { HubTreeBranchNode, HubTreeNode } from '@/components/ui/hub-tree'
import type { BrowsePathSegment, Item, ItemVersion } from '@/lib/project-types'

export interface FinderSearchEntry {
  item: Item
  version?: ItemVersion
  path: BrowsePathSegment[]
  caption?: string
}

export interface FinderScopeFolder {
  id: string
  path: BrowsePathSegment[]
}

export interface FinderScope {
  id: string
  label: string
  projectId: string
  folders: FinderScopeFolder[]
}

interface FinderSearchResponse {
  entries?: Array<{ item: Item; version: ItemVersion }>
  error?: string
}

function browsePath(nodes: HubTreeNode[]): BrowsePathSegment[] {
  return nodes.flatMap((node) => {
    if (node.type === 'item' || node.type === 'version') return []
    return [{ id: node.value.id, name: node.name, type: node.type }]
  })
}

function finderScopeFor(
  node: HubTreeBranchNode,
  path: HubTreeNode[],
  children: HubTreeNode[] | undefined,
): FinderScope | undefined {
  const projectIndex = path.findIndex((entry) => entry.type === 'project')
  if (projectIndex < 0) return undefined
  const project = path[projectIndex]
  if (project?.type !== 'project') return undefined
  const projectPath = browsePath(path.slice(0, projectIndex + 1))
  const topNodes = (project.id === node.id ? children : project.children) ?? []
  const folders = topNodes.flatMap((child) =>
    child.type === 'folder'
      ? [
          {
            id: child.value.id,
            path: [
              ...projectPath,
              { id: child.value.id, name: child.name, type: 'folder' as const },
            ],
          },
        ]
      : [],
  )
  return { id: project.id, label: project.name, projectId: project.value.id, folders }
}

function loadedFinderEntries(
  nodes: HubTreeNode[],
  path: BrowsePathSegment[] = [],
  parentItem?: Item,
): FinderSearchEntry[] {
  const entries: FinderSearchEntry[] = []
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

function uniqueFinderEntries(entries: FinderSearchEntry[]): FinderSearchEntry[] {
  const seen = new Set<string>()
  return entries.filter((entry) => {
    if (seen.has(entry.item.id)) return false
    seen.add(entry.item.id)
    return true
  })
}

export interface ModelFinder {
  query: string
  setQuery: (query: string) => void
  scope: FinderScope | undefined
  updateScope: (
    node: HubTreeBranchNode,
    path: HubTreeNode[],
    children: HubTreeNode[] | undefined,
  ) => void
  groups: FinderGroup[]
  placeholder: string
  emptyLabel: string
}

export function useModelFinder({
  nodes,
  treeEndpoint,
}: {
  nodes: HubTreeNode[]
  treeEndpoint: string
}): ModelFinder {
  const [query, setQuery] = useState('')
  const [scope, setScope] = useState<FinderScope>()
  const [remoteKey, setRemoteKey] = useState<string>()
  const [remoteEntries, setRemoteEntries] = useState<FinderSearchEntry[]>([])
  const [remoteStatus, setRemoteStatus] = useState<'ready' | 'loading' | 'error'>('ready')
  const [remoteError, setRemoteError] = useState<string>()

  const loadedMatches = useMemo(() => {
    const term = query.trim().toLocaleLowerCase()
    if (!term) return []
    return loadedFinderEntries(nodes).filter((entry) => {
      const location = entry.path.map((segment) => segment.name).join(' ')
      return `${entry.item.name} ${entry.version?.displayName ?? ''} ${location}`
        .toLocaleLowerCase()
        .includes(term)
    })
  }, [query, nodes])

  const searchKey =
    query.trim().length >= 2 && scope && scope.folders.length > 0
      ? `${scope.id}:${query.trim().toLocaleLowerCase()}`
      : undefined

  useEffect(() => {
    const term = query.trim()
    if (!searchKey || !scope) return

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      setRemoteKey(searchKey)
      setRemoteEntries([])
      setRemoteStatus('loading')
      setRemoteError(undefined)
      void Promise.all(
        scope.folders.map(async (folder) => {
          const params = new URLSearchParams({
            kind: 'search',
            projectId: scope.projectId,
            folderId: folder.id,
            q: term,
          })
          const response = await fetch(`${treeEndpoint}?${params}`, {
            cache: 'no-store',
            signal: controller.signal,
          })
          const body = (await response.json()) as FinderSearchResponse
          if (!response.ok || !body.entries) {
            throw new Error(body.error ?? `Search in ${scope.label} failed.`)
          }
          return body.entries.map((entry) => ({
            ...entry,
            path: folder.path,
            caption: `Inside ${folder.path.at(-1)?.name ?? scope.label}`,
          }))
        }),
      )
        .then((results) => {
          if (controller.signal.aborted) return
          setRemoteEntries(uniqueFinderEntries(results.flat()))
          setRemoteStatus('ready')
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return
          setRemoteEntries([])
          setRemoteStatus('error')
          setRemoteError(
            error instanceof Error ? error.message : `Search in ${scope.label} failed.`,
          )
        })
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, scope, searchKey, treeEndpoint])

  const remoteMatches = useMemo(() => {
    if (!searchKey || remoteKey !== searchKey) return []
    const loadedIds = new Set(loadedMatches.map((entry) => entry.item.id))
    return remoteEntries.filter((entry) => !loadedIds.has(entry.item.id))
  }, [loadedMatches, searchKey, remoteEntries, remoteKey])

  const activeRemoteStatus = searchKey
    ? remoteKey === searchKey
      ? remoteStatus
      : 'loading'
    : 'ready'
  const activeRemoteError = remoteKey === searchKey ? remoteError : undefined

  return {
    query,
    setQuery,
    scope,
    updateScope: (node, path, children) => {
      const next = finderScopeFor(node, path, children)
      if (next) setScope(next)
    },
    groups: [
      { id: 'loaded', label: 'Loaded files', entries: loadedMatches },
      {
        id: 'remote',
        label: scope ? `In ${scope.label}` : 'Project search',
        status: activeRemoteStatus,
        error: activeRemoteError,
        entries: remoteMatches,
      },
    ],
    placeholder: scope ? `Search in ${scope.label}` : 'Find a loaded file',
    emptyLabel: scope
      ? query.trim().length < 2
        ? 'Type at least 2 characters to search unopened folders.'
        : `No files match in ${scope.label}.`
      : 'Expand a project to search its folders.',
  }
}
