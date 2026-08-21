'use client'

import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  LoaderCircleIcon,
  RotateCwIcon,
} from 'lucide-react'
import type * as React from 'react'
import { Fragment, useId, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type BrowsePathSegment,
  type FolderEntry,
  type Item,
  type ItemVersion,
  isItem,
  type ModelTranslationStatus,
} from '@/lib/project-types'
import { cn } from '@/lib/utils'

type HubBrowserStatus = 'ready' | 'loading' | 'error'

interface HubBrowserVersions {
  itemId: string
  status: 'loading' | 'ready' | 'error'
  versions: ItemVersion[]
}

interface HubBrowserPending {
  navigatingTo?: string
  openingItem?: string
  /** Drives the Load more control while the consumer paginates. */
  loadingMore?: boolean
}

interface HubBrowserProps extends React.ComponentProps<'section'> {
  path: BrowsePathSegment[]
  entries: FolderEntry[]
  status?: HubBrowserStatus
  error?: string
  onNavigate?: (segment: BrowsePathSegment) => void | Promise<void>
  onItemOpen?: (item: Item, version?: ItemVersion) => void | Promise<void>
  pending?: HubBrowserPending
  hasMore?: boolean
  onLoadMore?: () => void | Promise<void>
  versions?: HubBrowserVersions
  onRequestVersions?: (itemId: string) => void | Promise<void>
  locale?: string
  title?: string
  titleAs?: 'h2' | 'h3' | 'h4'
}

/** Empty-id sentinel passed to `onNavigate` when the Hubs crumb is activated. */
const ROOT_BROWSE_SEGMENT: BrowsePathSegment = { id: '', name: 'Hubs', type: 'hub' }

function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return value != null && typeof (value as Promise<void>).then === 'function'
}

function runPending(
  action: () => void | Promise<void>,
  setPending: (pending: boolean) => void,
): void {
  const result = action()
  if (!isPromiseLike(result)) return
  setPending(true)
  result.then(
    () => setPending(false),
    () => setPending(false),
  )
}

function nextSegmentType(path: BrowsePathSegment[]): BrowsePathSegment['type'] {
  const current = path.at(-1)?.type
  if (!current) return 'hub'
  return current === 'hub' ? 'project' : 'folder'
}

function toPathSegment(entry: FolderEntry, path: BrowsePathSegment[]): BrowsePathSegment {
  return { id: entry.id, name: entry.name, type: nextSegmentType(path) }
}

function relativeTime(value: Date | string | number | undefined, locale?: string): string | null {
  if (value == null) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const ranges: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  const [unit, divisor] = ranges.find(([, range]) => Math.abs(seconds) >= range) ?? ['second', 1]
  return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(
    Math.round(seconds / divisor),
    unit,
  )
}

const translationLabels: Record<ModelTranslationStatus, string> = {
  pending: 'Not translated',
  inprogress: 'Translating',
  success: 'Viewable',
  failed: 'Failed',
  timeout: 'Timed out',
}

const translationClasses: Record<ModelTranslationStatus, string> = {
  pending: 'bg-status-neutral text-status-neutral-foreground',
  inprogress: 'bg-status-warning text-status-warning-foreground',
  success: 'bg-status-success text-status-success-foreground',
  failed: 'bg-status-danger text-status-danger-foreground',
  timeout: 'bg-status-danger text-status-danger-foreground',
}

function TranslationBadge({ status }: { status: ModelTranslationStatus }) {
  return (
    <Badge className={cn('transition-colors', translationClasses[status])}>
      {translationLabels[status]}
    </Badge>
  )
}

interface HubBrowserBreadcrumbProps {
  path: BrowsePathSegment[]
  onNavigate?: (segment: BrowsePathSegment) => void | Promise<void>
  pendingId?: string
  onPendingChange?: (id: string | undefined) => void
}

