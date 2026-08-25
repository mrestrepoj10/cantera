'use client'

import { FileBoxIcon, LoaderCircleIcon, LocateIcon, SearchIcon } from 'lucide-react'
import { type ComponentProps, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import type { BrowsePathSegment, Item, ItemVersion } from '@/lib/project-types'
import { cn } from '@/lib/utils'

// APS has no cross-hub search API, so honest scoping is the consumer's job:
// name each group after what was actually searched ("In Summit Tower", never
// "Everywhere").

export interface FinderEntry {
  item: Item
  /** Version, when the entry means a specific one rather than the tip. */
  version?: ItemVersion
  /** Where it lives, root-first. Renders as the path line and powers onReveal. */
  path?: BrowsePathSegment[]
  /** Secondary line replacing the path (e.g. "opened 5 minutes ago"). */
  caption?: string
}

export type FinderGroupStatus = 'ready' | 'loading' | 'error'

export interface FinderGroup {
  id: string
  label: string
  /** `loading` keeps existing entries visible under a spinner-labeled heading. */
  status?: FinderGroupStatus
  error?: string
  entries: FinderEntry[]
}

export interface FinderPending {
  openingId?: string
}

export interface FinderProps extends Omit<ComponentProps<'div'>, 'onSelect'> {
  query: string
  onQueryChange: (query: string) => void
  groups: FinderGroup[]
  onItemOpen?: (entry: FinderEntry) => void | Promise<void>
  /** Show the entry where it lives (expand a tree, navigate a browser). */
  onReveal?: (entry: FinderEntry) => void
  pending?: FinderPending
  placeholder?: string
  label?: string
  emptyLabel?: string
}

export function finderEntryKey(entry: FinderEntry): string {
  return entry.version ? `${entry.item.id}@${entry.version.id}` : entry.item.id
}

function pathLine(path: BrowsePathSegment[] | undefined): string | null {
  if (!path || path.length === 0) return null
  return path.map((segment) => segment.name).join(' › ')
}

function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return typeof (value as Promise<void> | undefined)?.then === 'function'
}

interface FinderSurfaceProps
  extends Pick<
    FinderProps,
    | 'query'
    | 'onQueryChange'
    | 'groups'
    | 'onItemOpen'
    | 'onReveal'
    | 'pending'
    | 'placeholder'
    | 'label'
    | 'emptyLabel'
  > {
  autoFocus?: boolean
}

