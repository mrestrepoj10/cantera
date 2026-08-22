'use client'

import { useState } from 'react'
import { ConnectionsView } from '@/components/connections-view'
import { delay, StateSwitcher, useDemoExpiry } from '@/components/site/demos/support'
import {
  fieldlinkProvider,
  procoreProvider,
  sampleAccount,
  sampleForeman,
  sampleInspector,
  siteworksProvider,
} from '@/components/site/sample-data'
import { apsProvider } from '@/lib/aps-oauth-preset'
import type { OAuthConnection } from '@/lib/oauth-types'

/**
 * The connections-page block, in the four states it ships. The switcher is the
 * point: empty, loading, and error are designed surfaces here, not afterthoughts
 * a consumer has to invent.
 */
type ConnectionsDemoState = 'partial' | 'empty' | 'loading' | 'error'

const connectionsDemoStates: { id: ConnectionsDemoState; label: string }[] = [
  { id: 'partial', label: 'Partial' },
  { id: 'empty', label: 'Empty' },
  { id: 'loading', label: 'Loading' },
  { id: 'error', label: 'Error' },
]

const connectionsDemoStatus = {
  partial: 'ready',
  empty: 'ready',
  loading: 'loading',
  error: 'error',
} as const

const connectionsDemoProviders = [
  apsProvider,
  procoreProvider,
  fieldlinkProvider,
  siteworksProvider,
]

/**
 * One grant per provider, covering the whole status vocabulary in one list:
 * healthy, expiring soon (a connected grant near its expiry), a real failure,
 * and — via the provider the demo starts with disconnected — absence.
 */
function useDemoConnections(): OAuthConnection[] {
  const soonExpiry = useDemoExpiry(4)
  const laterExpiry = useDemoExpiry(42)

  return [
    {
      provider: apsProvider,
      status: 'connected',
      account: sampleAccount,
      scopes: ['data:read', 'viewables:read'],
      expiresAt: laterExpiry,
    },
    {
      provider: procoreProvider,
      status: 'connected',
      account: sampleForeman,
      scopes: ['rfis:read'],
      expiresAt: soonExpiry,
    },
    {
      provider: fieldlinkProvider,
      status: 'error',
      account: sampleInspector,
      scopes: ['documents:read'],
      error: 'Refresh token was revoked.',
    },
    {
      provider: siteworksProvider,
      status: 'connected',
      account: sampleAccount,
      scopes: ['assets:read'],
      expiresAt: laterExpiry,
    },
  ]
}

export function ConnectionsPageDemo() {
  const [state, setState] = useState<ConnectionsDemoState>('partial')
  const held = useDemoConnections()
  // Which grants are gone. Disconnecting adds one, connecting removes one, and
  // "empty" is simply all of them — so every state is the same one data path.
  const [revoked, setRevoked] = useState<string[]>([siteworksProvider.id])
  const connections = held.filter((connection) => !revoked.includes(connection.provider.id))

  function selectState(next: ConnectionsDemoState) {
    setState(next)
    setRevoked(
      next === 'empty' ? held.map((connection) => connection.provider.id) : [siteworksProvider.id],
    )
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-5">
      <StateSwitcher
        value={state}
        onChange={selectState}
        label="Page state"
        states={connectionsDemoStates}
      />
      <ConnectionsView
        providers={connectionsDemoProviders}
        connections={connections}
        status={connectionsDemoStatus[state]}
        error={state === 'error' ? 'The token vault did not respond.' : undefined}
        account={sampleAccount}
        // The docs page already owns h1 and h2, so the block heading slots in
        // one level down rather than restarting the outline.
        titleAs="h3"
        showScopes={false}
        // Every callback returns a promise, so the cards drive their own
        // pending: the pressed button keeps its label, spins, and stays put.
        onConnect={async (providerId) => {
          await delay()
          setState('partial')
          setRevoked((current) => current.filter((id) => id !== providerId))
        }}
        onDisconnect={async (providerId) => {
          await delay()
          setRevoked((current) => [...current, providerId])
        }}
        onRetry={async () => {
          await delay()
          selectState('partial')
        }}
      />
    </div>
  )
}
