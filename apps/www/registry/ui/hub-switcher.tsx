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
  /** Selected hub id (controlled). */
  value?: string
  /** Initially selected hub id (uncontrolled). */
  defaultValue?: string
  /**
   * Called with the chosen hub id. Return a promise and the switcher drives
   * its own pending state for the duration — or drive it with `pending`.
   */
  onValueChange?: (hubId: string) => void | Promise<void>
  /**
   * Pending: the trigger keeps showing the current hub, crossfades in a
   * spinner, and goes read-only — still focusable, never unmounted.
   */
  pending?: boolean
  disabled?: boolean
  placeholder?: string
  /**
   * Accessible name for the trigger. A combobox never takes its name from its
   * content — without this the control announces its value but not what it is.
   */
  'aria-label'?: string
  className?: string
}

/**
 * The hub context switch — which ACC hub (or Procore company, or any Hub) the
 * rest of the screen works against. A select, not a combobox: hubs are few.
 */
function HubSwitcher({
  hubs,
  value,
  defaultValue,
  onValueChange,
  pending = false,
  disabled = false,
  placeholder = 'Select hub',
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
      // Read-only while busy: the popup cannot open, the trigger keeps focus
      // and its label — pending never unmounts or collapses the control.
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
        data-slot="hub-switcher"
        aria-label={ariaLabel}
        aria-busy={busy || undefined}
        // The pseudo-element extends the hit area to the 44px field-density
        // floor without growing the visual box.
        className={cn('relative w-full after:absolute after:-inset-y-2 after:inset-x-0', className)}
      >
        {/* Collapsed at rest; morphs open while busy with the icon crossfade. */}
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
