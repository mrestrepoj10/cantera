'use client'

import { useEffect, useMemo, useState } from 'react'

import type { FinderGroup } from '@/components/ui/finder'
import type { HubTreeBranchNode, HubTreeNode } from '@/components/ui/hub-tree'
import {
  type BrowsePathSegment,
  type Item,
  type ItemVersion,
  normalizeSearchText,
} from '@/lib/project-types'

export interface FinderSearchEntry {
  item: Item
  version?: ItemVersion
  path: BrowsePathSegment[]
  caption?: string
}

export interface FinderScopeProject {
  id: string
  name: string
  path: BrowsePathSegment[]
}

export interface FinderScope {
  id: string
  label: string
  hubId: string
  projects: FinderScopeProject[]
}

interface FinderSearchResponse {
  entries?: Array<{ item: Item; version: ItemVersion; folder?: BrowsePathSegment }>
  error?: string
}

const MAX_SEARCH_PROJECTS = 6
const SEARCH_PROJECT_CONCURRENCY = 2

async function settleWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number,
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = Array.from({ length: tasks.length })
  let nextTask = 0
  async function worker(): Promise<void> {
    for (;;) {
      const index = nextTask
      nextTask += 1
      const task = tasks[index]
      if (!task) return
      try {
        results[index] = { status: 'fulfilled', value: await task() }
      } catch (reason) {
        results[index] = { status: 'rejected', reason }
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()))
  return results
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
  const hub = path.find((entry) => entry.type === 'hub')
  if (hub?.type !== 'hub') return undefined
  const hubPath = browsePath([hub])
  const projectNodes = (hub.id === node.id ? children : hub.children) ?? []
  const projects = projectNodes.flatMap((child) =>
    child.type === 'project'
      ? [
          {
            id: child.value.id,
            name: child.name,
            path: [...hubPath, { id: child.value.id, name: child.name, type: 'project' as const }],
          },
        ]
      : [],
  )
  return { id: hub.id, label: hub.name, hubId: hub.value.id, projects }
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

// Matches the server-side search: case-folded and diacritic-stripped, so
// "cana" finds "CAÑA VIVA" in both groups.
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
    const term = normalizeSearchText(query.trim())
    if (!term) return []
    return loadedFinderEntries(nodes).filter((entry) => {
      const location = entry.path.map((segment) => segment.name).join(' ')
      return normalizeSearchText(
        `${entry.item.name} ${entry.version?.displayName ?? ''} ${location}`,
      ).includes(term)
    })
  }, [query, nodes])

  const searchKey =
    query.trim().length >= 2 && scope && scope.projects.length > 0
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
      const projects = scope.projects.slice(0, MAX_SEARCH_PROJECTS)
      const limited = scope.projects.length > projects.length
      void settleWithConcurrency(
        projects.map((project) => async () => {
          const params = new URLSearchParams({
            kind: 'search',
            hubId: scope.hubId,
            projectId: project.id,
            q: term,
          })
          const response = await fetch(`${treeEndpoint}?${params}`, {
            cache: 'no-store',
            signal: controller.signal,
          })
          const body = (await response.json()) as FinderSearchResponse
          if (!response.ok || !body.entries) {
            throw new Error(body.error ?? `Search in ${project.name} failed.`)
          }
          return body.entries.map((entry) => ({
            item: entry.item,
            version: entry.version,
            path: entry.folder ? [...project.path, entry.folder] : project.path,
          }))
        }),
        SEARCH_PROJECT_CONCURRENCY,
      ).then((results) => {
        if (controller.signal.aborted) return
        const found = results.flatMap((result) =>
          result.status === 'fulfilled' ? result.value : [],
        )
        const failures = results.filter((result) => result.status === 'rejected').length
        setRemoteEntries(uniqueFinderEntries(found))
        if (failures === 0 && !limited) {
          setRemoteStatus('ready')
          return
        }
        setRemoteStatus('error')
        setRemoteError(
          failures === results.length
            ? `Search in ${scope.label} failed. Keep typing to retry.`
            : limited && failures === 0
              ? `Search is limited to the first ${MAX_SEARCH_PROJECTS} projects in this hub.`
              : 'Some projects could not be searched. Results may be incomplete.',
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
      // A hub whose projects have not loaded never takes (or clobbers) the scope.
      if (next && next.projects.length > 0) setScope(next)
    },
    groups: [
      { id: 'loaded', label: 'Loaded files', entries: loadedMatches },
      {
        id: 'remote',
        label: scope ? `In ${scope.label}` : 'Hub search',
        status: activeRemoteStatus,
        error: activeRemoteError,
        entries: remoteMatches,
      },
    ],
    placeholder: scope ? `Search in ${scope.label}` : 'Find a loaded file',
    emptyLabel: scope
      ? query.trim().length < 2
        ? 'Type at least 2 characters to search across projects.'
        : `No results for "${query.trim()}" in ${scope.label}. Try a different term.`
      : 'Expand a hub to search its projects.',
  }
}
