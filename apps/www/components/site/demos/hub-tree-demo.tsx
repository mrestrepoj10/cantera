'use client'

import { useState } from 'react'

import {
  HubTree,
  type HubTreeItemNode,
  type HubTreeNode,
  type HubTreeVersionNode,
} from '@/components/ui/hub-tree'
import type { Item, ItemVersion } from '@/lib/project-types'

const modelVersions: HubTreeVersionNode[] = [
  {
    id: 'version:item-summit:v7',
    name: 'Summit Tower Coordination.rvt',
    type: 'version',
    value: {
      id: 'version-summit-7',
      versionNumber: 7,
      displayName: 'Summit Tower Coordination.rvt',
      createTime: '2026-08-21T13:10:00.000Z',
      createdBy: 'Luis Romero',
      storageSize: 184_200_000,
      derivativeUrn: 'sample-viewable-urn',
    },
    hasChildren: false,
  },
  {
    id: 'version:item-summit:v6',
    name: 'Summit Tower Coordination.rvt',
    type: 'version',
    value: {
      id: 'version-summit-6',
      versionNumber: 6,
      displayName: 'Summit Tower Coordination.rvt',
      createTime: '2026-08-18T16:40:00.000Z',
      createdBy: 'Luis Romero',
      storageSize: 181_900_000,
      derivativeUrn: null,
    },
    hasChildren: false,
  },
]

const modelItem: HubTreeItemNode = {
  id: 'item:project-summit:item-summit',
  name: 'Summit Tower Coordination.rvt',
  type: 'item',
  value: {
    id: 'item-summit',
    name: 'Summit Tower Coordination.rvt',
    type: 'item',
    tip: modelVersions[0]?.value,
    translationStatus: 'success',
  },
  hasChildren: true,
}

const childNodes: Record<string, HubTreeNode[]> = {
  'hub:ridgeline': [
    {
      id: 'project:ridgeline:project-summit',
      name: 'Summit Tower',
      type: 'project',
      value: { id: 'project-summit', name: 'Summit Tower', hubId: 'ridgeline' },
      hasChildren: true,
    },
    {
      id: 'project:ridgeline:project-cedar',
      name: 'Cedar Mill Campus',
      type: 'project',
      value: { id: 'project-cedar', name: 'Cedar Mill Campus', hubId: 'ridgeline' },
      hasChildren: true,
    },
  ],
  'project:ridgeline:project-summit': [
    {
      id: 'folder:project-summit:project-files',
      name: 'Project Files',
      type: 'folder',
      value: { id: 'project-files', name: 'Project Files', type: 'folder' },
      hasChildren: true,
    },
  ],
  'project:ridgeline:project-cedar': [],
  'folder:project-summit:project-files': [
    {
      id: 'folder:project-summit:design',
      name: 'Design',
      type: 'folder',
      value: { id: 'design', name: 'Design', type: 'folder' },
      hasChildren: true,
    },
    {
      id: 'item:project-summit:site-logistics',
      name: 'Site Logistics Plan.pdf',
      type: 'item',
      value: {
        id: 'site-logistics',
        name: 'Site Logistics Plan.pdf',
        type: 'item',
        translationStatus: 'pending',
      },
      hasChildren: true,
    },
  ],
  'folder:project-summit:design': [modelItem],
  [modelItem.id]: modelVersions,
  'item:project-summit:site-logistics': [],
}

const initialNodes: HubTreeNode[] = [
  {
    id: 'hub:ridgeline',
    name: 'Ridgeline Builders',
    type: 'hub',
    value: { id: 'ridgeline', name: 'Ridgeline Builders', region: 'US' },
    hasChildren: true,
  },
]

function addChildren(
  nodes: HubTreeNode[],
  parentId: string,
  children: HubTreeNode[],
): HubTreeNode[] {
  return nodes.map((node) => {
    if (node.id === parentId) {
      if (node.type === 'version') return node
      if (node.type === 'item') {
        return { ...node, children: children.filter((child) => child.type === 'version') }
      }
      return { ...node, children }
    }
    if (node.type === 'version' || node.type === 'item') return node
    if (!node.children) return node
    return { ...node, children: addChildren(node.children, parentId, children) }
  })
}

function selectedTreeId(
  nodes: HubTreeNode[],
  itemId: string,
  versionId?: string,
): string | undefined {
  for (const node of nodes) {
    if (versionId && node.type === 'version' && node.value.id === versionId) return node.id
    if (!versionId && node.type === 'item' && node.value.id === itemId) return node.id
    const nested = node.children && selectedTreeId(node.children, itemId, versionId)
    if (nested) return nested
  }
  return undefined
}

function wait(ms = 450): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

/** A self-contained controlled tree showing per-node lazy expansion. */
export function HubTreeDemo() {
  const [nodes, setNodes] = useState(initialNodes)
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [selectedId, setSelectedId] = useState<string>()
  const [pendingId, setPendingId] = useState<string>()
  const [opened, setOpened] = useState('Open a file or version to inspect the selection.')

  async function expand(node: HubTreeNode): Promise<void> {
    setExpandedIds((current) => (current.includes(node.id) ? current : [...current, node.id]))
    if (node.children) return
    setPendingId(node.id)
    await wait()
    setNodes((current) => addChildren(current, node.id, childNodes[node.id] ?? []))
    setPendingId(undefined)
  }

  function open(item: Item, version?: ItemVersion): void {
    setSelectedId(selectedTreeId(nodes, item.id, version?.id))
    setOpened(`${item.name} — ${version ? `version ${version.versionNumber}` : 'current tip'}`)
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <HubTree
        nodes={nodes}
        expandedIds={expandedIds}
        selectedId={selectedId}
        pendingId={pendingId}
        onExpand={expand}
        onCollapse={(node) => setExpandedIds((current) => current.filter((id) => id !== node.id))}
        onItemOpen={open}
      />
      <output className="text-muted-foreground text-xs">{opened}</output>
    </div>
  )
}
