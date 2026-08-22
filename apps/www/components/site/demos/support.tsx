'use client'

import { useEffect, useState } from 'react'
import { sampleAccount } from '@/components/site/sample-data'
import { apsProvider } from '@/lib/aps-oauth-preset'
import type { OAuthConnection } from '@/lib/oauth-types'
import type { Hub, Project } from '@/lib/project-types'
import { cn } from '@/lib/utils'

/**
 * Shared plumbing for the per-item demo modules in this directory. Each demo
 * lives in its own module so the docs pages can load exactly one of them via
 * dynamic import — this file holds only what several demos genuinely share.
 */

/** Expiry set after mount so statically generated pages never render a stale relative time. */
export function useDemoExpiry(minutesFromNow: number): Date | undefined {
  const [expiry, setExpiry] = useState<Date>()
  useEffect(() => {
    setExpiry(new Date(Date.now() + minutesFromNow * 60_000))
  }, [minutesFromNow])
  return expiry
}

/** A promise that settles like a real round trip, so pending states are visible. */
export function delay(ms = 900): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * The status vocabulary, as a demo control. "Expiring soon" is not a separate
 * OAuthConnectionStatus — it is a connected grant near its expiry, which is
 * exactly the point: the components derive the warning tone themselves.
 */
export type DemoState = 'connected' | 'expiring' | 'expired' | 'error' | 'disconnected'

export const demoStates: { id: DemoState; label: string }[] = [
  { id: 'connected', label: 'Connected' },
  { id: 'expiring', label: 'Expiring soon' },
  { id: 'expired', label: 'Expired' },
  { id: 'error', label: 'Error' },
  { id: 'disconnected', label: 'Not connected' },
]

interface StateSwitcherProps<T extends string> {
  value: T
  onChange: (value: T) => void
  label: string
  /** The states to offer. Generic so each demo names its own vocabulary. */
  states: { id: T; label: string }[]
}

export function StateSwitcher<T extends string>({
  value,
  onChange,
  label,
  states,
}: StateSwitcherProps<T>) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">{label}</legend>
      {states.map((state) => (
        <button
          key={state.id}
          type="button"
          aria-pressed={value === state.id}
          onClick={() => onChange(state.id)}
          className={cn(
            'focus-ring flex min-h-9 items-center rounded-md border border-border px-2.5',
            'text-xs transition-colors hover:bg-muted',
            'aria-pressed:border-primary aria-pressed:bg-primary',
            'aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary',
          )}
        >
          {state.label}
        </button>
      ))}
    </fieldset>
  )
}

/** The connection each demo state describes, for one provider. */
export function useDemoConnection(state: DemoState): OAuthConnection {
  const soonExpiry = useDemoExpiry(3)
  const laterExpiry = useDemoExpiry(42)
  const scopes = ['data:read', 'viewables:read']

  switch (state) {
    case 'connected':
      return {
        provider: apsProvider,
        status: 'connected',
        account: sampleAccount,
        scopes,
        expiresAt: laterExpiry,
      }
    case 'expiring':
      return {
        provider: apsProvider,
        status: 'connected',
        account: sampleAccount,
        scopes,
        expiresAt: soonExpiry,
      }
    case 'expired':
      return { provider: apsProvider, status: 'expired', account: sampleAccount, scopes }
    case 'error':
      return {
        provider: apsProvider,
        status: 'error',
        account: sampleAccount,
        error: 'Refresh token was revoked.',
      }
    case 'disconnected':
      return { provider: apsProvider, status: 'disconnected' }
  }
}

export const demoHubs: Hub[] = [
  { id: 'b.ridgeline-us', name: 'Ridgeline Builders', region: 'US' },
  { id: 'b.ridgeline-emea', name: 'Ridgeline Europe', region: 'EMEA' },
]

export const demoProjects: Project[] = [
  { id: 'b.summit-tower', name: 'Summit Tower', hubId: 'b.ridgeline-us' },
  { id: 'b.cedar-mill', name: 'Cedar Mill Campus', hubId: 'b.ridgeline-us' },
  { id: 'b.dockside', name: 'Dockside Renovation', hubId: 'b.ridgeline-us' },
  { id: 'b.harbor-point', name: 'Harbor Point Garage', hubId: 'b.ridgeline-emea' },
  { id: 'b.kanal-west', name: 'Kanalhaus West', hubId: 'b.ridgeline-emea' },
]
