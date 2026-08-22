'use client'

import { ChevronsUpDownIcon, LoaderCircleIcon } from 'lucide-react'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { groupProjectsByHub, type Hub, type Project } from '@/lib/project-types'
import { cn } from '@/lib/utils'

type ProjectPickerStatus = 'ready' | 'loading' | 'error'

interface ProjectPickerProps {
  projects: Project[]
  /** Hubs to group by, in catalog order. Omit for a flat list. */
  hubs?: Hub[]
  /** Selected project id (controlled). */
  value?: string
  /** Initially selected project id (uncontrolled). */
  defaultValue?: string
  /**
   * Called with the chosen project id. Return a promise and the picker drives
   * its own pending state for the duration — or drive it with `pending`.
   */
  onValueChange?: (projectId: string) => void | Promise<void>
  /**
   * Where the project list stands: `ready` renders it, `loading` a still
   * skeleton, `error` the message wired to a retry. Loading and error live
   * inside the open picker, so the trigger never unmounts under the cursor.
   */
  status?: ProjectPickerStatus
  /** Human-readable fetch failure, shown when status is "error". */
  error?: string
  /** Retry for the failed fetch. Promise-returning handlers drive the pending state. */
  onRetry?: () => void | Promise<void>
  retryPending?: boolean
  /**
   * Pending: the trigger keeps its label, crossfades in a spinner, and goes
   * aria-disabled — still focusable, never unmounted.
   */
  pending?: boolean
  disabled?: boolean
  placeholder?: string
  searchPlaceholder?: string
  /** Shown when the list is ready but has no projects at all. */
  emptyMessage?: string
  /**
   * Accessible name for the trigger. A combobox never takes its name from its
   * content — without this the control announces its value but not what it is.
   */
  'aria-label'?: string
  className?: string
}

/** Thenable check, not `instanceof Promise`: a polyfilled or cross-realm
 * promise is still a pending round trip the controls must reflect. */
function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return value != null && typeof (value as Promise<void>).then === 'function'
}

/**
 * An action on the async-pending contract: disabled with a spinner while it
 * keeps its label, focusable throughout, never unmounted mid-request.
 */
function RetryAction({
  pending,
  onRetry,
  'aria-describedby': ariaDescribedby,
}: {
  pending: boolean
  onRetry: () => void | Promise<void>
  'aria-describedby'?: string
}) {
  const [asyncPending, setAsyncPending] = useState(false)
  const busy = pending || asyncPending

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={busy}
      focusableWhenDisabled
      aria-busy={busy || undefined}
      aria-describedby={ariaDescribedby}
      className="relative gap-0 after:absolute after:-inset-y-2 after:inset-x-0"
      onClick={() => {
        const result = onRetry()
        if (!isPromiseLike(result)) return
        setAsyncPending(true)
        result.then(
          () => setAsyncPending(false),
          () => setAsyncPending(false),
        )
      }}
    >
      <span
        aria-hidden
        className={cn(
          'grid shrink-0 place-items-center overflow-hidden transition-[width,margin] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
          busy ? 'mr-1 w-3.5' : 'mr-0 w-0',
        )}
      >
        {/* The spin lives on a wrapper: transform animations on the <svg>
            itself skip the compositor in some engines. */}
        <span className="grid size-3.5 animate-spin place-items-center">
          <LoaderCircleIcon
            className={cn(
              'size-3.5 transition-[opacity,scale,filter] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
              busy ? 'scale-100 opacity-100 blur-none' : 'scale-25 opacity-0 blur-[4px]',
            )}
          />
        </span>
      </span>
      Retry
    </Button>
  )
}

/**
 * The project choice every ACC screen starts from: a searchable combobox over
 * the projects a grant can reach, grouped by hub. Data-agnostic — projects and
 * hubs in, the chosen id out; the list's own fetch states render inside the
 * open picker.
 */
