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

// One formatter per locale, not per render: construction is the expensive part of Intl.
const issuanceFormatters = new Map<string, Intl.DateTimeFormat>()

function issuanceFormatter(locale?: string | string[]): Intl.DateTimeFormat {
  const key = Array.isArray(locale) ? locale.join(',') : (locale ?? '')
  let formatter = issuanceFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
    issuanceFormatters.set(key, formatter)
  }
  return formatter
}

function formatIssuance(date: Date, locale?: string | string[]): string {
  return issuanceFormatter(locale).format(date)
}

/** Thenable check, not `instanceof Promise`: a polyfilled or cross-realm
 * promise is still a pending round trip the trigger must reflect. */
function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return value != null && typeof (value as Promise<void>).then === 'function'
}

interface VersionSetSelectProps {
  versionSets: SheetVersionSet[]
  value?: string
  defaultValue?: string
  /** Promise-returning handlers drive the select's pending state. */
  onValueChange?: (versionSetId: string) => void | Promise<void>
  pending?: boolean
  disabled?: boolean
  placeholder?: string
  locale?: string | string[]
  emptyMessage?: string
  /** A combobox never takes its name from its content — without this the
   * control announces its value but not what it is. */
  'aria-label'?: string
  className?: string
}

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
        if (!isPromiseLike(result)) return
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
        // The pseudo-element extends the hit area to the 44px floor.
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
          {/* The spin lives on a wrapper: transform animations on the <svg>
              itself skip the compositor in some engines. */}
          <span className="grid size-4 animate-spin place-items-center">
            <LoaderCircleIcon
              className={cn(
                'size-4 transition-[opacity,scale,filter] duration-150 ease-[cubic-bezier(0.2,0,0,1)] motion-reduce:transition-none',
                busy ? 'scale-100 opacity-100 blur-none' : 'scale-25 opacity-0 blur-[4px]',
              )}
            />
          </span>
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
