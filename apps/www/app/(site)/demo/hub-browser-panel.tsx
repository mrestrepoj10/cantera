'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'

import {
  FinderDialog,
  type FinderEntry,
  type FinderGroup,
  FinderTrigger,
} from '@/components/ui/finder'
import { HubBrowser, ROOT_BROWSE_SEGMENT } from '@/components/ui/hub-browser'
import type { HubBrowserWorkflowData } from '@/lib/aps-browser-workflow'
import type { BrowsePathSegment } from '@/lib/project-types'

import { recentFinderEntries, useRecentOpens } from './finder'
import type { DemoSearchEntry } from './search/route'

function currentSearch(): URLSearchParams {
  return new URLSearchParams(window.location.search)
}

function applyBrowserLocation(
  search: URLSearchParams,
  location: { hubId?: string; projectId?: string; folderIds?: string[]; page?: number },
): void {
  for (const key of [
    'browserHub',
    'browserProject',
    'browserFolders',
    'browserPage',
    'browserVersions',
  ]) {
    search.delete(key)
  }
  if (location.hubId) search.set('browserHub', location.hubId)
  if (location.projectId) search.set('browserProject', location.projectId)
  if (location.folderIds?.length) search.set('browserFolders', location.folderIds.join('|'))
  if (location.page) search.set('browserPage', String(location.page))
}

const DEEP_GROUP_EMPTY: FinderGroup = { id: 'project', label: 'In this project', entries: [] }