function FinderSurface({
  query,
  onQueryChange,
  groups,
  onItemOpen,
  onReveal,
  pending,
  placeholder = 'Find a file',
  label = 'Find a file',
  emptyLabel = 'No matches.',
  autoFocus,
}: FinderSurfaceProps) {
  const [openingId, setOpeningId] = useState<string>()

  const anyLoading = groups.some((group) => group.status === 'loading')
  const anyEntries = groups.some((group) => group.entries.length > 0)
  const showEmpty = query.trim() !== '' && !anyEntries && !anyLoading

  function open(entry: FinderEntry): void {
    const key = finderEntryKey(entry)
    if (pending?.openingId || openingId) return
    const result = onItemOpen?.(entry)
    if (!isPromiseLike(result)) return
    setOpeningId(key)
    result.finally(() => setOpeningId(undefined))
  }

  return (
    <Command shouldFilter={false} className="bg-transparent">
      <CommandInput
        value={query}
        onValueChange={onQueryChange}
        placeholder={placeholder}
        aria-label={label}
        autoFocus={autoFocus}
      />
      <CommandList>
        {showEmpty && <CommandEmpty>{emptyLabel}</CommandEmpty>}
        {groups.map((group) => {
          if (group.status !== 'loading' && group.status !== 'error' && !group.entries.length) {
            return null
          }
          return (
            <CommandGroup
              key={group.id}
              data-finder-group={group.id}
              heading={
                group.status === 'loading' ? (
                  <span className="flex items-center gap-1.5">
                    {group.label}
                    <LoaderCircleIcon aria-hidden="true" className="size-3 animate-spin" />
                    <span className="sr-only">Searching</span>
                  </span>
                ) : (
                  group.label
                )
              }
            >
              {group.status === 'error' && (
                <p role="status" className="px-2 py-1.5 text-status-warning text-xs">
                  {group.error ?? 'Search failed. Keep typing to retry.'}
                </p>
              )}
              {group.entries.map((entry) => {
                const key = finderEntryKey(entry)
                const opening = (pending?.openingId ?? openingId) === key
                const line = entry.caption ?? pathLine(entry.path)
                return (
                  <CommandItem
                    key={key}
                    value={`${group.id}:${key}`}
                    aria-disabled={opening || undefined}
                    onSelect={() => open(entry)}
                    className="min-h-11"
                  >
                    {opening ? (
                      <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
                    ) : (
                      <FileBoxIcon aria-hidden="true" className="text-muted-foreground" />
                    )}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">
                        {entry.item.name}
                        {entry.version && (
                          <span className="text-muted-foreground">
                            {' '}
                            · v{entry.version.versionNumber}
                          </span>
                        )}
                      </span>
                      {line && (
                        <span className="truncate text-muted-foreground text-xs">{line}</span>
                      )}
                    </span>
                    {onReveal && entry.path && entry.path.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Show ${entry.item.name} location`}
                        onClick={(event) => {
                          event.stopPropagation()
                          onReveal(entry)
                        }}
                      >
                        <LocateIcon aria-hidden="true" className="size-3.5" />
                      </Button>
                    )}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )
        })}
      </CommandList>
    </Command>
  )
}

function Finder({
  query,
  onQueryChange,
  groups,
  onItemOpen,
  onReveal,
  pending,
  placeholder,
  label,
  emptyLabel,
  className,
  ...props
}: FinderProps) {
  return (
    <div data-finder="" className={cn('flex flex-col', className)} {...props}>
      <FinderSurface
        query={query}
        onQueryChange={onQueryChange}
        groups={groups}
        onItemOpen={onItemOpen}
        onReveal={onReveal}
        pending={pending}
        placeholder={placeholder}
        label={label}
        emptyLabel={emptyLabel}
      />
    </div>
  )
}

export interface FinderDialogProps extends Omit<FinderProps, 'className'> {
  open: boolean
  onOpenChange: (open: boolean) => void
  shortcut?: boolean
  title?: string
  description?: string
}

function FinderDialog({
  open,
  onOpenChange,
  shortcut = true,
  title = 'Find a file',
  description = 'Search project files',
  onItemOpen,
  onReveal,
  ...surface
}: FinderDialogProps) {
  useEffect(() => {
    if (!shortcut) return
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [shortcut, open, onOpenChange])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <FinderSurface
        {...surface}
        autoFocus
        onItemOpen={
          onItemOpen
            ? async (entry) => {
                await onItemOpen(entry)
                onOpenChange(false)
              }
            : undefined
        }
        onReveal={
          onReveal
            ? (entry) => {
                onReveal(entry)
                onOpenChange(false)
              }
            : undefined
        }
      />
    </CommandDialog>
  )
}

export interface FinderTriggerProps extends ComponentProps<'button'> {
  placeholder?: string
  /** Render the ⌘K hint (hidden on coarse pointers). */
  showShortcut?: boolean
}

function FinderTrigger({
  placeholder = 'Find a file',
  showShortcut = true,
  className,
  ...props
}: FinderTriggerProps) {
  return (
    <button
      type="button"
      data-finder-trigger=""
      // The visible placeholder is the first thing a collapsed rail hides, so
      // the name is spelled out either way.
      aria-label={placeholder}
      className={cn(
        'flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-input/30 px-2.5 text-muted-foreground text-sm outline-none transition-[color,background-color,border-color,transform] duration-150 ease-out hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98] dark:bg-input/30',
        'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:hover:bg-sidebar-accent group-data-[collapsible=icon]:hover:text-sidebar-accent-foreground',
        className,
      )}
      {...props}
    >
      <SearchIcon
        aria-hidden="true"
        className="size-4 shrink-0 opacity-50 group-data-[collapsible=icon]:opacity-100"
      />
      <span className="flex-1 truncate text-left group-data-[collapsible=icon]:hidden">
        {placeholder}
      </span>
      {showShortcut && (
        <kbd className="pointer-fine:inline-flex hidden items-center rounded border border-border px-1.5 py-0.5 font-mono text-muted-foreground text-xs group-data-[collapsible=icon]:hidden!">
          ⌘K
        </kbd>
      )}
    </button>
  )
}

export { Finder, FinderDialog, FinderTrigger }