function ProjectPicker({
  projects,
  hubs,
  value,
  defaultValue,
  onValueChange,
  status = 'ready',
  error,
  onRetry,
  retryPending = false,
  pending = false,
  disabled = false,
  placeholder = 'Select project',
  searchPlaceholder = 'Search projects…',
  emptyMessage = 'No projects yet.',
  'aria-label': ariaLabel = 'Project',
  className,
}: ProjectPickerProps) {
  const [open, setOpen] = useState(false)
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const [asyncPending, setAsyncPending] = useState(false)
  const errorId = useId()
  const selectedId = value ?? uncontrolled
  const selected = projects.find((project) => project.id === selectedId)
  const busy = pending || asyncPending
  const gated = busy || disabled

  // A gate closing the popup resets the open state too. Without this a
  // pending phase would snap the list back open the instant it cleared —
  // motion the user never asked for. Adjusted during render rather than in an
  // effect, so the gated-but-open frame is never painted and never committed.
  if (gated && open) setOpen(false)

  const groups = hubs
    ? groupProjectsByHub(hubs, projects)
    : [{ hub: null, projects }].filter((group) => group.projects.length > 0)

  const listReady = status === 'ready' && projects.length > 0

  function choose(projectId: string) {
    setOpen(false)
    if (value === undefined) setUncontrolled(projectId)
    if (!onValueChange) return
    const result = onValueChange(projectId)
    if (!isPromiseLike(result)) return
    setAsyncPending(true)
    result.then(
      () => setAsyncPending(false),
      () => setAsyncPending(false),
    )
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next && gated) return
        setOpen(next)
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-label={ariaLabel}
            aria-expanded={open}
            disabled={gated}
            focusableWhenDisabled
            aria-busy={busy || undefined}
            data-slot="project-picker"
            className={cn(
              // gap-0 so the collapsed spinner slot leaves no phantom inset at
              // rest; the pseudo-element extends the hit area to the 44px floor.
              'relative w-full justify-between gap-0 font-normal after:absolute after:-inset-y-2 after:inset-x-0',
              !selected && 'text-muted-foreground',
              className,
            )}
          >
            <span
              aria-hidden
              className={cn(
                'grid shrink-0 place-items-center overflow-hidden transition-[width,margin] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
                busy ? 'mr-1.5 w-4' : 'mr-0 w-0',
              )}
            >
              {/* The spin lives on a wrapper: transform animations on the
                  <svg> itself skip the compositor in some engines. */}
              <span className="grid size-4 animate-spin place-items-center">
                <LoaderCircleIcon
                  className={cn(
                    'size-4 transition-[opacity,scale,filter] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
                    busy ? 'scale-100 opacity-100 blur-none' : 'scale-25 opacity-0 blur-[4px]',
                  )}
                />
              </span>
            </span>
            <span className="min-w-0 flex-1 truncate text-left">
              {selected ? selected.name : placeholder}
            </span>
            <ChevronsUpDownIcon className="ml-1.5 size-4 shrink-0 text-muted-foreground" />
          </Button>
        }
      />
      <PopoverContent className="w-(--anchor-width) min-w-64 p-0" align="start">
        {/* Match on keywords (the visible names) only — the opaque ids keep
            cmdk values unique but must never drive search. */}
        <Command
          filter={(_value, search, keywords) => {
            const haystack = (keywords ?? []).join(' ').toLowerCase()
            return haystack.includes(search.toLowerCase()) ? 1 : 0
          }}
        >
          {/* The search box exists only when there is a list to filter; over a
              skeleton, an error, or an empty list it would filter nothing. */}
          {listReady && <CommandInput placeholder={searchPlaceholder} />}
          {status === 'loading' && (
            <div className="flex flex-col gap-1 p-2" data-slot="project-picker-loading">
              {/* A still skeleton in the rows' own box model — no shimmer,
                  no stagger — plus one live-region announcement. */}
              <output aria-live="polite" className="sr-only">
                Loading projects…
              </output>
              {[0, 1, 2].map((row) => (
                <div key={row} aria-hidden className="flex h-8 items-center px-2">
                  <div className="h-3 w-2/3 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-start gap-3 p-4" data-slot="project-picker-error">
              {/* role="status" so the loading → error flip is announced, not
                  just painted. */}
              <p id={errorId} role="status" className="text-sm text-status-danger">
                {error ?? 'Projects could not be loaded.'}
              </p>
              {onRetry && (
                <RetryAction pending={retryPending} onRetry={onRetry} aria-describedby={errorId} />
              )}
            </div>
          )}
          {status === 'ready' && projects.length === 0 && (
            <p className="p-4 text-muted-foreground text-sm" data-slot="project-picker-empty">
              {emptyMessage}
            </p>
          )}
          {listReady && (
            <CommandList>
              <CommandEmpty>No projects match.</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup key={group.hub?.id ?? '__ungrouped'} heading={group.hub?.name}>
                  {group.projects.map((project) => (
                    <CommandItem
                      key={project.id}
                      // The id keeps cmdk values unique when two hubs hold
                      // same-named projects; the filter above matches the
                      // keywords — the visible name — never the id.
                      value={project.id}
                      keywords={[project.name]}
                      data-checked={project.id === selectedId || undefined}
                      onSelect={() => choose(project.id)}
                    >
                      <span className="min-w-0 flex-1 truncate">{project.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { ProjectPicker, type ProjectPickerProps, type ProjectPickerStatus }
