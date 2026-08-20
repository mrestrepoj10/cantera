'use client'

import { useState } from 'react'

import { ConnectionCard } from '@/components/ui/connection-card'
import { apsProvider } from '@/lib/aps-oauth-preset'
import type { OAuthConnection } from '@/lib/oauth-types'

const account = { name: 'Dana Alvarez', email: 'dana@ridgelinebuilders.com' }
const scopes = ['data:read', 'viewables:read']

/** Stands in for the round trip a real disconnect or reconnect makes. */
function settle(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 900)
  })
}

export function ConnectionCardDemo() {
  const [connected, setConnected] = useState(true)

  const connection: OAuthConnection = connected
    ? {
        provider: apsProvider,
        status: 'connected',
        account,
        scopes,
        expiresAt: Date.now() + 42 * 60_000,
      }
    : { provider: apsProvider, status: 'disconnected' }

  return (
    <ConnectionCard
      connection={connection}
      // Both callbacks return a promise, so the card drives its own pending
      // state: the pressed button keeps its label, spins, and stays put.
      onDisconnect={async () => {
        await settle()
        setConnected(false)
      }}
      onReconnect={async () => {
        await settle()
        setConnected(true)
      }}
    />
  )
}
