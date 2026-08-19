'use client'

import type { ComponentType } from 'react'
import { useEffect, useState } from 'react'

import { procoreProvider, sampleAccount, sampleForeman } from '@/components/site/sample-data'
import { ConnectionCard } from '@/components/ui/connection-card'
import { ProviderSignInButton } from '@/components/ui/provider-sign-in-button'
import { ScopePicker } from '@/components/ui/scope-picker'
import { SignInCard } from '@/components/ui/sign-in-card'
import { TokenStatus } from '@/components/ui/token-status'
import { UserAccountBadge } from '@/components/ui/user-account-badge'
import { apsProvider, apsScopeCatalog, apsScopePresets } from '@/lib/aps-oauth-preset'
import type { OAuthConnection, OAuthConnectionStatus } from '@/lib/oauth-types'

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
      description="Connect a data source for the Summit Tower project."
      footer="Demo only — no real OAuth flow starts."
    />
  )
}

export function ScopePickerDemo({ compact = false }: { compact?: boolean }) {
  const [value, setValue] = useState<string[]>(['data:read', 'viewables:read'])
  const scopes = compact
    ? apsScopeCatalog.filter((scope) =>
        ['data:read', 'data:write', 'viewables:read', 'account:read'].includes(scope.id),
      )
    : apsScopeCatalog

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <ScopePicker
        scopes={scopes}
        value={value}
        onChange={setValue}
        presets={compact ? undefined : apsScopePresets}
      />
      <p className="border-border border-t pt-3 font-mono text-muted-foreground text-xs">
        scope={value.length > 0 ? value.join(' ') : '(none)'}
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
  const expiry = useDemoExpiry(42)
  const connected: OAuthConnection = {
    provider: apsProvider,
    status: 'connected',
    account: sampleAccount,
    scopes: ['data:read', 'viewables:read'],
    expiresAt: expiry,
  }
  const expired: OAuthConnection = { provider: apsProvider, status: 'expired' }
  const errored: OAuthConnection = {
    provider: procoreProvider,
    status: 'error',
    error: 'Refresh token was revoked.',
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <TokenStatus connection={connected} showScopes />
      <TokenStatus connection={expired} />
      <TokenStatus connection={errored} />
    </div>
  )
}

export function ConnectionCardDemo() {
  const expiry = useDemoExpiry(42)
  const [status, setStatus] = useState<OAuthConnectionStatus>('connected')
  const connected = status === 'connected'
  const connection: OAuthConnection = {
    provider: apsProvider,
    status,
    account: status === 'disconnected' ? undefined : sampleAccount,
    scopes: connected ? ['data:read', 'viewables:read'] : undefined,
    expiresAt: connected ? expiry : undefined,
  }

  return (
    <ConnectionCard
      className="max-w-sm"
      connection={connection}
      onDisconnect={() => setStatus('disconnected')}
      onReconnect={() => setStatus('connected')}
    />
  )
}

const demos: Record<string, ComponentType> = {
  'provider-sign-in-button': ProviderSignInButtonDemo,
  'sign-in-card': SignInCardDemo,
  'scope-picker': ScopePickerDemo,
  'user-account-badge': UserAccountBadgeDemo,
  'token-status': TokenStatusDemo,
  'connection-card': ConnectionCardDemo,
}

/** Docs-page entry point: renders the demo for a registry item, or nothing for lib items. */
export function ComponentDemo({ name }: { name: string }) {
  const Demo = demos[name]
  if (!Demo) return null
  return <Demo />
}
