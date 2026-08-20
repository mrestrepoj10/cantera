'use client'

import { LoaderCircleIcon } from 'lucide-react'
import { useState } from 'react'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type SheetVersionSet, versionSetIssuance } from '@/lib/project-types'
import { cn } from '@/lib/utils'

/** Locale-neutral issuance date: "Mar 12, 2026" in en, "12 mars 2026" in fr. */
function formatIssuance(date: Date, locale?: string | string[]): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

interface VersionSetSelectProps {
  versionSets: SheetVersionSet[]
  /** Selected version set id (controlled). */
  value?: string
  /** Initially selected version set id (uncontrolled). */
  defaultValue?: string
  /**
   * Called with the chosen version set id. Return a promise and the select
   * drives its own pending state for the duration — or drive it with `pending`.
   */
  onValueChange?: (versionSetId: string) => void | Promise<void>
  /**
   * Pending: the trigger keeps showing the current set, crossfades in a
   * spinner, and goes read-only — still focusable, never unmounted.
   */
  pending?: boolean
  disabled?: boolean
  placeholder?: string
  /** BCP 47 locale(s) for the issuance dates. Defaults to the runtime locale. */
  locale?: string | string[]
  /** Shown inside the open list when there are no version sets at all. */
  emptyMessage?: string
  /**
   * Accessible name for the trigger. A combobox never takes its name from its
   * content — without this the control announces its value but not what it is.
   */
  'aria-label'?: string
  className?: string
}

/**
 * Which issuance of the sheets to read from — "Permit Set", "IFC 2026-03".
 * On site, building from a superseded set is an expensive mistake, so every
 * option carries its issuance date and the selection is explicit, never
 * implicit-latest.
 */
function VersionSetSelect({
  versionSets,
  value,
  defaultValue,
  onValueChange,
  pending = false,
  disabled = false,
  placeholder = 'Select version set',
  locale,
  emptyMessage = 'No version sets published yet.',
  'aria-label': ariaLabel = 'Version set',
  className,
}: VersionSetSelectProps) {
  const [asyncPending, setAsyncPending] = useState(false)
  const busy = pending || asyncPending
  const byId = new Map(versionSets.map((versionSet) => [versionSet.id, versionSet]))

  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      readOnly={busy}
      disabled={disabled}
      onValueChange={(next: string | null) => {
        if (next == null || !onValueChange) return
        const result = onValueChange(next)
        if (!(result instanceof Promise)) return
        setAsyncPending(true)
        result.then(
          () => setAsyncPending(false),
          () => setAsyncPending(false),
        )
      }}
    >
      <SelectTrigger
        data-slot="version-set-select"
        aria-label={ariaLabel}
        aria-busy={busy || undefined}
        // gap-0 so the collapsed spinner slot leaves no phantom inset at rest
        // (the chevron gets its margin back explicitly); the pseudo-element
        // extends the hit area to the 44px field-density floor.
        className={cn(
          'relative w-full gap-0 after:absolute after:-inset-y-2 after:inset-x-0 [&>svg]:ml-1.5',
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
          <LoaderCircleIcon
            className={cn(
              'size-4 animate-spin transition-[opacity,scale,filter] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
              busy ? 'scale-100 opacity-100 blur-none' : 'scale-25 opacity-0 blur-[4px]',
            )}
          />
        </span>
        <SelectValue placeholder={placeholder}>
          {(selected: string | null) => {
            const versionSet = selected != null ? byId.get(selected) : undefined
            if (!versionSet) return placeholder
            const issued = versionSetIssuance(versionSet)
            return (
              <>
                <span className="min-w-0 truncate">{versionSet.name}</span>
                {issued && (
                  <time
                    dateTime={issued.toISOString()}
                    suppressHydrationWarning
                    className="shrink-0 text-muted-foreground text-xs tabular-nums"
                  >
                    {formatIssuance(issued, locale)}
                  </time>
                )}
              </>
            )
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {versionSets.length === 0 && (
          <p
            className="px-3 py-4 text-muted-foreground text-sm"
            data-slot="version-set-select-empty"
          >
            {emptyMessage}
          </p>
        )}
        {versionSets.map((versionSet) => {
          const issued = versionSetIssuance(versionSet)
          return (
            <SelectItem key={versionSet.id} value={versionSet.id}>
              <span className="min-w-0 flex-1 truncate">{versionSet.name}</span>
              {issued && (
                <time
                  dateTime={issued.toISOString()}
                  suppressHydrationWarning
                  className="shrink-0 text-muted-foreground text-xs tabular-nums"
                >
                  {formatIssuance(issued, locale)}
                </time>
              )}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}

export { VersionSetSelect, type VersionSetSelectProps }
