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
import type { Hub } from '@/lib/project-types'
import { cn } from '@/lib/utils'

interface HubSwitcherProps {
  hubs: Hub[]
  value?: string
  defaultValue?: string
  /** Promise-returning handlers drive the switcher's pending state. */
  onValueChange?: (hubId: string) => void | Promise<void>
  pending?: boolean
  disabled?: boolean
  placeholder?: string
  emptyMessage?: string
  /** A combobox never takes its name from its content — without this the
   * control announces its value but not what it is. */
  'aria-label'?: string
  className?: string
}

/** Thenable check, not `instanceof Promise`: a polyfilled or cross-realm
 * promise is still a pending round trip the trigger must reflect. */
function isPromiseLike(value: void | Promise<void>): value is Promise<void> {
  return value != null && typeof (value as Promise<void>).then === 'function'
}

function HubSwitcher({
  hubs,
  value,
  defaultValue,
  onValueChange,
  pending = false,
  disabled = false,
  placeholder = 'Select hub',
  emptyMessage = 'No hubs available.',
  'aria-label': ariaLabel = 'Hub',
  className,
}: HubSwitcherProps) {
  const [asyncPending, setAsyncPending] = useState(false)
  const busy = pending || asyncPending
  const byId = new Map(hubs.map((hub) => [hub.id, hub]))

  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      // Read-only while busy: the popup cannot open, but the trigger keeps
      // focus and its label.
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
        data-slot="hub-switcher"
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
            const hub = selected != null ? byId.get(selected) : undefined
            if (!hub) return placeholder
            return (
              <>
                <span className="min-w-0 truncate">{hub.name}</span>
                {hub.region && (
                  <span className="shrink-0 text-muted-foreground text-xs">{hub.region}</span>
                )}
              </>
            )
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {hubs.length === 0 && (
          <p className="px-3 py-4 text-muted-foreground text-sm" data-slot="hub-switcher-empty">
            {emptyMessage}
          </p>
        )}
        {hubs.map((hub) => (
          <SelectItem key={hub.id} value={hub.id}>
            <span className="min-w-0 flex-1 truncate">{hub.name}</span>
            {hub.region && (
              <span className="shrink-0 text-muted-foreground text-xs">{hub.region}</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { HubSwitcher, type HubSwitcherProps }