function HubBrowserBreadcrumb({
  path,
  onNavigate,
  pendingId,
  onPendingChange,
}: HubBrowserBreadcrumbProps) {
  const crumbs = [ROOT_BROWSE_SEGMENT, ...path]

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((segment, index) => {
          const current = index === crumbs.length - 1
          const busy = pendingId === segment.id
          return (
            <Fragment key={`${segment.type}:${segment.id || 'root'}`}>
              <BreadcrumbItem>
                {current ? (
                  <BreadcrumbPage>{segment.name}</BreadcrumbPage>
                ) : (
                  <button
                    type="button"
                    aria-disabled={busy || undefined}
                    aria-busy={busy || undefined}
                    className="relative rounded-sm border border-transparent py-0.5 pr-6 pl-1 transition-colors hover:text-foreground focus-visible:border-ring focus-visible:outline-none aria-disabled:opacity-60"
                    onClick={() => {
                      if (!onNavigate || busy) return
                      runPending(
                        () => onNavigate(segment),
                        (next) => onPendingChange?.(next ? segment.id : undefined),
                      )
                    }}
                  >
                    {segment.name}
                    <LoaderCircleIcon
                      aria-hidden
                      className={cn(
                        'absolute top-1/2 right-1 size-3.5 -translate-y-1/2 animate-spin transition-[opacity,scale,filter] duration-150 ease-out motion-reduce:transition-none',
                        busy ? 'scale-100 opacity-100 blur-none' : 'scale-25 opacity-0 blur-[4px]',
                      )}
                    />
                  </button>
                )}
              </BreadcrumbItem>
              {!current && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function HubBrowserLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" data-slot="hub-browser-loading">
      <output className="flex items-center gap-2 px-3 text-muted-foreground text-sm">
        <LoaderCircleIcon aria-hidden className="size-4 animate-spin" />
        Loading this location
      </output>
      {Array.from({ length: rows }, (_, index) => `hub-browser-skeleton-${index}`).map((id) => (
        <div key={id} aria-hidden className="flex min-h-14 items-center gap-3 rounded-lg px-3">
          <Skeleton className="size-5 shrink-0 animate-none" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/5 animate-none" />
            <Skeleton className="h-3 w-1/3 animate-none" />
          </div>
        </div>
      ))}
    </div>
  )
}

function HubBrowserError({ message }: { message?: string }) {
  return (
    <p role="alert" className="px-3 py-8 text-center text-status-danger text-sm">
      {message ?? 'This location could not be loaded.'}
    </p>
  )
}

function HubBrowserEmpty() {
  return <p className="px-3 py-8 text-center text-muted-foreground text-sm">No files or folders.</p>
}

interface VersionPickerProps {
  item: Item
  versions?: HubBrowserVersions
  onRequestVersions?: (itemId: string) => void | Promise<void>
  onChoose: (version: ItemVersion) => void
  opening: boolean
  locale?: string
}

/** The version line under a version row: when it was cut, and by whom. */
function versionMeta(version: ItemVersion, locale?: string): string {
  const created = relativeTime(version.createTime, locale)
  return [created, version.createdBy].filter(Boolean).join(' · ')
}

function VersionPicker({
  item,
  versions,
  onRequestVersions,
  onChoose,
  opening,
  locale,
}: VersionPickerProps) {
  const [requestPending, setRequestPending] = useState(false)
  const descriptionId = useId()
  const active = versions?.itemId === item.id ? versions : undefined
  const loading = active?.status === 'loading' || requestPending

  function request(): void {
    if (!onRequestVersions || active?.status === 'ready' || loading) return
    runPending(() => onRequestVersions(item.id), setRequestPending)
  }

  return (
    <Popover onOpenChange={(open) => open && request()}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            // Stretches to the row it belongs to, so the version reads as part
            // of the file rather than a control parked beside it.
            className="min-h-14 shrink-0 gap-1.5 self-stretch px-2.5 focus-visible:border-ring"
            disabled={loading || opening}
            focusableWhenDisabled
            aria-busy={loading || opening || undefined}
            aria-label={`Choose version of ${item.name}`}
          />
        }
      >
        <span aria-hidden className="grid min-w-7 place-items-center">
          <LoaderCircleIcon
            className={cn(
              'col-start-1 row-start-1 size-4 animate-spin transition-[opacity,scale,filter] duration-150 ease-out motion-reduce:transition-none',
              loading ? 'scale-100 opacity-100 blur-none' : 'scale-25 opacity-0 blur-[4px]',
            )}
          />
          <span
            className={cn(
              'col-start-1 row-start-1 font-medium text-sm tabular-nums transition-opacity duration-150 ease-out motion-reduce:transition-none',
              loading ? 'opacity-0' : 'opacity-100',
            )}
          >
            {item.tip ? `v${item.tip.versionNumber}` : '—'}
          </span>
        </span>
        <ChevronDownIcon aria-hidden className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[25rem] max-w-[calc(100vw-2rem)] data-closed:animate-none data-open:animate-none"
        aria-describedby={descriptionId}
      >
        <PopoverHeader>
          <PopoverTitle>Choose a version</PopoverTitle>
          <PopoverDescription id={descriptionId}>{item.name}</PopoverDescription>
        </PopoverHeader>
        {loading && (
          <output className="flex min-h-11 items-center gap-2 px-2 text-muted-foreground">
            <LoaderCircleIcon aria-hidden className="size-4 animate-spin" />
            Loading versions
          </output>
        )}
        {active?.status === 'error' && !loading && (
          <div className="flex flex-col gap-2">
            <p className="text-status-danger text-sm">Versions could not be loaded.</p>
            {onRequestVersions && (
              <Button type="button" variant="outline" className="min-h-11" onClick={request}>
                <RotateCwIcon aria-hidden />
                Try again
              </Button>
            )}
          </div>
        )}
        {active?.status === 'ready' && active.versions.length === 0 && (
          <p className="py-2 text-muted-foreground">No versions available.</p>
        )}
        {active?.status === 'ready' && active.versions.length > 0 && (
          <ul className="-mx-1 flex max-h-72 flex-col overflow-y-auto">
            {active.versions.map((version) => {
              const current = version.versionNumber === item.tip?.versionNumber
              const meta = versionMeta(version, locale)
              // The popover header already names the file, so a displayName
              // that repeats it earns no line of its own.
              const title = version.displayName === item.name ? undefined : version.displayName
              const status: ModelTranslationStatus = version.derivativeUrn ? 'success' : 'pending'
              return (
                <li key={version.id}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-14 w-full justify-start gap-3 px-2 py-2 text-left whitespace-normal focus-visible:border-ring"
                    disabled={opening}
                    focusableWhenDisabled
                    aria-busy={opening || undefined}
                    aria-current={current || undefined}
                    // The number lives in a chip and the state in a badge, so
                    // the name is spelled out rather than left to concatenation.
                    aria-label={[
                      `Version ${version.versionNumber}`,
                      current && 'current',
                      title,
                      meta,
                      translationLabels[status],
                    ]
                      .filter(Boolean)
                      .join(', ')}
                    onClick={() => onChoose(version)}
                  >
                    <span
                      aria-hidden
                      className="grid size-9 shrink-0 place-items-center rounded-md bg-muted font-medium text-xs tabular-nums"
                    >
                      v{version.versionNumber}
                    </span>
                    <span aria-hidden className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="min-w-0 truncate font-medium text-sm">
                          {title ?? meta ?? `Version ${version.versionNumber}`}
                        </span>
                        {current && (
                          <span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                            <CheckIcon aria-hidden className="size-3" />
                            Current
                          </span>
                        )}
                      </span>
                      {title && meta && (
                        <span className="truncate text-muted-foreground text-xs">{meta}</span>
                      )}
                    </span>
                    <TranslationBadge status={status} />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}

interface HubBrowserListProps {
  path: BrowsePathSegment[]
  entries: FolderEntry[]
  locale?: string
  navigatingId?: string
  openingId?: string
  onNavigate?: (segment: BrowsePathSegment) => void | Promise<void>
  onItemOpen?: (item: Item, version?: ItemVersion) => void | Promise<void>
  versions?: HubBrowserVersions
  onRequestVersions?: (itemId: string) => void | Promise<void>
  onNavigatingChange: (id: string | undefined) => void
  onOpeningChange: (id: string | undefined) => void
}

function HubBrowserList({
  path,
  entries,
  locale,
  navigatingId,
  openingId,
  onNavigate,
  onItemOpen,
  versions,
  onRequestVersions,
  onNavigatingChange,
  onOpeningChange,
}: HubBrowserListProps) {
  return (
    <ul className="flex flex-col gap-1" data-slot="hub-browser-list">
      {entries.map((entry) => {
        const item = isItem(entry) ? entry : undefined
        const folder = isItem(entry) ? undefined : entry
        const busy = item ? openingId === item.id : navigatingId === entry.id
        const modified = relativeTime(entry.lastModifiedTime, locale)
        return (
          <li
            key={`${item ? 'item' : 'container'}:${entry.id}`}
            className="flex items-stretch gap-1"
          >
            <Button
              type="button"
              variant="ghost"
              className="min-h-14 min-w-0 flex-1 justify-start gap-3 px-3 py-2 text-left whitespace-normal focus-visible:border-ring"
              disabled={busy}
              focusableWhenDisabled
              aria-busy={busy || undefined}
              aria-label={`${item ? 'Open' : 'Browse'} ${entry.name}`}
              onClick={() => {
                if (item) {
                  if (!onItemOpen) return
                  runPending(
                    () => onItemOpen(item),
                    (next) => onOpeningChange(next ? item.id : undefined),
                  )
                  return
                }
                if (!onNavigate) return
                const segment = toPathSegment(entry, path)
                runPending(
                  () => onNavigate(segment),
                  (next) => onNavigatingChange(next ? segment.id : undefined),
                )
              }}
            >
              <span className="grid size-5 shrink-0 place-items-center" aria-hidden>
                <LoaderCircleIcon
                  className={cn(
                    'col-start-1 row-start-1 size-5 animate-spin transition-[opacity,scale,filter] duration-150 ease-out motion-reduce:transition-none',
                    busy ? 'scale-100 opacity-100 blur-none' : 'scale-25 opacity-0 blur-[4px]',
                  )}
                />
                {item ? (
                  <FileIcon
                    className={cn(
                      'col-start-1 row-start-1 size-5 transition-opacity duration-150 ease-out motion-reduce:transition-none',
                      busy ? 'opacity-0' : 'opacity-100',
                    )}
                  />
                ) : (
                  <FolderIcon
                    className={cn(
                      'col-start-1 row-start-1 size-5 transition-opacity duration-150 ease-out motion-reduce:transition-none',
                      busy ? 'opacity-0' : 'opacity-100',
                    )}
                  />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium">{entry.name}</span>
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-xs">
                  {modified && <span>Modified {modified}</span>}
                  {entry.modifiedBy && <span>by {entry.modifiedBy}</span>}
                  {folder?.objectCount != null && <span>{folder.objectCount} items</span>}
                </span>
              </span>
              {item?.translationStatus && <TranslationBadge status={item.translationStatus} />}
              {!item && <ChevronRightIcon aria-hidden className="size-4 shrink-0" />}
            </Button>
            {item && (onRequestVersions || versions?.itemId === item.id) && (
              <VersionPicker
                item={item}
                locale={locale}
                versions={versions}
                onRequestVersions={onRequestVersions}
                opening={openingId === item.id}
                onChoose={(version) => {
                  if (!onItemOpen) return
                  runPending(
                    () => onItemOpen(item, version),
                    (next) => onOpeningChange(next ? item.id : undefined),
                  )
                }}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

function HubBrowser({
  path,
  entries,
  status = 'ready',
  error,
  onNavigate,
  onItemOpen,
  pending,
  hasMore = false,
  onLoadMore,
  versions,
  onRequestVersions,
  locale,
  title = 'Browse files',
  titleAs = 'h2',
  className,
  ...props
}: HubBrowserProps) {
  const Heading = titleAs
  const [localNavigating, setLocalNavigating] = useState<string>()
  const [localOpening, setLocalOpening] = useState<string>()
  const [localLoadingMore, setLocalLoadingMore] = useState(false)
  const navigatingId = pending?.navigatingTo ?? localNavigating
  const openingId = pending?.openingItem ?? localOpening
  // Pagination that runs through a server action returns void, so the
  // consumer drives the flag; a promise-returning handler drives it locally.
  const loadingMore = pending?.loadingMore ?? localLoadingMore

  return (
    <section
      data-slot="hub-browser"
      className={cn('flex min-w-0 flex-col gap-4', className)}
      {...props}
    >
      <div className="flex flex-col gap-2">
        <Heading className="font-semibold text-lg">{title}</Heading>
        <HubBrowserBreadcrumb
          path={path}
          onNavigate={onNavigate}
          pendingId={navigatingId}
          onPendingChange={setLocalNavigating}
        />
      </div>
      <ScrollArea className="h-80 rounded-lg border border-border p-2">
        {status === 'loading' && <HubBrowserLoading />}
        {status === 'error' && <HubBrowserError message={error} />}
        {status === 'ready' && entries.length === 0 && <HubBrowserEmpty />}
        {status === 'ready' && entries.length > 0 && (
          <HubBrowserList
            path={path}
            entries={entries}
            locale={locale}
            navigatingId={navigatingId}
            openingId={openingId}
            onNavigate={onNavigate}
            onItemOpen={onItemOpen}
            versions={versions}
            onRequestVersions={onRequestVersions}
            onNavigatingChange={setLocalNavigating}
            onOpeningChange={setLocalOpening}
          />
        )}
        {status === 'ready' && hasMore && onLoadMore && (
          <Button
            type="button"
            variant="ghost"
            className="mt-1 min-h-11 w-full gap-2"
            disabled={loadingMore}
            focusableWhenDisabled
            aria-busy={loadingMore || undefined}
            onClick={() => runPending(onLoadMore, setLocalLoadingMore)}
          >
            <LoaderCircleIcon
              aria-hidden
              className={cn(
                'size-4 animate-spin transition-[opacity,scale,filter] duration-150 ease-out motion-reduce:transition-none',
                loadingMore ? 'scale-100 opacity-100 blur-none' : 'scale-25 opacity-0 blur-[4px]',
              )}
            />
            Load more
          </Button>
        )}
      </ScrollArea>
    </section>
  )
}

export {
  HubBrowser,
  HubBrowserBreadcrumb,
  HubBrowserEmpty,
  HubBrowserError,
  HubBrowserList,
  HubBrowserLoading,
  type HubBrowserPending,
  type HubBrowserProps,
  type HubBrowserStatus,
  type HubBrowserVersions,
  ROOT_BROWSE_SEGMENT,
  relativeTime,
  TranslationBadge,
  toPathSegment,
}
