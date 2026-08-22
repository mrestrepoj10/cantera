'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { ConnectionCard } from '@/components/ui/connection-card'
import type { OAuthConnection } from '@/lib/oauth-types'

interface AccConnectionPanelProps {
  connection: OAuthConnection
  /** POST target that clears the grant and session, e.g. "/api/auth/signout?next=/sign-in". */
  signOutHref: string
  /** GET target that restarts consent, e.g. "/api/auth/aps?next=/sign-in". */
  signInHref: string
}

/**
 * Client wrapper around ConnectionCard for the acc-sign-in block: disconnect
 * posts to the signout route, reconnect restarts the consent flow.
 */
function AccConnectionPanel({ connection, signOutHref, signInHref }: AccConnectionPanelProps) {
  const router = useRouter()
  const [disconnecting, setDisconnecting] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  // A transition keeps the disconnect pending until the server page has
  // actually re-rendered, rather than for the length of a fire-and-forget call.
  const [, startRefresh] = useTransition()

  async function disconnect() {
    setDisconnecting(true)
    try {
      await fetch(signOutHref, { method: 'POST', redirect: 'manual' })
    } finally {
      // Clearing pending is part of the same transition as the refresh, so the
      // Disconnect control keeps its spinner until the re-rendered server page
      // commits — never actionable again beside a stale connected row. The
      // refresh runs on failure too: the server view is the truth either way.
      startRefresh(() => {
        router.refresh()
        setDisconnecting(false)
      })
    }
  }

  return (
    <ConnectionCard
      connection={connection}
      // The handler is always passed: pending is a prop, never an absent
      // callback, so the pressed button stays mounted through the request.
      onDisconnect={disconnect}
      disconnectPending={disconnecting}
      onReconnect={() => {
        setReconnecting(true)
        window.location.href = signInHref
      }}
      reconnectPending={reconnecting}
    />
  )
}

export { AccConnectionPanel, type AccConnectionPanelProps }
