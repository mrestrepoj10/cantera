'use client'

import type { ComponentType } from 'react'
import { useEffect, useState } from 'react'

import { procoreProvider, sampleAccount, sampleForeman } from '@/components/site/sample-data'
import { ConnectionCard } from '@/components/ui/connection-card'
import { ProviderSignInButton } from '@/components/ui/provider-sign-in-button'
import { ScopePicker, withRequiredScopes } from '@/components/ui/scope-picker'
import { SignInCard } from '@/components/ui/sign-in-card'
import {
  type StatusTone,
  statusInkClasses,
  statusToneClasses,
  TokenStatus,
} from '@/components/ui/token-status'
import { UserAccountBadge } from '@/components/ui/user-account-badge'
import { apsProvider, apsScopeCatalog, apsScopePresets } from '@/lib/aps-oauth-preset'
import type { OAuthConnection } from '@/lib/oauth-types'
import { cn } from '@/lib/utils'

/**
 * Live demos for the docs pages and the landing preview strip. All state is
 * local — the components themselves are controlled and data-agnostic.
 */

/** Expiry set after mount so statically generated pages never render a stale relative time. */
function useDemoExpiry(minutesFromNow: number): Date | undefined {
  const [expiry, setExpiry] = useState<Date>()
  useEffect(() => {
    setExpiry(new Date(Date.now() + minutesFromNow * 60_000))
  }, [minutesFromNow])
  return expiry
}

/** A promise that settles like a real round trip, so pending states are visible. */
function delay(ms = 900): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * The status vocabulary, as a demo control. "Expiring soon" is not a separate
 * OAuthConnectionStatus — it is a connected grant near its expiry, which is
 * exactly the point: the components derive the warning tone themselves.
 */
type DemoState = 'connected' | 'expiring' | 'expired' | 'error' | 'disconnected'

const demoStates: { id: DemoState; label: string }[] = [
  { id: 'connected', label: 'Connected' },
  { id: 'expiring', label: 'Expiring soon' },
  { id: 'expired', label: 'Expired' },
  { id: 'error', label: 'Error' },
  { id: 'disconnected', label: 'Not connected' },
]

interface StateSwitcherProps {
  value: DemoState
  onChange: (value: DemoState) => void
  label: string
}

