'use client'

import { useEffect, useState } from 'react'

import { delay } from '@/components/site/demos/support'
import { Finder, type FinderEntry, type FinderGroup } from '@/components/ui/finder'
import type { BrowsePathSegment } from '@/lib/project-types'

const summitPath: BrowsePathSegment[] = [
  { id: 'ridgeline', name: 'Ridgeline Builders', type: 'hub' },
  { id: 'project-summit', name: 'Summit Tower', type: 'project' },
]

function inFolder(...folders: string[]): BrowsePathSegment[] {
  return [
    ...summitPath,
    ...folders.map((name) => ({ id: name.toLowerCase(), name, type: 'folder' as const })),
  ]
}

const projectIndex: FinderEntry[] = [
  {
    item: { id: 'item-summit', name: 'Summit Tower Coordination.rvt', type: 'item' },
    path: inFolder('Project Files', 'Design'),
  },
  {
    item: { id: 'item-struct', name: 'Structural Frame.rvt', type: 'item' },
    path: inFolder('Project Files', 'Design'),
  },
  {
    item: { id: 'item-logistics', name: 'Site Logistics Plan.pdf', type: 'item' },
    path: inFolder('Project Files'),
  },
  {
    item: { id: 'item-report', name: 'Coordination Report.pdf', type: 'item' },
    path: inFolder('Project Files', 'Coordination'),
  },
]

const recents: FinderEntry[] = [
  { item: projectIndex[0]?.item ?? { id: 'r0', name: '', type: 'item' }, caption: 'opened today' },
  {
    item: projectIndex[3]?.item ?? { id: 'r1', name: '', type: 'item' },
    caption: 'opened yesterday',
  },
]

export function FinderDemo() {
  const [query, setQuery] = useState('')
  const [deep, setDeep] = useState<FinderGroup>({
    id: 'project',
    label: 'In Summit Tower',
    entries: [],
  })
  const [message, setMessage] = useState('Type to search, or open a recent file.')

  useEffect(() => {
    const term = query.trim().toLowerCase()
    if (!term) {
      setDeep((group) => ({ ...group, status: 'ready', entries: [] }))
      return
    }
    let cancelled = false
    setDeep((group) => ({ ...group, status: 'loading' }))
    delay(600).then(() => {
      if (cancelled) return
      setDeep((group) => ({
        ...group,
        status: 'ready',
        entries: projectIndex.filter((entry) => entry.item.name.toLowerCase().includes(term)),
      }))
    })
    return () => {
      cancelled = true
    }
  }, [query])

  const groups: FinderGroup[] = [
    ...(query.trim() === '' ? [{ id: 'recents', label: 'Recent', entries: recents }] : []),
    deep,
  ]

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Finder
        query={query}
        onQueryChange={setQuery}
        groups={groups}
        onItemOpen={async (entry) => {
          await delay(700)
          setMessage(`Opened ${entry.item.name}.`)
        }}
        onReveal={(entry) =>
          setMessage(`${entry.item.name} lives in ${entry.path?.map((s) => s.name).join(' › ')}.`)
        }
        className="rounded-lg border border-border"
      />
      <output className="text-muted-foreground text-xs">{message}</output>
    </div>
  )
}
