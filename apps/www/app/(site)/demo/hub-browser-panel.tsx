'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { HubBrowser, ROOT_BROWSE_SEGMENT } from '@/components/ui/hub-browser'
import type { HubBrowserWorkflowData } from '@/lib/aps-browser-workflow'
import type { BrowsePathSegment } from '@/lib/project-types'

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

function HubBrowserPanel({ data }: { data: HubBrowserWorkflowData }) {
  const router = useRouter()
  const [navigatingTo, setNavigatingTo] = useState<string>()
  const [requestingVersions, setRequestingVersions] = useState<string>()
  const [opened, setOpened] = useState('Open a file to see the selected tip or version.')
  const [isPending, startTransition] = useTransition()

  function replace(search: URLSearchParams): void {
    const query = search.toString()
    startTransition(() => {
      router.replace(query ? `/demo?${query}` : '/demo', { scroll: false })
      setNavigatingTo(undefined)
      setRequestingVersions(undefined)
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
    const hub = data.path.find((entry) => entry.type === 'hub')
    if (segment.type === 'project') {
      applyBrowserLocation(search, { hubId: hub?.id, projectId: segment.id })
      replace(search)
      return
    }
    const project = data.path.find((entry) => entry.type === 'project')
    const existingFolders = data.path.filter((entry) => entry.type === 'folder')
    const existingIndex = existingFolders.findIndex((entry) => entry.id === segment.id)
    const folderIds =
      existingIndex >= 0
        ? existingFolders.slice(0, existingIndex + 1).map((entry) => entry.id)
        : [...existingFolders.map((entry) => entry.id), segment.id]
    applyBrowserLocation(search, {
      hubId: hub?.id,
      projectId: project?.id,
      folderIds,
    })
    replace(search)
  }

  function requestVersions(itemId: string): void {
    setRequestingVersions(itemId)
    const search = currentSearch()
    search.set('browserVersions', itemId)
    replace(search)
  }

  function loadMore(): void {
    const search = currentSearch()
    search.set('browserPage', String(data.page + 1))
    replace(search)
  }

  const versions =
    isPending && requestingVersions
      ? { itemId: requestingVersions, status: 'loading' as const, versions: [] }
      : data.versions

  return (
    <div className="flex flex-col gap-3">
      <HubBrowser
        path={data.path}
        entries={data.entries}
        status={data.status}
        error={data.error}
        title="Data Management browser"
        titleAs="h3"
        pending={{ navigatingTo: isPending ? navigatingTo : undefined }}
        versions={versions}
        hasMore={data.hasMore}
        onNavigate={navigate}
        onRequestVersions={requestVersions}
        onLoadMore={loadMore}
        onItemOpen={async (item, version) => {
          await new Promise((resolve) => window.setTimeout(resolve, 650))
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
