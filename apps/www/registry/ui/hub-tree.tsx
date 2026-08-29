'use client'

import {
  BoxesIcon,
  Building2Icon,
  ChevronRightIcon,
  FileBoxIcon,
  FolderIcon,
  HistoryIcon,
  LoaderCircleIcon,
} from 'lucide-react'
import type { ComponentProps, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { Folder, Hub, Item, ItemVersion, Project } from '@/lib/project-types'
import { cn } from '@/lib/utils'

interface HubTreeNodeBase<Type extends string, Value> {
  /** Stable, globally unique tree id. Prefix provider ids with type and ancestry. */
  id: string
  name: string
  type: Type
  /** Provider-normalized domain value. Its id stays suitable for API requests. */
  value: Value
}

export interface HubTreeHubNode extends HubTreeNodeBase<'hub', Hub> {
  children?: HubTreeNode[]
  hasChildren?: boolean
}

export interface HubTreeProjectNode extends HubTreeNodeBase<'project', Project> {
  children?: HubTreeNode[]
  hasChildren?: boolean
}

export interface HubTreeFolderNode extends HubTreeNodeBase<'folder', Folder> {
  children?: HubTreeNode[]
  hasChildren?: boolean
}

export interface HubTreeItemNode extends HubTreeNodeBase<'item', Item> {
  children?: HubTreeVersionNode[]
  hasChildren?: boolean
}

export interface HubTreeVersionNode extends HubTreeNodeBase<'version', ItemVersion> {
  children?: never
  hasChildren: false
}

export type HubTreeBranchNode =
  | HubTreeHubNode
  | HubTreeProjectNode
  | HubTreeFolderNode
  | HubTreeItemNode

export type HubTreeNode = HubTreeBranchNode | HubTreeVersionNode

export interface HubTreeProps extends Omit<ComponentProps<'div'>, 'children'> {
  nodes: HubTreeNode[]
  expandedIds: readonly string[]
  selectedId?: string
  pendingId?: string
  density?: 'comfortable' | 'compact'
  /** Rendered instead of the default "No projects found." when `nodes` is empty
   * — the place for loading, error, and reconnect states. */
  empty?: ReactNode
  onExpand: (node: HubTreeBranchNode) => void | Promise<void>
  onCollapse: (node: HubTreeBranchNode) => void | Promise<void>
  onItemOpen: (item: Item, version?: ItemVersion) => void | Promise<void>
}

interface VisibleNode {
  node: HubTreeNode
  parent?: HubTreeNode
  parentItem?: HubTreeItemNode
}

function isBranch(node: HubTreeNode): node is HubTreeBranchNode {
  return node.type !== 'version' && (node.hasChildren !== false || Boolean(node.children?.length))
}

function visibleNodes(nodes: HubTreeNode[], expanded: ReadonlySet<string>): VisibleNode[] {
  const visible: VisibleNode[] = []

  function visit(entries: HubTreeNode[], parent?: HubTreeNode, parentItem?: HubTreeItemNode): void {
    for (const node of entries) {
      visible.push({ node, parent, parentItem })
      if (!expanded.has(node.id) || !node.children?.length) continue
      visit(node.children, node, node.type === 'item' ? node : parentItem)
    }
  }

  visit(nodes)
  return visible
}

function nodeIcon(type: HubTreeNode['type']): ReactNode {
  const className = 'size-4 shrink-0 text-muted-foreground'
  if (type === 'hub') return <Building2Icon aria-hidden className={className} />
  if (type === 'project') return <BoxesIcon aria-hidden className={className} />
  if (type === 'folder') return <FolderIcon aria-hidden className={className} />
  if (type === 'item') return <FileBoxIcon aria-hidden className={className} />
  return <HistoryIcon aria-hidden className={className} />
}

// HubTree never fetches: expanding a row calls the consumer, which supplies
// the resulting children through `nodes`.
function HubTree({
  nodes,
  expandedIds,
  selectedId,
  pendingId,
  density = 'comfortable',
  empty,
  onExpand,
  onCollapse,
  onItemOpen,
  className,
  'aria-label': ariaLabel = 'Project files',
  ...props
}: HubTreeProps) {
  const expanded = useMemo(() => new Set(expandedIds), [expandedIds])
  const visible = useMemo(() => visibleNodes(nodes, expanded), [nodes, expanded])
  const visibleIds = useMemo(() => visible.map(({ node }) => node.id), [visible])
  const rows = useRef(new Map<string, HTMLDivElement>())
  // Roving-tabindex focus derives during render, so it can never fall on a
  // hidden row. The override is tagged with the selection it was made under,
  // so a selection change retires it without an effect.
  const [focusOverride, setFocusOverride] = useState<{
    id: string
    selectionKey: string | undefined
  }>()
  const focusedId =
    focusOverride &&
    focusOverride.selectionKey === selectedId &&
    visibleIds.includes(focusOverride.id)
      ? focusOverride.id
      : selectedId && visibleIds.includes(selectedId)
        ? selectedId
        : visibleIds[0]

  // Ancestor rows expanded in the same update animate open for 200ms, so the
  // selected row's final offset exists only after that transition settles.
  useEffect(() => {
    if (!selectedId) return
    const timer = window.setTimeout(
      () => rows.current.get(selectedId)?.scrollIntoView({ block: 'nearest' }),
      220,
    )
    return () => window.clearTimeout(timer)
  }, [selectedId])

  function focus(nodeId: string | undefined): void {
    if (!nodeId) return
    setFocusOverride({ id: nodeId, selectionKey: selectedId })
    requestAnimationFrame(() => rows.current.get(nodeId)?.focus())
  }

  function toggle(node: HubTreeBranchNode): void {
    if (pendingId === node.id) return
    if (expanded.has(node.id)) void onCollapse(node)
    else void onExpand(node)
  }

  function activate(entry: VisibleNode): void {
    const { node, parentItem } = entry
    if (pendingId === node.id) return
    if (node.type === 'item') {
      void onItemOpen(node.value)
      return
    }
    if (node.type === 'version' && parentItem) {
      void onItemOpen(parentItem.value, node.value)
      return
    }
    if (isBranch(node)) toggle(node)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>, entry: VisibleNode): void {
    const index = visible.findIndex(({ node }) => node.id === entry.node.id)
    if (event.key === 'ArrowDown') focus(visible[index + 1]?.node.id)
    else if (event.key === 'ArrowUp') focus(visible[index - 1]?.node.id)
    else if (event.key === 'Home') focus(visible[0]?.node.id)
    else if (event.key === 'End') focus(visible.at(-1)?.node.id)
    else if (event.key === 'ArrowRight' && isBranch(entry.node)) {
      if (!expanded.has(entry.node.id)) toggle(entry.node)
      else focus(entry.node.children?.[0]?.id)
    } else if (event.key === 'ArrowLeft') {
      if (isBranch(entry.node) && expanded.has(entry.node.id)) toggle(entry.node)
      else focus(entry.parent?.id)
    } else if (event.key === 'Enter' || event.key === ' ') activate(entry)
    else return
    event.preventDefault()
  }

  function renderNodes(
    entries: HubTreeNode[],
    level: number,
    parent?: HubTreeNode,
    parentItem?: HubTreeItemNode,
  ) {
    return entries.map((node, index) => {
      const branch = isBranch(node)
      const open = branch && expanded.has(node.id)
      const busy = pendingId === node.id
      const currentEntry: VisibleNode = { node, parent, parentItem }
      const selected = selectedId === node.id
      const children = node.children ?? []

      function onClick(event: MouseEvent<HTMLDivElement>): void {
        const disclosure = (event.target as HTMLElement).closest('[data-hub-tree-disclosure]')
        if (node.type === 'item' && branch && disclosure) toggle(node)
        else activate(currentEntry)
      }

      return (
        <div key={node.id} role="none">
          <div
            ref={(element) => {
              if (element) rows.current.set(node.id, element)
              else rows.current.delete(node.id)
            }}
            role="treeitem"
            aria-level={level}
            aria-posinset={index + 1}
            aria-setsize={entries.length}
            aria-expanded={branch ? open : undefined}
            aria-selected={selected}
            aria-busy={busy || undefined}
            aria-disabled={busy || undefined}
            tabIndex={focusedId === node.id ? 0 : -1}
            data-slot="hub-tree-item"
            data-type={node.type}
            data-density={density}
            className={cn(
              'group/treeitem flex cursor-default items-center rounded-md pr-2 outline-none select-none',
              'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
              'aria-selected:bg-accent aria-selected:text-accent-foreground aria-disabled:opacity-65',
              // 44px rows carry menu-row type; the compact escape hatch drops both.
              density === 'comfortable' ? 'min-h-11 gap-2 text-sm' : 'min-h-9 gap-1.5 text-xs',
            )}
            style={{ paddingInlineStart: `${8 + (level - 1) * 16}px` }}
            onClick={onClick}
            onFocus={() => setFocusOverride({ id: node.id, selectionKey: selectedId })}
            onKeyDown={(event) => onKeyDown(event, currentEntry)}
          >
            <span
              data-hub-tree-disclosure={branch ? '' : undefined}
              aria-hidden
              className="grid size-5 shrink-0 place-items-center"
            >
              {busy ? (
                <span className="grid size-3.5 animate-spin place-items-center">
                  <LoaderCircleIcon className="size-3.5" />
                </span>
              ) : branch ? (
                <ChevronRightIcon
                  className={cn(
                    'size-3.5 transition-transform duration-200 ease-out motion-reduce:transition-none',
                    open && 'rotate-90',
                  )}
                />
              ) : null}
            </span>
            {nodeIcon(node.type)}
            <span className="min-w-0 flex-1 truncate">{node.name}</span>
            {node.type === 'version' && (
              <span className="shrink-0 text-muted-foreground tabular-nums">
                v{node.value.versionNumber}
              </span>
            )}
          </div>
          {branch && children.length > 0 && (
            // biome-ignore lint/a11y/useSemanticElements: WAI-ARIA tree descendants require role=group; fieldset is not valid tree markup
            <div
              role="group"
              aria-hidden={!open}
              className={cn(
                'grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="min-h-0 overflow-hidden">
                {renderNodes(children, level + 1, node, node.type === 'item' ? node : parentItem)}
              </div>
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div
      {...props}
      role="tree"
      aria-label={ariaLabel}
      data-slot="hub-tree"
      data-density={density}
      className={cn('flex min-w-0 flex-col gap-0.5', className)}
    >
      {nodes.length > 0
        ? renderNodes(nodes, 1)
        : (empty ?? (
            <p className="px-3 py-8 text-center text-muted-foreground text-xs">
              No projects found.
            </p>
          ))}
    </div>
  )
}

export { HubTree }