function StateSwitcher({ value, onChange, label }: StateSwitcherProps) {
  return (
    <fieldset className="flex flex-wrap gap-2">
      <legend className="sr-only">{label}</legend>
      {demoStates.map((state) => (
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
function useDemoConnection(state: DemoState): OAuthConnection {
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

export function ProviderSignInButtonDemo() {
  const [loadingId, setLoadingId] = useState<string>()

  function signIn(id: string) {
    setLoadingId(id)
    window.setTimeout(() => setLoadingId(undefined), 1400)
  }

  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <ProviderSignInButton
        provider={apsProvider}
        onSignIn={() => signIn(apsProvider.id)}
        loading={loadingId === apsProvider.id}
      />
      <ProviderSignInButton
        provider={procoreProvider}
        variant="secondary"
        size="default"
        onSignIn={() => signIn(procoreProvider.id)}
        loading={loadingId === procoreProvider.id}
      />
    </div>
  )
}

export function SignInCardDemo() {
  const [loadingProvider, setLoadingProvider] = useState<string>()

  function signIn(providerId: string) {
    setLoadingProvider(providerId)
    window.setTimeout(() => setLoadingProvider(undefined), 1400)
  }

  return (
    <SignInCard
      providers={[apsProvider, procoreProvider]}
      onSignIn={signIn}
      loadingProvider={loadingProvider}
      title="Sign in to Ridgeline"
      // The pages this demo appears on already own h1 and h2, so the card's
      // heading slots in one level down rather than restarting the outline.
      titleAs="h3"
      description="Connect a data source for the Summit Tower project."
      footer="Demo only — no real OAuth flow starts."
    />
  )
}

/**
 * The APS catalog marks nothing required, so the demo pins one scope on. That
 * is what a provider with a mandatory scope looks like, and it makes
 * withRequiredScopes visible in the scope line below.
 */
const demoScopeCatalog = apsScopeCatalog.map((scope) =>
  scope.id === 'user-profile:read' ? { ...scope, required: true } : scope,
)

export function ScopePickerDemo({ compact = false }: { compact?: boolean }) {
  const [value, setValue] = useState<string[]>(['data:read', 'viewables:read'])
  const scopes = compact
    ? demoScopeCatalog.filter((scope) =>
        ['user-profile:read', 'data:read', 'data:write', 'viewables:read'].includes(scope.id),
      )
    : demoScopeCatalog
  // What actually goes on the wire: the selection, plus the scopes the catalog
  // requires. The picker never backfills those into `value` itself.
  const scope = withRequiredScopes(scopes, value)

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ScopePicker
        scopes={scopes}
        value={value}
        onChange={setValue}
        presets={compact ? undefined : apsScopePresets}
        allowCustomScopes
      />
      <p className="border-border border-t pt-3 font-mono text-muted-foreground text-xs">
        scope={scope.length > 0 ? scope.join(' ') : '(none)'}
      </p>
    </div>
  )
}

export function UserAccountBadgeDemo() {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <UserAccountBadge account={sampleAccount} provider={apsProvider} />
      <UserAccountBadge account={sampleForeman} provider={procoreProvider} size="sm" />
      <UserAccountBadge account={{ email: 'inspector@citypermits.gov' }} size="sm" />
    </div>
  )
}

export function TokenStatusDemo() {
  const [state, setState] = useState<DemoState>('connected')
  const connection = useDemoConnection(state)

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <StateSwitcher value={state} onChange={setState} label="Connection state" />
      <div className="rounded-lg border border-border p-4">
        <TokenStatus connection={connection} showScopes />
      </div>
      <p className="text-muted-foreground text-xs">
        Expiring soon and expired are the same tone — warning, because both are a refresh away. Only
        a real failure takes danger.
      </p>
    </div>
  )
}

export function ConnectionCardDemo() {
  const [state, setState] = useState<DemoState>('connected')
  const connection = useDemoConnection(state)

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <StateSwitcher value={state} onChange={setState} label="Connection state" />
      <ConnectionCard
        connection={connection}
        // Both handlers return a promise, so the card drives its own pending
        // state: the button keeps its label, spins, and stays put.
        onDisconnect={async () => {
          await delay()
          setState('disconnected')
        }}
        onReconnect={async () => {
          await delay()
          setState('connected')
        }}
      />
    </div>
  )
}

interface ToneSample {
  tone: StatusTone
  meaning: string
  surface: string
}

const toneSamples: ToneSample[] = [
  {
    tone: 'success',
    meaning: 'Healthy. A live grant that needs nothing.',
    surface: 'bg-status-success-surface text-status-success',
  },
  {
    tone: 'warning',
    meaning: 'Recoverable, needs attention. Expiring soon and expired both live here.',
    surface: 'bg-status-warning-surface text-status-warning',
  },
  {
    tone: 'danger',
    meaning: 'A failure the user must act on — a revoked grant, a rejected scope.',
    surface: 'bg-status-danger-surface text-status-danger',
  },
  {
    tone: 'neutral',
    meaning: 'Absence. Never connected, nothing to report.',
    surface: 'bg-status-neutral-surface text-status-neutral',
  },
]

/** The four tones in all three treatments, so the palette is legible at a glance. */
export function StatusTokensDemo() {
  return (
    <div className="flex w-full flex-col gap-4">
      {toneSamples.map((sample) => (
        <div
          key={sample.tone}
          className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3"
        >
          <div className="flex min-w-0 flex-col justify-center gap-0.5 sm:w-56">
            <span className="font-mono text-code">--status-{sample.tone}</span>
            <span className="text-muted-foreground text-xs">{sample.meaning}</span>
          </div>
          <div
            className={cn(
              'flex flex-1 items-center rounded-md px-3 py-2 font-medium text-sm',
              statusToneClasses[sample.tone],
            )}
          >
            Solid fill, -foreground ink
          </div>
          <div
            className={cn('flex flex-1 items-center rounded-md px-3 py-2 text-sm', sample.surface)}
          >
            -surface, text-status ink
          </div>
          <div className="flex flex-1 items-center px-3 py-2 text-sm">
            <span className={statusInkClasses[sample.tone]}>Ink on the page</span>
          </div>
        </div>
      ))}
    </div>
  )
}

const demos: Record<string, ComponentType> = {
  'provider-sign-in-button': ProviderSignInButtonDemo,
  'sign-in-card': SignInCardDemo,
  'scope-picker': ScopePickerDemo,
  'user-account-badge': UserAccountBadgeDemo,
  'token-status': TokenStatusDemo,
  'connection-card': ConnectionCardDemo,
  'status-tokens': StatusTokensDemo,
}

/** Docs-page entry point: renders the demo for a registry item, or nothing for lib items. */
export function ComponentDemo({ name }: { name: string }) {
  const Demo = demos[name]
  if (!Demo) return null
  return <Demo />
}
