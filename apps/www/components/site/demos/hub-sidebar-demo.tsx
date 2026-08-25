'use client'

import { BadgeCheckIcon, BellIcon, BuildingIcon, LogOutIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { delay } from '@/components/site/demos/support'
import type { FinderEntry, FinderGroup } from '@/components/ui/finder'
import { HubSidebar } from '@/components/ui/hub-sidebar'
import type { HubTreeNode } from '@/components/ui/hub-tree'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import type { BrowsePathSegment } from '@/lib/project-types'

function nodeId(path: BrowsePathSegment[], index: number): string {
  return path
    .slice(0, index + 1)
    .map((segment) => `${segment.type}:${segment.id}`)
    .join('/')
}

const hubPath: BrowsePathSegment[] = [{ id: 'ridgeline', name: 'Ridgeline Builders', type: 'hub' }]
const projectPath: BrowsePathSegment[] = [
  ...hubPath,
  { id: 'summit', name: 'Summit Tower', type: 'project' },
]
const filesPath: BrowsePathSegment[] = [
  ...projectPath,
  { id: 'files', name: 'Project Files', type: 'folder' },
]
const designPath: BrowsePathSegment[] = [
  ...filesPath,
  { id: 'design', name: 'Design', type: 'folder' },
]

const index: FinderEntry[] = [
  {
    item: {
      id: 'item-summit',
      name: 'Summit Tower Coordination.rvt',
      type: 'item',
      translationStatus: 'success',
    },
    path: designPath,
  },
  {
    item: { id: 'item-frame', name: 'Structural Frame.rvt', type: 'item' },
    path: designPath,
  },
  {
    item: { id: 'item-logistics', name: 'Site Logistics Plan.pdf', type: 'item' },
    path: filesPath,
  },
]

function itemNode(entry: FinderEntry): HubTreeNode {
  return {
    id: `item:${entry.item.id}`,
    name: entry.item.name,
    type: 'item',
    value: entry.item,
    hasChildren: false,
  }
}

const nodes: HubTreeNode[] = [
  {
    id: nodeId(hubPath, 0),
    name: 'Ridgeline Builders',
    type: 'hub',
    value: { id: 'ridgeline', name: 'Ridgeline Builders', region: 'US' },
    hasChildren: true,
    children: [
      {
        id: nodeId(projectPath, 1),
        name: 'Summit Tower',
        type: 'project',
        value: { id: 'summit', name: 'Summit Tower', hubId: 'ridgeline' },
        hasChildren: true,
        children: [
          {
            id: nodeId(filesPath, 2),
            name: 'Project Files',
            type: 'folder',
            value: { id: 'files', name: 'Project Files', type: 'folder' },
            hasChildren: true,
            children: [
              {
                id: nodeId(designPath, 3),
                name: 'Design',
                type: 'folder',
                value: { id: 'design', name: 'Design', type: 'folder' },
                hasChildren: true,
                children: index.filter((entry) => entry.path === designPath).map(itemNode),
              },
              ...index.filter((entry) => entry.path === filesPath).map(itemNode),
            ],
          },
        ],
      },
    ],
  },
]

export function HubSidebarDemo() {
  const [query, setQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<string[]>([nodeId(hubPath, 0)])
  const [selectedId, setSelectedId] = useState<string>()
  const [search, setSearch] = useState<FinderGroup>({
    id: 'project',
    label: 'In Summit Tower',
    entries: [],
  })
  const [message, setMessage] = useState(
    'Press \u2318K or the search box, then reveal a result in the tree.',
  )

  useEffect(() => {
    const term = query.trim().toLowerCase()
    if (!term) {
      setSearch((group) => ({ ...group, status: 'ready', entries: [] }))
      return
    }
    let cancelled = false
    setSearch((group) => ({ ...group, status: 'loading' }))
    delay(500).then(() => {
      if (cancelled) return
      setSearch((group) => ({
        ...group,
        status: 'ready',
        entries: index.filter((entry) => entry.item.name.toLowerCase().includes(term)),
      }))
    })
    return () => {
      cancelled = true
    }
  }, [query])

  function reveal(entry: FinderEntry): void {
    const path = entry.path ?? []
    setExpandedIds(path.map((_, i) => nodeId(path, i)))
    setSelectedId(`item:${entry.item.id}`)
    setMessage(`Revealed ${entry.item.name}.`)
  }

  return (
    <SidebarProvider
      className="min-h-[26rem]! relative w-full overflow-hidden rounded-lg border border-border [&_[data-slot=sidebar-container]]:absolute! [&_[data-slot=sidebar-container]]:h-auto!"
      style={{ '--sidebar-width': '18rem' } as React.CSSProperties}
    >
      <HubSidebar
        user={{
          name: 'Maria Renteria',
          detail: 'Site engineer',
          actions: [
            {
              id: 'account',
              label: 'Account',
              icon: <BadgeCheckIcon />,
              onSelect: () => setMessage('Account settings.'),
            },
            {
              id: 'hubs',
              label: 'Switch hub',
              icon: <BuildingIcon />,
              onSelect: () => setMessage('Switch hub.'),
            },
            {
              id: 'notifications',
              label: 'Notifications',
              icon: <BellIcon />,
              onSelect: () => setMessage('Notification preferences.'),
            },
            {
              id: 'sign-out',
              label: 'Sign out',
              icon: <LogOutIcon />,
              separatorBefore: true,
              destructive: true,
              onSelect: () => setMessage('Signed out.'),
            },
          ],
        }}
        finder={{
          query,
          onQueryChange: setQuery,
          groups: [search],
          onItemOpen: async (entry) => {
            await delay(600)
            reveal(entry)
            setMessage(`Opened ${entry.item.name}.`)
          },
          onReveal: reveal,
        }}
        tree={{
          nodes,
          expandedIds,
          selectedId,
          onExpand: (node) =>
            setExpandedIds((ids) => (ids.includes(node.id) ? ids : [...ids, node.id])),
          onCollapse: (node) => setExpandedIds((ids) => ids.filter((id) => id !== node.id)),
          onItemOpen: (item) => setMessage(`Opened ${item.name} from the tree.`),
        }}
        collapsible="icon"
        className="border-border border-r"
      />
      <SidebarInset className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <p className="font-medium text-sm">Workspace</p>
        <output className="text-muted-foreground text-xs">{message}</output>
      </SidebarInset>
    </SidebarProvider>
  )
}