function HubBrowserPanel({ data }: { data: HubBrowserWorkflowData }) {
  const router = useRouter()
  const [navigatingTo, setNavigatingTo] = useState<string>()
  const [requestingVersions, setRequestingVersions] = useState<string>()
  const [loadingMore, setLoadingMore] = useState(false)
  const [opened, setOpened] = useState('Open a file to see the selected tip or version.')
  const [query, setQuery] = useState('')
  const [finderOpen, setFinderOpen] = useState(false)
  const [deep, setDeep] = useState<FinderGroup>(DEEP_GROUP_EMPTY)
  const { recents, remember } = useRecentOpens()
  const [isPending, startTransition] = useTransition()

  const hub = data.path.find((entry) => entry.type === 'hub')
  const project = data.path.find((entry) => entry.type === 'project')
  const currentFolder = data.path.filter((entry) => entry.type === 'folder').at(-1)
  const scopeName = currentFolder?.name ?? project?.name

  // The deep group is the finder's async half: one recursive search per scope
  // root against the emulator's folders/{id}/search, debounced, stale entries
  // kept visible while the next query is in flight.
  useEffect(() => {
    const term = query.trim()
    if (!term || !hub?.id || !project?.id) {
      setDeep((group) => ({ ...group, status: 'ready', error: undefined, entries: [] }))
      return
    }
    let cancelled = false
    setDeep((group) => ({ ...group, status: 'loading', error: undefined }))
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: term, hub: hub.id, project: project.id })
        if (currentFolder) params.set('folder', currentFolder.id)
        const response = await fetch(`/demo/search?${params}`)
        const body = (await response.json()) as { entries: DemoSearchEntry[]; error?: string }
        if (cancelled) return
        if (!response.ok) {
          setDeep((group) => ({ ...group, status: 'error', error: body.error }))
          return
        }
        setDeep((group) => ({ ...group, status: 'ready', error: undefined, entries: body.entries }))
      } catch {
        if (!cancelled) {
          setDeep((group) => ({ ...group, status: 'error', error: undefined }))
        }
      }
    }, 300)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, hub?.id, project?.id, currentFolder])

  function replace(search: URLSearchParams): void {
    const queryString = search.toString()
    startTransition(() => {
      router.replace(queryString ? `/demo?${queryString}` : '/demo', { scroll: false })
      setNavigatingTo(undefined)
      setRequestingVersions(undefined)
      setLoadingMore(false)
    })
  }

  function navigate(segment: BrowsePathSegment): void {
    setNavigatingTo(segment.id)
    const search = currentSearch()
    if (segment.id === ROOT_BROWSE_SEGMENT.id) {
      applyBrowserLocation(search, {})
      replace(search)
      return
    }
    if (segment.type === 'hub') {
      applyBrowserLocation(search, { hubId: segment.id })
      replace(search)
      return
    }
    if (segment.type === 'project') {
      applyBrowserLocation(search, { hubId: hub?.id, projectId: segment.id })
      replace(search)
      return
    }
    const existingFolders = data.path.filter((entry) => entry.type === 'folder')
    const existingIndex = existingFolders.findIndex((entry) => entry.id === segment.id)
    const folderIds =
      existingIndex >= 0
        ? existingFolders.slice(0, existingIndex + 1).map((entry) => entry.id)
        : [...existingFolders.map((entry) => entry.id), segment.id]
    applyBrowserLocation(search, { hubId: hub?.id, projectId: project?.id, folderIds })
    replace(search)
  }

  /** Finding teaches location: unfold the browser to the entry's folder. */
  function reveal(entry: FinderEntry): void {
    const path = entry.path ?? []
    const search = currentSearch()
    applyBrowserLocation(search, {
      hubId: path.find((segment) => segment.type === 'hub')?.id,
      projectId: path.find((segment) => segment.type === 'project')?.id,
      folderIds: path.filter((segment) => segment.type === 'folder').map((segment) => segment.id),
    })
    replace(search)
    setQuery('')
    setOpened(`Revealed ${entry.item.name} in ${path.map((segment) => segment.name).join(' › ')}.`)
  }

  function requestVersions(itemId: string): void {
    setRequestingVersions(itemId)
    const search = currentSearch()
    search.set('browserVersions', itemId)
    replace(search)
  }

  function loadMore(): void {
    // A transition returns void, so the browser cannot infer the pending
    // state from a promise: the flag is driven through the pending prop.
    setLoadingMore(true)
    const search = currentSearch()
    search.set('browserPage', String(data.page + 1))
    replace(search)
  }

  const versions =
    isPending && requestingVersions
      ? { itemId: requestingVersions, status: 'loading' as const, versions: [] }
      : data.versions

  const term = query.trim().toLowerCase()
  const levelEntries: FinderEntry[] = term
    ? data.entries.flatMap((entry) =>
        entry.type === 'item' && entry.name.toLowerCase().includes(term) ? [{ item: entry }] : [],
      )
    : []

  const groups: FinderGroup[] = term
    ? [
        { id: 'level', label: `At this level`, entries: levelEntries },
        { ...deep, label: scopeName ? `In ${scopeName}` : 'In this project' },
      ]
    : [{ id: 'recents', label: 'Recent', entries: recentFinderEntries(recents) }]

  return (
    <div className="flex flex-col gap-3">
      <FinderTrigger
        placeholder={project ? 'Search this project' : 'Search after opening a project'}
        onClick={() => setFinderOpen(true)}
      />
      <FinderDialog
        open={finderOpen}
        onOpenChange={(open) => {
          setFinderOpen(open)
          if (!open) setQuery('')
        }}
        query={query}
        onQueryChange={setQuery}
        groups={groups}
        placeholder={project ? 'Search this project' : 'Search after opening a project'}
        label="Search project files"
        onItemOpen={async (entry) => {
          await new Promise((resolve) => window.setTimeout(resolve, 400))
          remember({ item: entry.item, path: entry.path ?? data.path, openedAt: Date.now() })
          setOpened(`${entry.item.name} — opened from the finder.`)
        }}
        onReveal={reveal}
      />
      <HubBrowser
        path={data.path}
        entries={data.entries}
        status={data.status}
        error={data.error}
        title="Data Management browser"
        titleAs="h3"
        pending={{
          navigatingTo: isPending ? navigatingTo : undefined,
          loadingMore: isPending && loadingMore,
        }}
        versions={versions}
        hasMore={data.hasMore}
        onNavigate={navigate}
        onRequestVersions={requestVersions}
        onLoadMore={loadMore}
        onItemOpen={async (item, version) => {
          await new Promise((resolve) => window.setTimeout(resolve, 650))
          remember({ item, path: data.path, openedAt: Date.now() })
          setOpened(
            `${item.name} — ${version ? `version ${version.versionNumber}` : `tip v${item.tip?.versionNumber ?? '—'}`}${(version ?? item.tip)?.derivativeUrn ? ' — ready for Viewer' : ' — not translated'}`,
          )
        }}
      />
      <output className="text-muted-foreground text-xs">{opened}</output>
    </div>
  )
}

export { HubBrowserPanel }
